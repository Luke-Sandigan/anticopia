import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import { connectToDatabase } from '../database.js';
import { Class } from '../models/class.model.js';
import { Enrollment } from '../models/enrollment.model.js';
import { Exam } from '../models/exam.model.js';
import { Flag } from '../models/flag.model.js';
import { Grade } from '../models/grade.model.js';
import { Submission } from '../models/submission.model.js';
import { User } from '../models/user.model.js';

let mongo;
let server;
let base;
let teacher;
let otherTeacher;
let firstStudent;
let secondStudent;

async function request(method, path, token) {
  const response = await fetch(`${base}/api${path}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return { response, status: response.status, body: await response.json() };
}

async function register(role, suffix) {
  const response = await fetch(`${base}/api/auth/register/${role}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: suffix,
      lastName: 'Test',
      email: `${suffix}@example.com`,
      password: 'password123',
      ...(role === 'teacher' ? { employeeId: suffix, department: 'IT' } : { studentId: suffix }),
    }),
  });
  const body = await response.json();
  assert.equal(response.status, 201, JSON.stringify(body));
  return body;
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
  await Promise.all([Class, Enrollment, Exam, Flag, Grade, Submission, User].map((model) => model.deleteMany({})));
  teacher = await register('teacher', 'teacher');
  otherTeacher = await register('teacher', 'other');
  firstStudent = await register('student', 'S-301');
  secondStudent = await register('student', 'S-302');
  await Class.create({ classId: 'it-301', name: 'Algorithms', section: 'A', subject: 'IT', term: '2026', code: 'IT301', teacherId: teacher.user.id });
  await Enrollment.insertMany([
    { classId: 'it-301', userId: firstStudent.user.id, studentId: firstStudent.user.studentId, name: 'S-301 Test', email: firstStudent.user.email, account: 'Active' },
    { classId: 'it-301', userId: secondStudent.user.id, studentId: secondStudent.user.studentId, name: 'S-302 Test', email: secondStudent.user.email, account: 'Active' },
  ]);
  await Exam.insertMany([
    {
      examId: 'midterm',
      classId: 'it-301',
      name: 'Midterm',
      passingScore: 60,
      questions: [
        { id: 'midterm-choice', type: 'Multiple choice', question: 'Choose A.', points: 10, choices: ['A', 'B'], correctAnswer: 'A' },
        { id: 'midterm-boolean', type: 'True/false', question: 'True?', points: 10, choices: ['True', 'False'], correctAnswer: 'true' },
      ],
    },
    {
      examId: 'empty-final',
      classId: 'it-301',
      name: 'Final',
      passingScore: 70,
      questions: [{ id: 'final-choice', type: 'Multiple choice', question: 'Choose A.', points: 10, choices: ['A', 'B'], correctAnswer: 'A' }],
    },
  ]);
});

test('FO-04 returns an empty dashboard for a teacher with no active classes', async () => {
  const result = await request('GET', '/teacher/dashboard', otherTeacher.token);

  assert.equal(result.status, 200, JSON.stringify(result.body));
  assert.equal(result.response.headers.get('cache-control'), 'private, no-store');
  assert.deepEqual(result.body, {
    teacherName: 'other Test',
    stats: { classes: 0, students: 0, activeExams: 0, awaitingGrading: 0 },
    exams: [],
    alerts: [],
    summary: null,
    classes: [],
  });
});

test('FO-04 requires an authenticated teacher dashboard request', async () => {
  assert.equal((await request('GET', '/teacher/dashboard')).status, 401);
  assert.equal((await request('GET', '/teacher/dashboard', firstStudent.token)).status, 403);
});

test('FO-04 isolates teacher data and preserves dashboard response contents', async () => {
  await Class.create({ classId: 'other-301', name: 'Private class', section: 'B',
    subject: 'IT', term: '2026', code: 'PRIVATE', teacherId: otherTeacher.user.id });
  await Exam.create({ examId: 'private-exam', classId: 'other-301', name: 'Private exam', published: true });
  await Exam.updateOne({ examId: 'midterm' }, { $set: { published: true } });
  await Submission.create({
    examId: 'midterm',
    studentId: firstStudent.user.studentId,
    status: 'submitted',
    answers: [{ questionId: 'midterm-choice', response: 'A' }, { questionId: 'midterm-boolean', response: true }],
  });
  await Grade.updateOne({ examId: 'midterm', studentId: firstStudent.user.studentId }, { $set: { percentage: 85 } });
  await Submission.insertMany([
    { examId: 'midterm', studentId: secondStudent.user.studentId, status: 'needs_grading' },
    { examId: 'private-exam', studentId: secondStudent.user.studentId, status: 'needs_grading' },
  ]);
  await Flag.insertMany([
    { examId: 'midterm', studentId: firstStudent.user.studentId, evidence: { eventType: 'tab_switch' } },
    { examId: 'midterm', studentId: secondStudent.user.studentId, status: 'resolved' },
    { examId: 'private-exam', studentId: secondStudent.user.studentId, type: 'copied_text' },
  ]);

  const ownDashboard = await request('GET', '/teacher/dashboard', teacher.token);
  assert.equal(ownDashboard.status, 200, JSON.stringify(ownDashboard.body));
  assert.equal(ownDashboard.body.teacherName, 'teacher Test');
  assert.deepEqual(ownDashboard.body.stats, { classes: 1, students: 2, activeExams: 1, awaitingGrading: 1 });
  assert.deepEqual(ownDashboard.body.classes, [{ id: 'it-301', name: 'Algorithms', section: 'A', studentCount: 2 }]);
  assert.deepEqual(ownDashboard.body.exams.map((exam) => [exam.id, exam.status]), [['midterm', 'ongoing'], ['empty-final', 'draft']]);
  assert.deepEqual(ownDashboard.body.alerts.map((alert) => [alert.type, alert.student]), [['tab_switch', 'S-301 Test']]);
  assert.deepEqual(ownDashboard.body.summary, { title: 'Midterm', averageScore: 85, submitted: 2, enrolled: 2 });

  const privateDashboard = await request('GET', '/teacher/dashboard', otherTeacher.token);
  assert.equal(privateDashboard.status, 200, JSON.stringify(privateDashboard.body));
  assert.deepEqual(privateDashboard.body.classes, [{ id: 'other-301', name: 'Private class', section: 'B', studentCount: 0 }]);
  assert.deepEqual(privateDashboard.body.exams.map((exam) => exam.id), ['private-exam']);
  assert.deepEqual(privateDashboard.body.alerts.map((alert) => alert.type), ['copied_text']);
  assert.deepEqual(privateDashboard.body.stats, { classes: 1, students: 0, activeExams: 1, awaitingGrading: 1 });
});
