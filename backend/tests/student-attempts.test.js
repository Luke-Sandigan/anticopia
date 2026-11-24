
import {
  before,
  after,
  beforeEach,
  test
} from 'node:test';

import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../app.js';
import { connectToDatabase } from '../database.js';

import { User } from '../models/user.model.js';
import { Class } from '../models/class.model.js';
import { Enrollment } from '../models/enrollment.model.js';
import { Exam } from '../models/exam.model.js';
import { Submission } from '../models/submission.model.js';
import { Grade } from '../models/grade.model.js';
import { Flag } from '../models/flag.model.js';
import { expireAttempts } from '../services/attempt-expiry.service.js';

let mongo;
let server;
let base;
let student;
let outsider;
let teacher;

const hoursFromNow = hours =>
  new Date(Date.now() + hours * 3600000);

async function request(method, path, token, body, headers = {}) {
  const response = await fetch(`${base}/api${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...headers
    },
    ...(body !== undefined
      ? { body: JSON.stringify(body) }
      : {})
  });

  const text = await response.text();

  return {
    status: response.status,
    body: text ? JSON.parse(text) : null
  };
}

async function register(role, id) {
  const result = await request(
    'POST',
    `/auth/register/${role}`,
    null,
    {
      firstName: 'Test',
      lastName: 'User',
      email: `${id}@example.com`,
      password: 'password123',
      ...(role === 'student'
        ? { studentId: id }
        : { employeeId: id, department: 'IT' })
    }
  );

  assert.equal(result.status, 201);
  return result.body;
}

before(async () => {
  mongo = await MongoMemoryServer.create({
    instance: { launchTimeout: 60000 }
  });

  process.env.MONGODB_URI = mongo.getUri();

  await connectToDatabase();

  server = app.listen(0, '127.0.0.1');

  await new Promise(resolve =>
    server.once('listening', resolve)
  );

  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) {
    await new Promise(resolve =>
      server.close(resolve)
    );
  }

  await mongoose.disconnect();
  await mongo?.stop();
});

beforeEach(async () => {
  await Promise.all(
    [
      User,
      Class,
      Enrollment,
      Exam,
      Submission,
      Grade,
      Flag
    ].map(model => model.deleteMany({}))
  );

  student = await register('student', 'S-001');
  outsider = await register('student', 'S-002');
  teacher = await register('teacher', 'T-001');

  await Class.create({
    classId: 'class-1',
    name: 'Data Structures',
    section: 'A',
    subject: 'IT',
    term: '2026',
    code: 'IT201',
    teacherId: teacher.user.id
  });

  await Enrollment.create({
    classId: 'class-1',
    studentId: student.user.studentId,
    userId: student.user.id,
    name: 'Test Student',
    enrollment: 'Enrolled'
  });
});

async function createExam(overrides = {}) {
  return Exam.create({
    examId: 'exam-1',
    classId: 'class-1',
    name: 'Midterm Examination',
    instructions: 'Read each question carefully.',
    duration: 60,
    published: true,
    startsAt: hoursFromNow(-1),
    endsAt: hoursFromNow(2),
    detectMultiDevice: true,
    detectTabSwitches: true,
    captureScreenshots: false,
    questions: [
      {
        id: 'q-1',
        type: 'Multiple choice',
        question: 'What is 2 + 2?',
        choices: ['3', '4'],
        correctAnswer: '4',
        points: 1
      },
      {
        id: 'q-2',
        type: 'True/false',
        question: 'The earth is round.',
        correctAnswer: 'true',
        points: 1
      }
    ],
    ...overrides
  });
}

async function start(token = student.token) {
  return request(
    'POST',
    '/exams/exam-1/attempts',
    token
  );
}

async function openAttempt(id, sessionId) {
  return request(
    'GET',
    `/attempts/${id}`,
    student.token,
    undefined,
    sessionId
      ? { 'X-Attempt-Session': sessionId }
      : {}
  );
}

async function save(id, questionId, response) {
  return request(
    'PUT',
    `/attempts/${id}/answers/${questionId}`,
    student.token,
    { response }
  );
}

async function submit(id) {
  return request(
    'POST',
    `/attempts/${id}/submit`,
    student.token
  );
}

// 1. Start successfully and reject duplicates.
test('starting twice returns 409', async () => {
  await createExam();

  const first = await start();
  assert.equal(first.status, 201);
  assert.ok(first.body.attemptId);

  const second = await start();
  assert.equal(second.status, 409);

  const count = await Submission.countDocuments({
    examId: 'exam-1',
    studentId: 'S-001'
  });

  assert.equal(count, 1);
});

// 2. Starting outside the window is forbidden.
test('starting outside the window returns 403', async () => {
  await createExam({
    startsAt: hoursFromNow(1),
    endsAt: hoursFromNow(3)
  });

  const result = await start();

  assert.equal(result.status, 403);
});

// 3. Autosaved answers survive refetches.
test('autosaved answers are returned after refetch', async () => {
  await createExam();

  const started = await start();
  assert.equal(started.status, 201);

  const id = started.body.attemptId;

  const saved = await save(id, 'q-1', '4');
  assert.equal(saved.status, 200);

  const result = await openAttempt(
    id,
    started.body.sessionId
  );

  assert.equal(result.status, 200);

  assert.ok(
    result.body.answers.some(answer =>
      answer.questionId === 'q-1' &&
      answer.response === '4'
    )
  );
});

// 4. Timer is calculated by the server.
test('remaining time decreases and ignores client time', async () => {
  await createExam();

  const started = await start();
  const id = started.body.attemptId;

  const first = await openAttempt(
    id,
    started.body.sessionId
  );

  assert.equal(first.status, 200);

  // Move the server-side attempt start 30 seconds back.
  await Submission.collection.updateOne(
    { submissionId: id },
    {
      $set: {
        createdAt: new Date(Date.now() - 30000)
      }
    }
  );

  const second = await request(
    'GET',
    `/attempts/${id}?timeRemainingSeconds=999999`,
    student.token,
    undefined,
    {
      'X-Attempt-Session': started.body.sessionId
    }
  );

  assert.equal(second.status, 200);

  assert.ok(
    second.body.timeRemainingSeconds <
    first.body.timeRemainingSeconds
  );

  assert.notEqual(
    second.body.timeRemainingSeconds,
    999999
  );
});

// 5. Repeated submission is idempotent.
test('submitting twice returns the same result', async () => {
  await createExam();

  const started = await start();
  const id = started.body.attemptId;

  await save(id, 'q-1', '4');

  const first = await submit(id);
  const second = await submit(id);

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);

  assert.deepEqual(first.body, second.body);

  const count = await Submission.countDocuments({
    submissionId: id
  });

  assert.equal(count, 1);
});

// 6. Opening from another session records an event.
test('second session records multi_device event', async () => {
  await createExam();

  const started = await start();
  const id = started.body.attemptId;

  const first = await openAttempt(
    id,
    started.body.sessionId
  );

  assert.equal(first.status, 200);

  const second = await openAttempt(
    id,
    'second-device-session'
  );

  assert.equal(second.status, 200);

  const event = await Flag.findOne({
    examId: 'exam-1',
    studentId: 'S-001',
    type: 'multi_device'
  }).lean();

  assert.ok(event);
  assert.equal(event.evidence.attemptId, id);
});

// 7. Questions and answer keys stay protected.
test('attempt responses do not contain answer keys', async () => {
  await createExam();

  const started = await start();

  const result = await openAttempt(
    started.body.attemptId,
    started.body.sessionId
  );

  assert.equal(result.status, 200);

  const json = JSON.stringify(result.body);

  assert.equal(json.includes('correctAnswer'), false);
  assert.equal(json.includes('autoGraded'), false);

  assert.equal(result.body.questions.length, 2);
});

// 8. Answers cannot be edited after submitting.
test('editing an answer after submission returns 409', async () => {
  await createExam();

  const started = await start();
  const id = started.body.attemptId;

  await submit(id);

  const result = await save(id, 'q-1', '3');

  assert.equal(result.status, 409);
});

// 9. MCQ and True/False are automatically graded.
test('objective answers are graded on submission', async () => {
  await createExam();

  const started = await start();
  const id = started.body.attemptId;

  assert.equal((await save(id, 'q-1', '4')).status, 200);
  assert.equal((await save(id, 'q-2', true)).status, 200);

  const result = await submit(id);

  assert.equal(result.status, 200);
  assert.equal(result.body.status, 'graded');

  const submission = await Submission.findOne({
    submissionId: id
  }).lean();

  assert.equal(submission.totalScore, 2);
  assert.equal(submission.totalPoints, 2);
});

// 10. Expired attempts finalize on access.
test('expired attempts are submitted automatically on access', async () => {
  await createExam();

  const started = await start();
  const id = started.body.attemptId;

  await Submission.collection.updateOne(
    { submissionId: id },
    {
      $set: {
        createdAt: new Date(Date.now() - 7200000)
      }
    }
  );

  const result = await openAttempt(
    id,
    started.body.sessionId
  );

  assert.equal(result.status, 200);
  assert.notEqual(result.body.status, 'in_progress');
  assert.equal(result.body.timeRemainingSeconds, 0);
});

// 11. Only the owner may access an attempt.
test('another student cannot read the attempt', async () => {
  await createExam();

  const started = await start();

  const result = await request(
    'GET',
    `/attempts/${started.body.attemptId}`,
    outsider.token
  );

  assert.equal(result.status, 404);
});

// 12. Students outside the class cannot start.
test('unenrolled student cannot start exam', async () => {
  await createExam();

  const result = await start(outsider.token);

  assert.equal(result.status, 403);
});

test('expiration worker submits attempts without an API request', async () => {
  await createExam();

  const started = await start();

  assert.equal(started.status, 201);

  const attemptId = started.body.attemptId;

  // Save an answer before the attempt expires.
  const saved = await save(attemptId, 'q-1', '4');
  assert.equal(saved.status, 200);

  // Simulate an attempt whose deadline has passed.
  await Submission.collection.updateOne(
    { submissionId: attemptId },
    {
      $set: {
        createdAt: new Date(Date.now() - 7200000)
      }
    }
  );

  // Run the expiration worker directly.
  // No GET or submit request is sent.
  await expireAttempts();

  const submission = await Submission.findOne({
    submissionId: attemptId
  }).lean();

  assert.ok(submission);
  assert.equal(submission.status, 'graded');
  assert.ok(submission.submittedAt);
  assert.equal(submission.totalScore, 1);

  // Check that the grading record was generated.
  const grade = await Grade.findOne({
    examId: 'exam-1',
    studentId: student.user.studentId
  }).lean();

  assert.ok(grade);
  assert.equal(grade.percentage, 50);
});

// ==========================================
// BE-17: CONCURRENT SUBMISSION TEST
// ==========================================

test('simultaneous submissions do not duplicate grading', async () => {
  await createExam();

  const started = await start();
  assert.equal(started.status, 201);

  const id = started.body.attemptId;

  await save(id, 'q-1', '4');

  // Simulate two submit requests arriving together.
  const [first, second] = await Promise.all([
    submit(id),
    submit(id)
  ]);

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);

  assert.deepEqual(first.body, second.body);

  const submissions = await Submission.find({
    submissionId: id
  }).lean();

  assert.equal(submissions.length, 1);
  assert.equal(submissions[0].status, 'graded');
  assert.equal(submissions[0].totalScore, 1);

  const grades = await Grade.find({
    examId: 'exam-1',
    studentId: student.user.studentId
  }).lean();

  assert.equal(grades.length, 1);
  assert.equal(grades[0].percentage, 50);
});

// ==========================================
// BE-17: AUTOSAVE/SUBMISSION RACE TEST
// ==========================================

test('simultaneous autosave and submission preserve finalized answers', async () => {
  await createExam();

  const started = await start();
  assert.equal(started.status, 201);

  const id = started.body.attemptId;

  await save(id, 'q-1', '4');

  // Autosave and submit at almost the same time.
  const [saveResult, submitResult] = await Promise.all([
    save(id, 'q-1', '3'),
    submit(id)
  ]);

  // Autosave may succeed if it gets processed first,
  // or receive 409 if submission gets processed first.
  assert.ok([200, 409].includes(saveResult.status));
  assert.equal(submitResult.status, 200);

  const finalized = await Submission.findOne({
    submissionId: id
  }).lean();

  assert.ok(finalized);
  assert.equal(finalized.status, 'graded');

  const savedAnswer = finalized.answers.find(
    answer => answer.questionId === 'q-1'
  );

  assert.ok(savedAnswer);

  // If autosave completed first, the final answer is 3.
  // Otherwise, the final answer remains 4.
  if (saveResult.status === 200) {
    assert.equal(savedAnswer.response, '3');
  } else {
    assert.equal(savedAnswer.response, '4');
  }

  // Additional requests after submission must be rejected.
  const afterSubmit = await save(id, 'q-1', '4');

  assert.equal(afterSubmit.status, 409);

  // Confirm the rejected request did not change the answer.
  const checked = await Submission.findOne({
    submissionId: id
  }).lean();

  const checkedAnswer = checked.answers.find(
    answer => answer.questionId === 'q-1'
  );

  assert.equal(
    checkedAnswer.response,
    savedAnswer.response
  );
});

// ==========================================
// BE-18: SUBMISSION CONFIRMATION TESTS
// ==========================================

async function confirmation(attemptId, token = student.token) {
  return request(
    'GET',
    `/attempts/${attemptId}/confirmation`,
    token
  );
}

// TEST 1: Answered questions are counted correctly.
test('BE-18: confirmation counts answered questions', async () => {
  await createExam();

  const started = await start();
  assert.equal(started.status, 201);

  const id = started.body.attemptId;

  // The exam has two questions, but only one is answered.
  assert.equal((await save(id, 'q-1', '4')).status, 200);
  assert.equal((await submit(id)).status, 200);

  const result = await confirmation(id);

  assert.equal(result.status, 200);
  assert.equal(result.body.confirmation.questionsAnswered, 1);
  assert.equal(result.body.confirmation.totalQuestions, 2);
  assert.ok(result.body.confirmation.submittedAt);
});

// TEST 2: Reference number does not change.
test('BE-18: reference number is stable across fetches', async () => {
  await createExam();

  const started = await start();
  const id = started.body.attemptId;

  await submit(id);

  const first = await confirmation(id);
  const second = await confirmation(id);

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);

  assert.equal(
    first.body.confirmation.referenceNumber,
    second.body.confirmation.referenceNumber
  );

  assert.equal(
    first.body.confirmation.referenceNumber,
    id
  );
});

// TEST 3: Another student cannot view confirmation.
test('BE-18: another student receives 403', async () => {
  await createExam();

  const started = await start();
  const id = started.body.attemptId;

  await submit(id);

  const result = await confirmation(id, outsider.token);

  assert.equal(result.status, 403);
});

// TEST 4: Scores are hidden before release.
test('BE-18: confirmation hides unreleased scores', async () => {
  await createExam();

  const started = await start();
  const id = started.body.attemptId;

  await save(id, 'q-1', '4');
  await submit(id);

  const result = await confirmation(id);

  assert.equal(result.status, 200);

  assert.equal(
    Object.hasOwn(result.body.confirmation, 'percentage'),
    false
  );

  assert.equal(
    Object.hasOwn(result.body.confirmation, 'totalScore'),
    false
  );
});

// TEST 5: Released results can include the score.
test('BE-18: confirmation shows released scores', async () => {
  await createExam();

  const started = await start();
  const id = started.body.attemptId;

  // One correct answer out of two questions = 50%.
  await save(id, 'q-1', '4');
  await submit(id);

  await Exam.updateOne(
    { examId: 'exam-1' },
    { $set: { resultsReleased: true } }
  );

  await Grade.updateOne(
    {
      examId: 'exam-1',
      studentId: student.user.studentId
    },
    { $set: { released: true } }
  );

  const result = await confirmation(id);

  assert.equal(result.status, 200);
  assert.equal(result.body.confirmation.percentage, 50);
});

// TEST 6: Confirmation requires a submitted exam.
test('BE-18: in-progress attempt returns 409', async () => {
  await createExam();

  const started = await start();
  const id = started.body.attemptId;

  const result = await confirmation(id);

  assert.equal(result.status, 409);
});

// TEST 7: Authentication is required.
test('BE-18: confirmation requires authentication', async () => {
  await createExam();

  const started = await start();
  const id = started.body.attemptId;

  await submit(id);

  const result = await request(
    'GET',
    `/attempts/${id}/confirmation`,
    null
  );

  assert.equal(result.status, 401);
});
