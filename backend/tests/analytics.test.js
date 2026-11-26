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
  return { status: response.status, body: await response.json() };
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

test('teacher dashboard combines owned classes, exams, submissions, and open flags', async () => {
  const path = '/teacher/dashboard';
  const empty = await request('GET', path, otherTeacher.token);
  assert.equal(empty.status, 200);
  assert.deepEqual(empty.body, {
    teacherName: 'other Test',
    stats: { classes: 0, students: 0, activeExams: 0, awaitingGrading: 0 },
    exams: [], alerts: [], summary: null, classes: [],
  });

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

  assert.equal((await request('GET', path)).status, 401);
  assert.equal((await request('GET', path, firstStudent.token)).status, 403);
  const { status, body } = await request('GET', path, teacher.token);
  assert.equal(status, 200, JSON.stringify(body));
  assert.equal(body.teacherName, 'teacher Test');
  assert.deepEqual(body.stats, { classes: 1, students: 2, activeExams: 1, awaitingGrading: 1 });
  assert.deepEqual(body.classes, [{ id: 'it-301', name: 'Algorithms', section: 'A', studentCount: 2 }]);
  assert.deepEqual(body.exams.map((exam) => [exam.id, exam.status]), [['midterm', 'ongoing'], ['empty-final', 'draft']]);
  assert.deepEqual(body.alerts.map((alert) => [alert.type, alert.student]), [['tab_switch', 'S-301 Test']]);
  assert.deepEqual(body.summary, { title: 'Midterm', averageScore: 85, submitted: 2, enrolled: 2 });
});

test('BE-12 reports override-aware exam analytics, distributions, and question rates', async () => {
  await Submission.create([
    {
      examId: 'midterm',
      studentId: firstStudent.user.studentId,
      status: 'submitted',
      answers: [{ questionId: 'midterm-choice', response: 'A' }, { questionId: 'midterm-boolean', response: true }],
    },
    {
      examId: 'midterm',
      studentId: secondStudent.user.studentId,
      status: 'submitted',
      answers: [{ questionId: 'midterm-choice', response: 'A' }, { questionId: 'midterm-boolean', response: false }],
    },
  ]);
  await Grade.updateOne({ examId: 'midterm', studentId: secondStudent.user.studentId }, { $set: { percentage: 60 } });

  const result = await request('GET', '/exams/midterm/analytics', teacher.token);
  assert.equal(result.status, 200, JSON.stringify(result.body));
  assert.deepEqual(result.body.summary, { gradedSubmissions: 2, average: 80, highest: 100, lowest: 60, passRate: 100 });
  assert.deepEqual(result.body.scoreDistribution.map((bucket) => bucket.count), [0, 1, 0, 0, 1]);
  assert.deepEqual(result.body.questions.map((question) => [question.id, question.correctCount, question.correctRate]), [
    ['midterm-choice', 2, 100],
    ['midterm-boolean', 1, 50],
  ]);

  const classroom = await request('GET', '/classes/it-301/analytics', teacher.token);
  assert.equal(classroom.status, 200, JSON.stringify(classroom.body));
  assert.deepEqual(classroom.body.summary, { exams: 2, gradedSubmissions: 2, average: 80, highest: 100, lowest: 60, passRate: 100 });
  assert.deepEqual(classroom.body.trends.find((examItem) => examItem.id === 'midterm').summary,
    { gradedSubmissions: 2, average: 80, highest: 100, lowest: 60, passRate: 100 });
});

test('BE-12 returns zero-valued analytics and class trends when no work is graded', async () => {
  const exam = await request('GET', '/exams/empty-final/analytics', teacher.token);
  assert.equal(exam.status, 200, JSON.stringify(exam.body));
  assert.deepEqual(exam.body.summary, { gradedSubmissions: 0, average: 0, highest: 0, lowest: 0, passRate: 0 });
  assert.deepEqual(exam.body.scoreDistribution.map((bucket) => bucket.count), [0, 0, 0, 0, 0]);
  assert.deepEqual(exam.body.questions.map((question) => question.correctRate), [0]);

  const integrity = await request('GET', '/exams/empty-final/integrity-report', teacher.token);
  assert.equal(integrity.status, 200, JSON.stringify(integrity.body));
  assert.deepEqual(integrity.body.summary,
    { gradedStudents: 0, totalFlags: 0, studentsFlagged: 0, byType: [], byReviewStatus: [] });

  const classroom = await request('GET', '/classes/it-301/analytics', teacher.token);
  assert.equal(classroom.status, 200, JSON.stringify(classroom.body));
  assert.deepEqual(classroom.body.summary, { exams: 2, gradedSubmissions: 0, average: 0, highest: 0, lowest: 0, passRate: 0 });
  assert.deepEqual(classroom.body.trends.map((examItem) => examItem.summary.gradedSubmissions), [0, 0]);
});

test('BE-12 reports integrity counts by type and review status for graded students only', async () => {
  await Submission.create([
    { examId: 'midterm', studentId: firstStudent.user.studentId, status: 'submitted', answers: [{ questionId: 'midterm-choice', response: 'A' }] },
    { examId: 'midterm', studentId: secondStudent.user.studentId, status: 'submitted', answers: [{ questionId: 'midterm-choice', response: 'A' }] },
  ]);
  await Flag.insertMany([
    { examId: 'midterm', studentId: firstStudent.user.studentId, type: 'fullscreen_exit', status: 'open', evidence: { screenshot: 'one' } },
    { examId: 'midterm', studentId: secondStudent.user.studentId, status: 'resolved', evidence: { eventType: 'tab_switch' } },
    { examId: 'midterm', studentId: secondStudent.user.studentId, type: 'copied_text', status: 'dismissed', evidence: { copied: true } },
    { examId: 'midterm', studentId: 'S-999', type: 'tab_switch', status: 'open' },
  ]);

  const result = await request('GET', '/exams/midterm/integrity-report', teacher.token);
  assert.equal(result.status, 200, JSON.stringify(result.body));
  assert.equal(result.body.summary.gradedStudents, 2);
  assert.equal(result.body.summary.totalFlags, 3);
  assert.equal(result.body.summary.studentsFlagged, 2);
  assert.deepEqual(result.body.summary.byType, [
    { type: 'copied_text', count: 1 },
    { type: 'fullscreen_exit', count: 1 },
    { type: 'tab_switch', count: 1 },
  ]);
  assert.deepEqual(result.body.summary.byReviewStatus, [
    { reviewStatus: 'dismissed', count: 1 },
    { reviewStatus: 'open', count: 1 },
    { reviewStatus: 'resolved', count: 1 },
  ]);
  assert.ok(result.body.students.find((item) => item.student.id === secondStudent.user.studentId).flags
    .some((flag) => flag.type === 'copied_text'));
});

test('BE-12 analytics routes require the owning teacher', async () => {
  for (const path of ['/exams/midterm/analytics', '/exams/midterm/integrity-report', '/classes/it-301/analytics']) {
    assert.equal((await request('GET', path)).status, 401, path);
    assert.equal((await request('GET', path, otherTeacher.token)).status, 403, path);
    assert.equal((await request('GET', path, firstStudent.token)).status, 403, path);
  }
});
