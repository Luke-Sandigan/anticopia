
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

async function request(method, path, token, body) {
  const response = await fetch(`${base}/api${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {})
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
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

before(async () => {
  mongo = await MongoMemoryServer.create({
    instance: { launchTimeout: 60000 }
  });

  process.env.MONGODB_URI = mongo.getUri();
  await connectToDatabase();

  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
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

  await Class.create({
    classId: 'class-1',
    name: 'Data Structures',
    section: 'A',
    subject: 'IT',
    term: '2026',
    code: 'IT201',
    joinCode: 'ABCDEF123456',
    teacherId: teacher.user.id
  });
});

async function join(code = 'ABCDEF123456') {
  return request('POST', '/classes/join', student.token, {
    joinCode: code
  });
}

// TEST 1
test('student starts with an empty class list', async () => {
  const result = await request(
    'GET', '/student/classes', student.token
  );

  assert.equal(result.status, 200);
  assert.deepEqual(result.body.classes, []);
});

// TEST 2
test('valid code joins a class and invalid code returns 404', async () => {
  const invalid = await join('000000000000');
  assert.equal(invalid.status, 404);

  const valid = await join();
  assert.equal(valid.status, 201);

  const result = await request(
    'GET', '/student/classes', student.token
  );

  assert.equal(result.status, 200);
  assert.equal(result.body.classes.length, 1);
  assert.equal(result.body.classes[0].classId, 'class-1');
});

// TEST 3
test('joining the same class twice returns 409', async () => {
  assert.equal((await join()).status, 201);
  assert.equal((await join()).status, 409);

  const count = await Enrollment.countDocuments({
    classId: 'class-1',
    studentId: student.user.studentId
  });

  assert.equal(count, 1);
});

// TEST 4
test('class details expose only published exams and no roster', async () => {
  await join();

  await Exam.create([
    {
      examId: 'published-exam',
      classId: 'class-1',
      name: 'Published Exam',
      published: true,
      questions: [{
        id: 'q-1',
        type: 'Multiple choice',
        question: 'What is 2 + 2?',
        points: 1,
        choices: ['3', '4'],
        correctAnswer: '4'
      }]
    },
    {
      examId: 'draft-exam',
      classId: 'class-1',
      name: 'Draft Exam',
      published: false
    }
  ]);

  const result = await request(
    'GET',
    '/student/classes/class-1',
    student.token
  );

  assert.equal(result.status, 200);
  assert.equal(result.body.class.classId, 'class-1');
  assert.equal(result.body.exams.length, 1);
  assert.equal(result.body.exams[0].examId, 'published-exam');

  assert.equal('roster' in result.body, false);
  assert.equal('joinCode' in result.body.class, false);
  assert.equal('questions' in result.body.exams[0], false);
  assert.equal('correctAnswer' in result.body.exams[0], false);
});

// TEST 5
test('student cannot view a class without enrollment', async () => {
  const result = await request(
    'GET',
    '/student/classes/class-1',
    student.token
  );

  assert.equal(result.status, 404);
});

// TEST 6
test('leaving hides the class but preserves history and grades', async () => {
  await join();

  await Exam.create({
    examId: 'exam-1',
    classId: 'class-1',
    name: 'Midterm',
    published: true,
    resultsReleased: true
  });

  await Grade.create({
    examId: 'exam-1',
    studentId: student.user.studentId,
    percentage: 90,
    released: true
  });

  const leave = await request(
    'POST',
    '/student/classes/class-1/leave',
    student.token
  );

  assert.equal(leave.status, 204);

  const list = await request(
    'GET',
    '/student/classes',
    student.token
  );

  assert.equal(list.status, 200);
  assert.deepEqual(list.body.classes, []);

  const enrollment = await Enrollment.findOne({
    classId: 'class-1',
    studentId: student.user.studentId
  }).lean();

  assert.ok(enrollment);
  assert.equal(enrollment.enrollment, 'Removed');
  assert.ok(enrollment.removedAt);
  assert.ok(enrollment.history.some(
    event => event.action === 'removed'
  ));

  const grade = await Grade.findOne({
    examId: 'exam-1',
    studentId: student.user.studentId
  }).lean();

  assert.ok(grade);
  assert.equal(grade.percentage, 90);
  assert.equal(grade.released, true);

  const details = await request(
    'GET',
    '/student/classes/class-1',
    student.token
  );

  assert.equal(details.status, 404);
});

// TEST 7
test('students can rejoin without deleting enrollment history', async () => {
  assert.equal((await join()).status, 201);

  const leave = await request(
    'POST',
    '/student/classes/class-1/leave',
    student.token
  );
  assert.equal(leave.status, 204);

  assert.equal((await join()).status, 201);

  const records = await Enrollment.find({
    classId: 'class-1',
    studentId: student.user.studentId
  }).lean();

  assert.equal(records.length, 1);
  assert.equal(records[0].enrollment, 'Enrolled');

  assert.deepEqual(
    records[0].history.map(event => event.action),
    ['joined', 'removed', 'joined']
  );
});

// TEST 8
test('student routes require authentication and student role', async () => {
  const anonymous = await request(
    'GET', '/student/classes', null
  );
  assert.equal(anonymous.status, 401);

  const teacherList = await request(
    'GET', '/student/classes', teacher.token
  );
  assert.equal(teacherList.status, 403);

  const teacherDetails = await request(
    'GET', '/student/classes/class-1', teacher.token
  );
  assert.equal(teacherDetails.status, 403);

  const teacherLeave = await request(
    'POST', '/student/classes/class-1/leave', teacher.token
  );
  assert.equal(teacherLeave.status, 403);
});
