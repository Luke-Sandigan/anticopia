
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
import { Grade } from '../models/grade.model.js';

let mongo, server, base, student, teacher;

async function request(path, token) {
  const response = await fetch(`${base}/api${path}`, {
    headers: token
      ? { Authorization: `Bearer ${token}` }
      : {}
  });

  return {
    status: response.status,
    body: await response.json()
  };
}

async function register(role, id) {
  const response = await fetch(
    `${base}/api/auth/register/${role}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'User',
        email: `${id}@example.com`,
        password: 'password123',
        ...(role === 'student'
          ? { studentId: id }
          : { employeeId: id, department: 'IT' })
      })
    }
  );

  assert.equal(response.status, 201);
  return response.json();
}

before(async () => {
  mongo = await MongoMemoryServer.create({
  instance: {
    launchTimeout: 60000
  }
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
    [User, Class, Enrollment, Exam, Grade].map(
      model => model.deleteMany({})
    )
  );

  student = await register('student', 'S-001');
  teacher = await register('teacher', 'T-001');
});

async function createClass(classId) {
  return Class.create({
    classId,
    name: 'Data Structures',
    section: 'A',
    subject: 'IT',
    term: '2026',
    code: classId,
    teacherId: teacher.user.id
  });
}

async function enroll(classId) {
  return Enrollment.create({
    classId,
    studentId: student.user.studentId,
    userId: student.user.id,
    name: 'Test Student',
    enrollment: 'Enrolled'
  });
}

async function createExam(examId, classId, options = {}) {
  return Exam.create({
    examId,
    classId,
    name: 'Midterm Exam',
    published: true,
    startsAt: new Date(Date.now() + 3600000),
    endsAt: new Date(Date.now() + 7200000),
    ...options
  });
}

// TEST 1: New students see empty dashboard lists.
test('new student receives an empty dashboard', async () => {
  const result = await request(
    '/student/dashboard',
    student.token
  );

  assert.equal(result.status, 200);
  assert.equal(result.body.classCount, 0);
  assert.deepEqual(result.body.upcomingExams, []);
  assert.deepEqual(result.body.ongoingExams, []);
  assert.deepEqual(result.body.recentGrades, []);
});

// TEST 2: Only enrolled published exams appear.
test('dashboard shows only eligible exams', async () => {
  await createClass('class-1');
  await createClass('class-2');
  await enroll('class-1');

  await createExam('exam-1', 'class-1');

  await createExam('exam-2', 'class-1', {
    published: false
  });

  await createExam('exam-3', 'class-2');

  const result = await request(
    '/student/dashboard',
    student.token
  );

  assert.equal(result.status, 200);
  assert.equal(result.body.classCount, 1);

  const examIds = result.body.upcomingExams.map(
    exam => exam.examId
  );

  assert.deepEqual(examIds, ['exam-1']);
});

// TEST 3: Ongoing exams appear in the correct list.
test('dashboard includes ongoing exams', async () => {
  await createClass('class-1');
  await enroll('class-1');

  await createExam('exam-live', 'class-1', {
    startsAt: new Date(Date.now() - 3600000),
    endsAt: new Date(Date.now() + 3600000)
  });

  const result = await request(
    '/student/dashboard',
    student.token
  );

  assert.equal(result.status, 200);
  assert.equal(result.body.ongoingExams.length, 1);
  assert.equal(
    result.body.ongoingExams[0].examId,
    'exam-live'
  );

  assert.deepEqual(result.body.upcomingExams, []);
});

// TEST 4: Only officially released grades appear.
test('dashboard hides unreleased grades', async () => {
  await createClass('class-1');
  await enroll('class-1');

  await createExam('exam-1', 'class-1', {
    resultsReleased: true
  });

  await createExam('exam-2', 'class-1', {
    resultsReleased: false
  });

  await Grade.create([
    {
      examId: 'exam-1',
      studentId: student.user.studentId,
      percentage: 90,
      released: true
    },
    {
      examId: 'exam-2',
      studentId: student.user.studentId,
      percentage: 75,
      released: false
    }
  ]);

  const result = await request(
    '/student/dashboard',
    student.token
  );

  assert.equal(result.status, 200);
  assert.equal(result.body.recentGrades.length, 1);
  assert.equal(
    result.body.recentGrades[0].examId,
    'exam-1'
  );
});

// TEST 5: Authentication and role protection.
test('dashboard requires student authentication', async () => {
  const anonymous = await request('/student/dashboard');
  assert.equal(anonymous.status, 401);

  const teacherResult = await request(
    '/student/dashboard',
    teacher.token
  );

  assert.equal(teacherResult.status, 403);
});

// TEST 6: Do not expose exam questions or answers.
test('dashboard does not expose exam questions', async () => {
  await createClass('class-1');
  await enroll('class-1');

  await createExam('exam-1', 'class-1', {
    questions: [{
      id: 'question-1',
      type: 'Multiple choice',
      question: 'What is 2 + 2?',
      points: 1,
      choices: ['3', '4'],
      correctAnswer: '4'
    }]
  });

  const result = await request(
    '/student/dashboard',
    student.token
  );

  assert.equal(result.status, 200);
  assert.equal(result.body.upcomingExams.length, 1);

  const exam = result.body.upcomingExams[0];

  assert.equal('questions' in exam, false);
  assert.equal('correctAnswer' in exam, false);
});
