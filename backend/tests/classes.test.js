import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import { connectToDatabase } from '../database.js';
import { Class } from '../models/class.model.js';
import { Enrollment } from '../models/enrollment.model.js';
import { Exam } from '../models/exam.model.js';
import { Grade } from '../models/grade.model.js';
import { Flag } from '../models/flag.model.js';
import { User } from '../models/user.model.js';

let mongo, server, base, teacher, other, student, outsider;
async function request(method, path, token, body) {
  const response = await fetch(`${base}/api/classes${path}`, { method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, body: response.status === 204 ? null : await response.json() };
}
async function register(role, suffix) {
  const response = await fetch(`${base}/api/auth/register/${role}`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstName: suffix, lastName: 'Test', email: `${suffix}@example.com`, password: 'password123',
      ...(role === 'teacher' ? { employeeId: suffix, department: 'IT' } : { studentId: suffix }) }) });
  assert.equal(response.status, 201);
  return response.json();
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
  await Promise.all([Class, Enrollment, User, Exam, Grade, Flag].map((model) => model.deleteMany({})));
  teacher = await register('teacher', 'teacher');
  other = await register('teacher', 'other');
  student = await register('student', 'S-001');
  outsider = await register('student', 'S-002');
  await Class.create({ classId: 'it-201', name: 'Data Structures', section: 'A', subject: 'IT', term: '2026', code: 'IT201',
    teacherId: teacher.user.id, joinCode: 'ABCDEF123456' });
});
test('every class endpoint requires authentication and rejects invalid tokens', async () => {
  for (const [method, path, body] of [
    ['GET', ''], ['GET', '/it-201'], ['PATCH', '/it-201', { name: 'New' }], ['DELETE', '/it-201'],
    ['GET', '/it-201/roster'], ['POST', '/it-201/roster', { identifier: 'S-001' }], ['DELETE', '/it-201/roster/S-001'],
    ['POST', '/join', { joinCode: 'ABCDEF123456' }], ['POST', '/it-201/join-code/regenerate'],
    ['GET', '/it-201/exams'], ['GET', '/it-201/summary'],
  ]) assert.equal((await request(method, path, null, body)).status, 401, `${method} ${path}`);
  assert.equal((await request('GET', '/it-201', `${teacher.token}x`)).status, 401);
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const unsigned = `${encode({ alg: 'HS256' })}.${encode({ sub: teacher.user.id, exp: 1 })}`;
  const expired = `${unsigned}.${createHmac('sha256', process.env.JWT_SECRET || 'local-development-secret-change-me').update(unsigned).digest('base64url')}`;
  assert.equal((await request('GET', '/it-201', expired)).status, 401);
});
test('ownership and enrollment protect reads and writes', async () => {
  for (const [method, path, body] of [
    ['GET', '/it-201'], ['PATCH', '/it-201', { name: 'Bad' }], ['DELETE', '/it-201'],
    ['GET', '/it-201/roster'], ['POST', '/it-201/roster', { identifier: 'S-001' }],
    ['DELETE', '/it-201/roster/S-001'], ['POST', '/it-201/join-code/regenerate'],
    ['GET', '/it-201/exams'], ['GET', '/it-201/summary'],
  ]) assert.equal((await request(method, path, other.token, body)).status, 403, `${method} ${path}`);
  assert.equal((await request('GET', '/it-201', student.token)).status, 403);
  await request('POST', '/join', student.token, { joinCode: 'ABCDEF123456' });
  for (const [method, path, body] of [['GET', '/it-201/roster'], ['PATCH', '/it-201', { name: 'Bad' }],
    ['DELETE', '/it-201'], ['POST', '/it-201/roster', { identifier: 'S-002' }],
    ['DELETE', '/it-201/roster/S-002'], ['POST', '/it-201/join-code/regenerate']]) {
    assert.equal((await request(method, path, student.token, body)).status, 403);
  }
  assert.equal((await request('POST', '/join', teacher.token, { joinCode: 'ABCDEF123456' })).status, 403);
});
test('details, editing, validation and missing classes', async () => {
  const result = await request('GET', '/it-201', teacher.token);
  assert.equal(result.body.class.teacher.id, teacher.user.id);
  assert.equal(result.body.class.joinCode, 'ABCDEF123456');
  assert.deepEqual(result.body.class.summary, { studentCount: 0, examCount: 0, averageGrade: null, openFlagCount: 0 });
  const edited = await request('PATCH', '/it-201', teacher.token, { name: 'Updated', schedule: 'Monday', description: 'Test' });
  assert.equal(edited.body.class.name, 'Updated');
  assert.equal(edited.body.class.id, 'it-201');
  for (const body of [null, [], {}, { teacherId: other.user.id }, { name: '' }, { code: 5 }]) {
    assert.equal((await request('PATCH', '/it-201', teacher.token, body)).status, 400);
  }
  for (const [method, suffix, body] of [['GET', ''], ['PATCH', '', { name: 'X' }], ['DELETE', ''],
    ['GET', '/roster'], ['POST', '/roster', { identifier: 'S-001' }], ['DELETE', '/roster/S-001'],
    ['POST', '/join-code/regenerate'], ['GET', '/exams'], ['GET', '/summary']]) {
    assert.equal((await request(method, `/missing${suffix}`, teacher.token, body)).status, 404);
  }
  assert.equal((await request('GET', '/bad%20id', teacher.token)).status, 400);
});
test('roster adds real accounts, prevents duplicates and preserves removal and rejoin history', async () => {
  assert.equal((await request('POST', '/it-201/roster', teacher.token, { identifier: 'missing' })).status, 404);
  assert.equal((await request('POST', '/it-201/roster', teacher.token, null)).status, 400);
  const added = await request('POST', '/it-201/roster', teacher.token, { identifier: student.user.email });
  assert.equal(added.status, 201);
  assert.equal(added.body.student.id, 'S-001');
  assert.equal((await request('POST', '/it-201/roster', teacher.token, { identifier: 'S-001' })).status, 409);
  assert.equal((await request('POST', '/join', student.token, { joinCode: 'ABCDEF123456' })).status, 409);
  const original = await Enrollment.findOne({ studentId: 'S-001' }).lean();
  assert.equal((await request('DELETE', '/it-201/roster/S-001', teacher.token)).status, 204);
  assert.equal((await request('DELETE', '/it-201/roster/S-001', teacher.token)).status, 404);
  assert.equal((await request('GET', '/it-201', student.token)).status, 403);
  assert.equal((await request('GET', '/it-201/roster', teacher.token)).body.pagination.total, 0);
  assert.equal((await request('POST', '/join', student.token, { joinCode: 'ABCDEF123456' })).status, 201);
  const rejoined = await Enrollment.findOne({ studentId: 'S-001' }).lean();
  assert.equal(String(rejoined._id), String(original._id));
  assert.deepEqual(rejoined.history.map((entry) => entry.action), ['joined', 'removed', 'joined']);
  assert.equal((await request('GET', '/it-201', student.token)).body.class.joinCode, undefined);
});
test('unique index handles simultaneous duplicate joins', async () => {
  const results = await Promise.all([1, 2].map(() => request('POST', '/join', student.token, { joinCode: 'ABCDEF123456' })));
  assert.deepEqual(results.map((result) => result.status).sort(), [201, 409]);
  assert.equal(await Enrollment.countDocuments({ classId: 'it-201' }), 1);
});
test('join code rotation invalidates old codes', async () => {
  const rotated = await request('POST', '/it-201/join-code/regenerate', teacher.token);
  assert.equal(rotated.status, 200);
  assert.match(rotated.body.joinCode, /^[A-F0-9]{12}$/);
  assert.notEqual(rotated.body.joinCode, 'ABCDEF123456');
  assert.equal((await request('POST', '/join', student.token, { joinCode: 'ABCDEF123456' })).status, 404);
  assert.equal((await request('POST', '/join', student.token, { joinCode: rotated.body.joinCode })).status, 201);
  assert.equal((await request('POST', '/join', outsider.token, { joinCode: 'bad' })).status, 400);
});
test('pagination and literal search apply to class and roster lists', async () => {
  await request('POST', '/it-201/roster', teacher.token, { identifier: 'S-001' });
  await request('POST', '/it-201/roster', teacher.token, { identifier: 'S-002' });
  const page = await request('GET', '/it-201/roster?limit=1&page=2', teacher.token);
  assert.deepEqual(page.body.pagination, { page: 2, limit: 1, total: 2, totalPages: 2 });
  assert.equal(page.body.roster.length, 1);
  assert.equal((await request('GET', '/it-201/roster?search=S-001', teacher.token)).body.pagination.total, 1);
  assert.equal((await request('GET', '/it-201/roster?search=.*', teacher.token)).body.pagination.total, 0);
  for (const path of ['?limit=101', '?page=-1', '?page=1.2', '?search[x]=a', '?status=invalid']) {
    assert.equal((await request('GET', `/it-201/exams${path}`, teacher.token)).status, 400);
  }
  assert.equal((await request('GET', '?search=Data', teacher.token)).body.pagination.total, 1);
  assert.equal((await request('GET', '', other.token)).body.pagination.total, 0);
  assert.equal((await request('GET', '', outsider.token)).body.pagination.total, 1);
});
async function examFixtures() {
  const now = Date.now();
  await Exam.insertMany([
    { examId: 'future', classId: 'it-201', name: 'Future', published: true, startsAt: new Date(now + 60000), endsAt: new Date(now + 120000) },
    { examId: 'current', classId: 'it-201', name: 'Current', published: true, startsAt: new Date(now - 60000), endsAt: new Date(now + 60000) },
    { examId: 'past', classId: 'it-201', name: 'Past', published: true, startsAt: new Date(now - 120000), endsAt: new Date(now - 60000) },
    { examId: 'draft', classId: 'it-201', name: 'Draft', startsAt: new Date(now + 60000), endsAt: new Date(now + 120000) },
    { examId: 'elsewhere', classId: 'another', name: 'Elsewhere', published: true, startsAt: new Date(now + 60000), endsAt: new Date(now + 120000) },
  ]);
  await Grade.insertMany([
    { examId: 'past', studentId: 'S-001', percentage: 80, released: true },
    { examId: 'current', studentId: 'S-001', percentage: 60 },
    { examId: 'past', studentId: 'S-002', percentage: 100, released: true },
  ]);
  await Flag.insertMany([{ examId: 'past', studentId: 'S-001', evidence: { image: 'keep' } },
    { examId: 'past', studentId: 'S-002' }, { examId: 'draft', studentId: 'S-001' },
    { examId: 'past', studentId: 'S-001', status: 'resolved' }]);
  await request('POST', '/join', student.token, { joinCode: 'ABCDEF123456' });
}
test('exam filters and summary counts respect publication and student privacy', async () => {
  await examFixtures();
  assert.equal((await request('GET', '/it-201/exams', teacher.token)).body.pagination.total, 4);
  assert.equal((await request('GET', '/it-201/exams', student.token)).body.pagination.total, 3);
  for (const status of ['upcoming', 'ongoing', 'past']) {
    const result = await request('GET', `/it-201/exams?status=${status}`, student.token);
    assert.equal(result.body.exams.length, 1);
    assert.equal(result.body.exams[0].status, status);
  }
  assert.equal((await request('GET', '/it-201/exams?search=Future&limit=1', student.token)).body.pagination.total, 1);
  assert.deepEqual((await request('GET', '/it-201/summary', teacher.token)).body.summary,
    { studentCount: 1, examCount: 4, averageGrade: 80, openFlagCount: 3 });
  assert.deepEqual((await request('GET', '/it-201/summary', student.token)).body.summary,
    { studentCount: 1, examCount: 3, averageGrade: 80, openFlagCount: 1 });
});
test('archiving hides default lists, blocks writes and joins, and preserves all records', async () => {
  await examFixtures();
  assert.equal((await request('DELETE', '/it-201', teacher.token)).status, 204);
  for (const token of [teacher.token, student.token]) {
    assert.equal((await request('GET', '', token)).body.pagination.total, 0);
    assert.equal((await request('GET', '?includeArchived=true', token)).body.pagination.total, 1);
    assert.equal((await request('GET', '/it-201', token)).body.class.status, 'archived');
  }
  for (const [method, path, body] of [['PATCH', '/it-201', { name: 'No' }], ['DELETE', '/it-201'],
    ['POST', '/it-201/roster', { identifier: 'S-002' }], ['DELETE', '/it-201/roster/S-001'],
    ['POST', '/it-201/join-code/regenerate']]) assert.equal((await request(method, path, teacher.token, body)).status, 409);
  assert.equal((await request('POST', '/join', outsider.token, { joinCode: 'ABCDEF123456' })).status, 404);
  assert.equal(await Enrollment.countDocuments({}), 1);
  assert.equal(await Exam.countDocuments({ classId: 'it-201' }), 4);
  assert.equal(await Grade.countDocuments({}), 3);
  assert.equal(await Flag.countDocuments({}), 4);
  assert.deepEqual((await Flag.findOne({ evidence: { $exists: true } }).lean()).evidence, { image: 'keep' });
});
test('auth remains compatible and uses persisted users', async () => {
  const response = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: teacher.user.email, password: 'password123', role: 'teacher' }) });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.user.id, teacher.user.id);
  assert.equal(result.user.passwordHash, undefined);
  assert.equal((await request('GET', '/it-201', result.token)).status, 200);
  await User.deleteOne({ id: teacher.user.id });
  assert.equal((await request('GET', '/it-201', teacher.token)).status, 401);
});
