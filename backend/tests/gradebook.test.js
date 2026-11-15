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
let missingStudent;

const objective = (id, answer) => ({
  id: `${id}-question`,
  type: 'Multiple choice',
  question: `Question ${id}`,
  points: 10,
  choices: ['A', 'B'],
  correctAnswer: answer,
});

async function request(method, path, token, body) {
  const response = await fetch(`${base}/api${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return { response, status: response.status, body: response.headers.get('content-type')?.includes('application/json') ? await response.json() : await response.text() };
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

async function submit(examId, studentId, response) {
  return Submission.create({
    examId,
    studentId,
    status: 'submitted',
    answers: [{ questionId: `${examId}-question`, response }],
  });
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
  student = await register('student', 'S-201');
  missingStudent = await register('student', 'S-202');
  await Class.create({ classId: 'it-201', name: 'Data Structures', section: 'A', subject: 'IT', term: '2026', code: 'IT201', teacherId: teacher.user.id });
  await Enrollment.insertMany([
    { classId: 'it-201', userId: student.user.id, studentId: student.user.studentId, name: 'S-201 Test', email: student.user.email, account: 'Active' },
    { classId: 'it-201', userId: missingStudent.user.id, studentId: missingStudent.user.studentId, name: 'S-202 Test', email: missingStudent.user.email, account: 'Active' },
  ]);
  await Exam.insertMany([
    { examId: 'quiz-1', classId: 'it-201', name: 'Quiz 1', questions: [objective('quiz-1', 'A')], published: true },
    { examId: 'quiz-2', classId: 'it-201', name: 'Quiz 2', questions: [objective('quiz-2', 'A')], published: true },
    { examId: 'essay-1', classId: 'it-201', name: 'Essay', questions: [{ id: 'essay-1-question', type: 'Essay', question: 'Explain trees.', points: 10 }], published: true },
  ]);
});

test('BE-11 builds a student-by-exam matrix from graded submissions and calculates unweighted averages', async () => {
  await submit('quiz-1', student.user.studentId, 'A');
  await submit('quiz-2', student.user.studentId, 'A');
  await Submission.create({
    examId: 'essay-1',
    studentId: missingStudent.user.studentId,
    status: 'submitted',
    answers: [{ questionId: 'essay-1-question', response: 'Needs review.' }],
  });

  const initial = await request('GET', '/classes/it-201/gradebook', teacher.token);
  assert.equal(initial.status, 200, JSON.stringify(initial.body));
  assert.deepEqual(initial.body.exams.map((exam) => exam.id), ['essay-1', 'quiz-1', 'quiz-2']);
  const firstRow = initial.body.rows.find((row) => row.student.id === student.user.studentId);
  const blankRow = initial.body.rows.find((row) => row.student.id === missingStudent.user.studentId);
  assert.equal(firstRow.grades['quiz-1'].percentage, 100);
  assert.equal(firstRow.grades['quiz-2'].percentage, 100);
  assert.equal(firstRow.grades['essay-1'], null);
  assert.equal(firstRow.average, 100);
  assert.equal(blankRow.grades['essay-1'], null);
  assert.equal(blankRow.average, null);

  const secondGradeId = firstRow.grades['quiz-2'].id;
  const override = await request('PATCH', `/gradebook/${secondGradeId}`, teacher.token, { percentage: 50, reason: 'Accepted partial alternate work.' });
  assert.equal(override.status, 200, JSON.stringify(override.body));
  assert.equal(override.body.grade.percentage, 50);
  assert.deepEqual(override.body.grade.overrides[0].reason, 'Accepted partial alternate work.');
  assert.equal(override.body.grade.overrides[0].overriddenBy, teacher.user.id);

  const afterOverride = await request('GET', '/classes/it-201/gradebook', teacher.token);
  const updatedRow = afterOverride.body.rows.find((row) => row.student.id === student.user.studentId);
  assert.equal(updatedRow.grades['quiz-1'].percentage, 100);
  assert.equal(updatedRow.grades['quiz-2'].percentage, 50);
  assert.equal(updatedRow.average, 75);
});

test('BE-11 rejects an override without a reason and protects gradebook routes by ownership', async () => {
  await submit('quiz-1', student.user.studentId, 'A');
  const grade = await Grade.findOne({ examId: 'quiz-1', studentId: student.user.studentId }).lean();

  assert.equal((await request('PATCH', `/gradebook/${grade.gradeId}`, teacher.token, { percentage: 75 })).status, 400);
  assert.equal((await request('PATCH', `/gradebook/${grade.gradeId}`, teacher.token, { percentage: 101, reason: 'Invalid' })).status, 400);
  for (const [method, path, body] of [
    ['GET', '/classes/it-201/gradebook'],
    ['GET', '/classes/it-201/gradebook/export'],
    ['PATCH', `/gradebook/${grade.gradeId}`, { percentage: 75, reason: 'Review' }],
  ]) {
    assert.equal((await request(method, path, null, body)).status, 401, `${method} ${path}`);
    assert.equal((await request(method, path, otherTeacher.token, body)).status, 403, `${method} ${path}`);
    assert.equal((await request(method, path, student.token, body)).status, 403, `${method} ${path}`);
  }
});

test('BE-11 exports an Excel-compatible CSV with a matrix column for each exam', async () => {
  await submit('quiz-1', student.user.studentId, 'A');
  const exported = await request('GET', '/classes/it-201/gradebook/export', teacher.token);
  assert.equal(exported.status, 200);
  assert.match(exported.response.headers.get('content-type'), /^text\/csv/);
  assert.equal(exported.response.headers.get('content-disposition'), 'attachment; filename="gradebook-it-201.csv"');
  assert.match(exported.body, /^\uFEFF"Student ID","Student","Essay","Quiz 1","Quiz 2","Average"\r\n/);
  assert.match(exported.body, /"S-201","S-201 Test","","100","","100"/);
  assert.match(exported.body, /"S-202","S-202 Test","","","",""/);
});
