import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import { connectToDatabase } from '../database.js';
import { Class } from '../models/class.model.js';
import { Enrollment } from '../models/enrollment.model.js';
import { Exam } from '../models/exam.model.js';
import { Grade } from '../models/grade.model.js';
import { Submission } from '../models/submission.model.js';
import { User } from '../models/user.model.js';

let mongo;
let server;
let base;
let teacher;
let otherTeacher;
let student;

const questions = [
  { id: 'mcq-1', type: 'Multiple choice', question: 'Which structure supports O(1) indexing?', points: 2, choices: ['Array', 'Linked list'], correctAnswer: 'Array' },
  { id: 'tf-1', type: 'True/false', question: 'A stack follows LIFO.', points: 3, correctAnswer: 'True' },
  { id: 'essay-1', type: 'Essay', question: 'Explain why a balanced tree is fast.', points: 5 },
];

async function request(method, path, token, body) {
  const response = await fetch(`${base}/api${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, body: response.status === 204 ? null : await response.json() };
}

async function register(role, suffix) {
  const result = await request('POST', `/auth/register/${role}`, null, {
    firstName: suffix,
    lastName: 'Test',
    email: `${suffix}@example.com`,
    password: 'password123',
    ...(role === 'teacher' ? { employeeId: suffix, department: 'IT' } : { studentId: suffix }),
  });
  assert.equal(result.status, 201, JSON.stringify(result.body));
  return result.body;
}

async function createSubmission(answers = [
  { questionId: 'mcq-1', response: 'Array' },
  { questionId: 'tf-1', response: true },
  { questionId: 'essay-1', response: 'A balanced tree keeps its height logarithmic.' },
]) {
  return Submission.create({ examId: 'midterm-1', studentId: student.user.studentId, status: 'submitted', answers });
}

before(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  await connectToDatabase();
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  await mongo?.stop();
});

beforeEach(async () => {
  await Promise.all([Class, Enrollment, Exam, Grade, Submission, User].map((model) => model.deleteMany({})));
  teacher = await register('teacher', 'teacher');
  otherTeacher = await register('teacher', 'other');
  student = await register('student', 'S-101');
  await Class.create({ classId: 'it-201', name: 'Data Structures', section: 'A', subject: 'IT', term: '2026', code: 'IT201', teacherId: teacher.user.id });
  await Enrollment.create({ classId: 'it-201', userId: student.user.id, studentId: student.user.studentId, name: 'S-101 Test', email: student.user.email, account: 'Active' });
  await Exam.create({ examId: 'midterm-1', classId: 'it-201', name: 'Midterm', questions, published: true });
});

test('BE-10 auto-grades objective answers and exposes queued submissions to the owner', async () => {
  const submission = await createSubmission();
  assert.equal(submission.status, 'needs_grading');
  assert.equal(submission.totalScore, 5);
  assert.equal(submission.totalPoints, 10);

  const list = await request('GET', '/exams/midterm-1/submissions?status=needs_grading', teacher.token);
  assert.equal(list.status, 200, JSON.stringify(list.body));
  assert.equal(list.body.pagination.total, 1);
  assert.equal(list.body.submissions[0].totalScore, 5);
  assert.equal(list.body.submissions[0].percentage, 50);

  const detail = await request('GET', `/submissions/${submission.submissionId}`, teacher.token);
  assert.equal(detail.status, 200);
  assert.equal(detail.body.submission.answers.find((answer) => answer.questionId === 'mcq-1').autoGraded, true);
  assert.equal(detail.body.submission.answers.find((answer) => answer.questionId === 'tf-1').score, 3);
  assert.equal(detail.body.submission.answers.find((answer) => answer.questionId === 'tf-1').autoGraded, true);
  assert.equal(detail.body.submission.answers.find((answer) => answer.questionId === 'essay-1').question.correctAnswer, null);
});

test('BE-10 accepts valid essay marks, rejects scores above the question maximum, and finalizes totals', async () => {
  const submission = await createSubmission();
  const answerId = submission.answers.find((answer) => answer.questionId === 'essay-1').answerId;

  const tooHigh = await request('PATCH', `/submissions/${submission.submissionId}/answers/${answerId}`, teacher.token, { score: 6 });
  assert.equal(tooHigh.status, 400);

  const marked = await request('PATCH', `/submissions/${submission.submissionId}/answers/${answerId}`, teacher.token, { score: 4.5, feedback: 'Strong explanation of logarithmic height.' });
  assert.equal(marked.status, 200, JSON.stringify(marked.body));
  assert.equal(marked.body.submission.totalScore, 9.5);
  assert.equal(marked.body.submission.answers.find((answer) => answer.id === answerId).feedback, 'Strong explanation of logarithmic height.');

  const finalized = await request('POST', `/submissions/${submission.submissionId}/finalize`, teacher.token);
  assert.equal(finalized.status, 200, JSON.stringify(finalized.body));
  assert.equal(finalized.body.submission.status, 'graded');
  assert.equal(finalized.body.submission.totalScore, 9.5);
  assert.equal(finalized.body.submission.percentage, 95);
  assert.equal((await Grade.findOne({ examId: 'midterm-1', studentId: student.user.studentId }).lean()).released, false);
});

test('BE-10 releases only finalized results to the submitting student', async () => {
  const submission = await createSubmission();
  const answerId = submission.answers.find((answer) => answer.questionId === 'essay-1').answerId;
  await request('PATCH', `/submissions/${submission.submissionId}/answers/${answerId}`, teacher.token, { score: 5 });
  await request('POST', `/submissions/${submission.submissionId}/finalize`, teacher.token);

  assert.equal((await request('GET', `/submissions/${submission.submissionId}`, student.token)).status, 403);
  const released = await request('POST', '/exams/midterm-1/release-results', teacher.token);
  assert.equal(released.status, 200, JSON.stringify(released.body));
  const visible = await request('GET', `/submissions/${submission.submissionId}`, student.token);
  assert.equal(visible.status, 200, JSON.stringify(visible.body));
  assert.equal(visible.body.submission.released, true);
  assert.equal(JSON.stringify(visible.body).includes('correctAnswer'), false);
});

test('BE-10 protects lists, marks, finalization, and release by teacher ownership', async () => {
  const submission = await createSubmission();
  const answerId = submission.answers.find((answer) => answer.questionId === 'essay-1').answerId;
  const routes = [
    ['GET', '/exams/midterm-1/submissions'],
    ['GET', `/submissions/${submission.submissionId}`],
    ['PATCH', `/submissions/${submission.submissionId}/answers/${answerId}`, { score: 2 }],
    ['POST', `/submissions/${submission.submissionId}/finalize`],
    ['POST', '/exams/midterm-1/release-results'],
  ];
  for (const [method, path, body] of routes) {
    assert.equal((await request(method, path, null, body)).status, 401, `${method} ${path}`);
    assert.equal((await request(method, path, otherTeacher.token, body)).status, 403, `${method} ${path}`);
  }
  assert.equal((await request('PATCH', `/submissions/${submission.submissionId}/answers/${answerId}`, student.token, { score: 2 })).status, 403);
  assert.equal((await request('GET', '/exams/midterm-1/submissions?status=submitted', teacher.token)).status, 400);
});
