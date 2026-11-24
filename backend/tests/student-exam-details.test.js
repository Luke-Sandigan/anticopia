
import { after, before, beforeEach, test } from 'node:test';
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

let mongo, server, base, student, outsider, teacher;

async function request(method, path, token, body) {
  const response = await fetch(`${base}/api${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined
        ? { 'Content-Type': 'application/json' } : {})
    },
    ...(body !== undefined
      ? { body: JSON.stringify(body) } : {})
  });

  return {
    status: response.status,
    body: response.status === 204 ? null : await response.json()
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

const hoursFromNow = hours =>
  new Date(Date.now() + hours * 3600000);

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
    await new Promise(resolve => server.close(resolve));
  }
  await mongoose.disconnect();
  await mongo?.stop();
});

beforeEach(async () => {
  await Promise.all(
    [User, Class, Enrollment, Exam, Submission].map(
      model => model.deleteMany({})
    )
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
    name: 'Midterm Exam',
    instructions: 'Read the instructions carefully.',
    duration: 60,
    published: true,
    startsAt: hoursFromNow(-1),
    endsAt: hoursFromNow(1),
    detectTabSwitches: true,
    detectMultiDevice: true,
    captureScreenshots: false,
    questions: [{
      id: 'q-1',
      type: 'Multiple choice',
      question: 'What is 2 + 2?',
      points: 1,
      choices: ['3', '4'],
      correctAnswer: '4'
    }],
    ...overrides
  });
}

async function details(token = student.token) {
  return request('GET', '/student/exams/exam-1', token);
}

// TEST 1: Exam is available during the window.
test('student can start an open exam without an attempt', async () => {
  await createExam();

  const result = await details();

  assert.equal(result.status, 200);
  assert.equal(result.body.exam.title, 'Midterm Exam');
  assert.equal(result.body.exam.duration, 60);
  assert.equal(result.body.exam.questionCount, 1);
  assert.equal(result.body.exam.canStart, true);
  assert.equal(result.body.exam.attemptStatus, null);
});

// TEST 2: Exam cannot start before opening.
test('canStart is false before the exam window', async () => {
  await createExam({
    startsAt: hoursFromNow(1),
    endsAt: hoursFromNow(2)
  });

  const result = await details();

  assert.equal(result.status, 200);
  assert.equal(result.body.exam.canStart, false);
});

// TEST 3: Exam cannot start after closing.
test('canStart is false after the exam window', async () => {
  await createExam({
    startsAt: hoursFromNow(-3),
    endsAt: hoursFromNow(-1)
  });

  const result = await details();

  assert.equal(result.status, 200);
  assert.equal(result.body.exam.canStart, false);
});

// TEST 4: A finished attempt prevents restarting.
test('finished attempt makes canStart false', async () => {
  await createExam();

  // Insert a test attempt without triggering grading hooks.
  await Submission.collection.insertOne({
    submissionId: 'submission-1',
    examId: 'exam-1',
    studentId: student.user.studentId,
    status: 'graded',
    answers: [],
    totalScore: 0,
    totalPoints: 1,
    submittedAt: new Date(),
    gradedAt: new Date()
  });

  const result = await details();

  assert.equal(result.status, 200);
  assert.equal(result.body.exam.canStart, false);
  assert.equal(result.body.exam.attemptStatus, 'graded');
});

// TEST 5: An in-progress attempt also prevents a new attempt.
test('existing in-progress attempt prevents starting another', async () => {
  await createExam();

  await Submission.collection.insertOne({
    submissionId: 'submission-2',
    examId: 'exam-1',
    studentId: student.user.studentId,
    status: 'in_progress',
    answers: []
  });

  const result = await details();

  assert.equal(result.status, 200);
  assert.equal(result.body.exam.canStart, false);
  assert.equal(result.body.exam.attemptStatus, 'in_progress');
});

// TEST 6: Students outside the class are denied.
test('unenrolled student receives 403', async () => {
  await createExam();

  const result = await details(outsider.token);

  assert.equal(result.status, 403);
});

// TEST 7: Monitoring rules appear.
test('exam details show monitoring rules', async () => {
  await createExam({
    detectTabSwitches: false,
    detectMultiDevice: true,
    captureScreenshots: true
  });

  const result = await details();

  assert.equal(result.status, 200);

  assert.deepEqual(result.body.exam.monitoringRules, {
    tabSwitching: false,
    multiDevice: true,
    screenshots: true
  });
});

// TEST 8: Questions and answers stay hidden.
test('exam details do not reveal questions or answer keys', async () => {
  await createExam();

  const result = await details();

  assert.equal(result.status, 200);
  assert.equal(result.body.exam.questionCount, 1);

  const serialized = JSON.stringify(result.body);

  assert.equal('questions' in result.body.exam, false);
  assert.equal(serialized.includes('correctAnswer'), false);
  assert.equal(serialized.includes('What is 2 + 2?'), false);
});

// TEST 9: Draft exams are unavailable.
test('unpublished exams cannot be viewed', async () => {
  await createExam({ published: false });

  const result = await details();

  assert.equal(result.status, 404);
});

// TEST 10: Authentication and role protection.
test('exam details require student authentication', async () => {
  await createExam();

  const anonymous = await request(
    'GET',
    '/student/exams/exam-1',
    null
  );

  assert.equal(anonymous.status, 401);

  const teacherResult = await details(teacher.token);

  assert.equal(teacherResult.status, 403);
});
