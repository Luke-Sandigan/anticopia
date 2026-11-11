import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import { connectToDatabase } from '../database.js';
import { Class } from '../models/class.model.js';
import { Enrollment } from '../models/enrollment.model.js';
import { User } from '../models/user.model.js';
import { Exam } from '../models/exam.model.js';
import { Submission } from '../models/submission.model.js';
import { Grade } from '../models/grade.model.js';
import { Flag } from '../models/flag.model.js';
import { accessExam, editExam } from '../services/exam.service.js';
import { Question } from '../models/question.model.js';

let mongo, server, base, teacher, other, student, outsider;
const question = { id: 'q-1', topic: 'Trees', type: 'Essay', question: 'Explain a balanced tree.', points: 10 };
const objective = { id: 'q-2', topic: 'Arrays', type: 'Multiple choice', question: 'Which is O(1)?', points: 2,
  choices: ['Array access', 'Linear search'], correctAnswer: 'Array access' };
const window = () => ({ availableFrom: new Date(Date.now() + 3600000).toISOString(), availableUntil: new Date(Date.now() + 7200000).toISOString() });
async function request(method, path, token, body) {
  const response = await fetch(`${base}/api${path}`, { method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, body: response.status === 204 ? null : await response.json() };
}
async function register(role, suffix) {
  const result = await request('POST', `/auth/register/${role}`, null, { firstName: suffix, lastName: 'Test',
    email: `${suffix}@example.com`, password: 'password123',
    ...(role === 'teacher' ? { employeeId: suffix, department: 'IT' } : { studentId: suffix }) });
  assert.equal(result.status, 201);
  return result.body;
}
async function create(input = {}, classId = 'it-201') {
  const result = await request('POST', `/classes/${classId}/exams`, teacher.token, { title: 'Midterm', duration: 30, ...input });
  assert.equal(result.status, 201, JSON.stringify(result.body));
  return result.body.exam;
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
  await Promise.all([Class, Enrollment, User, Exam, Submission, Grade, Flag, Question].map((model) => model.deleteMany({})));
  teacher = await register('teacher', 'teacher');
  other = await register('teacher', 'other');
  student = await register('student', 'S-001');
  outsider = await register('student', 'S-002');
  await Class.create({ classId: 'it-201', name: 'Data Structures', section: 'A', subject: 'IT', term: '2026', code: 'IT201', teacherId: teacher.user.id });
  await Enrollment.create({ classId: 'it-201', userId: student.user.id, studentId: student.user.studentId, name: 'Student' });
});
const operations = (id) => [
  ['GET', '/exams'], ['GET', `/exams/${id}`], ['PATCH', `/exams/${id}`, { title: 'Edited' }],
  ['POST', `/exams/${id}/publish`], ['POST', `/exams/${id}/schedule`, window()],
  ['POST', `/exams/${id}/unpublish`], ['POST', `/exams/${id}/duplicate`], ['DELETE', `/exams/${id}`],
  ['POST', '/classes/it-201/exams', { title: 'New' }],
];
test('all exam routes require auth; all mutations require owning teacher', async () => {
  const exam = await create();
  for (const [method, path, body] of operations(exam.id)) {
    assert.equal((await request(method, path, null, body)).status, 401, `${method} ${path}`);
    if (path === '/exams') continue;
    assert.equal((await request(method, path, other.token, body)).status, 403, `${method} ${path}`);
    if (method !== 'GET') assert.equal((await request(method, path, student.token, body)).status, 403, `${method} ${path}`);
  }
  assert.equal((await request('GET', `/exams/${exam.id}`, outsider.token)).status, 403);
  assert.equal((await request('GET', '/exams?classId=it-201', other.token)).status, 403);
  assert.equal((await request('GET', '/exams?classId=it-201', outsider.token)).status, 403);
  assert.equal((await request('GET', '/exams', other.token)).body.pagination.total, 0);
  assert.equal((await request('GET', '/exams', outsider.token)).body.pagination.total, 0);
});
test('missing exams and classes return consistent 404 errors', async () => {
  for (const [method, path, body] of operations('missing')) {
    if (path === '/exams' || path.startsWith('/classes')) continue;
    const result = await request(method, path, teacher.token, body);
    assert.equal(result.status, 404);
    assert.equal(typeof result.body.error, 'string');
  }
  assert.equal((await request('POST', '/classes/missing/exams', teacher.token, { title: 'New' })).status, 404);
  assert.equal((await request('GET', '/exams?classId=missing', teacher.token)).status, 404);
});
test('create, view, edit settings, publish, unpublish and schedule work end to end', async () => {
  const exam = await create({ description: 'Description', instructions: 'Instructions', passingScore: 70,
    detectTabSwitches: false, detectMultiDevice: false, captureScreenshots: true });
  assert.equal(exam.status, 'draft');
  assert.equal(exam.availableFrom, null);
  assert.equal(exam.title, 'Midterm');
  assert.equal(exam.classCode, 'IT201');
  assert.equal(exam.captureScreenshots, true);
  const edited = await request('PATCH', `/exams/${exam.id}`, teacher.token, { title: 'Final', questions: [question, objective], ...window() });
  assert.equal(edited.status, 200);
  assert.equal(edited.body.exam.title, 'Final');
  assert.equal(edited.body.exam.questionCount, 2);
  assert.deepEqual(edited.body.exam.questions[1].choices, objective.choices);
  assert.equal((await request('GET', `/exams/${exam.id}`, teacher.token)).body.exam.description, 'Description');
  const published = await request('POST', `/exams/${exam.id}/publish`, teacher.token);
  assert.equal(published.status, 200);
  assert.equal(published.body.exam.status, 'scheduled');
  assert.equal((await request('POST', `/exams/${exam.id}/publish`, teacher.token)).status, 409);
  assert.equal((await request('PATCH', `/exams/${exam.id}`, teacher.token, { questions: [] })).status, 409);
  const unpublished = await request('POST', `/exams/${exam.id}/unpublish`, teacher.token);
  assert.equal(unpublished.status, 200);
  assert.equal(unpublished.body.exam.status, 'draft');
  assert.equal((await request('POST', `/exams/${exam.id}/unpublish`, teacher.token)).status, 409);
  const scheduled = await request('POST', `/exams/${exam.id}/schedule`, teacher.token, window());
  assert.equal(scheduled.status, 200);
  assert.equal(scheduled.body.exam.published, true);
});
test('publishing requires actual questions and a valid nonexpired schedule', async () => {
  const empty = await create({ ...window() });
  assert.equal((await request('POST', `/exams/${empty.id}/publish`, teacher.token)).status, 409);
  const unscheduled = await create({ questions: [question] });
  assert.equal((await request('POST', `/exams/${unscheduled.id}/publish`, teacher.token)).status, 400);
  const past = await create({ questions: [question], availableFrom: new Date(Date.now() - 7200000).toISOString(), availableUntil: new Date(Date.now() - 3600000).toISOString() });
  assert.equal((await request('POST', `/exams/${past.id}/publish`, teacher.token)).status, 409);
  assert.equal((await request('POST', `/exams/${unscheduled.id}/schedule`, teacher.token, {})).status, 400);
  assert.equal((await request('POST', `/exams/${unscheduled.id}/schedule`, teacher.token,
    { availableFrom: new Date(Date.now() - 60000).toISOString(), availableUntil: new Date(Date.now() + 3600000).toISOString() })).status, 400);
});
test('validates bodies, date/time logic, durations, settings, questions and immutable fields', async () => {
  for (const body of [null, [], {}, { title: '' }, { title: 'X', duration: 0 }, { title: 'X', duration: '30' },
    { title: 'X', passingScore: 101 }, { title: 'X', captureScreenshots: 'true' }, { title: 'X', published: true },
    { title: 'X', classId: 'elsewhere' }, { title: 'X', availableFrom: window().availableFrom },
    { title: 'X', availableFrom: '2027-02-30T10:00:00Z', availableUntil: '2027-03-01T11:00:00Z' },
    { title: 'X', availableFrom: '2027-01-01T10:00', availableUntil: '2027-01-01T11:00' },
    { title: 'X', availableFrom: '2027-01-01T11:00:00Z', availableUntil: '2027-01-01T10:00:00Z' },
    { title: 'X', duration: 61, availableFrom: '2027-01-01T10:00:00Z', availableUntil: '2027-01-01T11:00:00Z' },
    { title: 'X', questions: [question, question] }, { title: 'X', questions: [{ ...objective, correctAnswer: 'Missing' }] },
    { title: 'X', questions: [{ ...question, points: -1 }] }]) {
    const result = await request('POST', '/classes/it-201/exams', teacher.token, body);
    assert.equal(result.status, 400, JSON.stringify(body));
    assert.equal(typeof result.body.error, 'string');
  }
  const exam = await create({ ...window() });
  assert.equal((await request('PATCH', `/exams/${exam.id}`, teacher.token, { duration: 1000 })).status, 400);
  assert.equal((await request('PATCH', `/exams/${exam.id}`, teacher.token, { revision: 2 })).status, 400);
  assert.equal((await request('GET', '/exams/bad%20id', teacher.token)).status, 400);
  assert.equal((await request('POST', `/exams/${exam.id}/publish`, teacher.token, { arbitrary: true })).status, 400);
});
test('live and past published exams lock settings and publication state', async () => {
  for (const past of [false, true]) {
    const exam = await create({ questions: [question], ...window() });
    await Exam.updateOne({ examId: exam.id }, { $set: { published: true, startsAt: new Date(Date.now() - 7200000),
      endsAt: new Date(Date.now() + (past ? -3600000 : 3600000)) } });
    for (const [method, suffix, body] of [['PATCH', '', { duration: 20 }], ['POST', '/unpublish'], ['POST', '/publish'], ['POST', '/schedule', window()]]) {
      assert.equal((await request(method, `/exams/${exam.id}${suffix}`, teacher.token, body)).status, 409);
    }
  }
});
test('any submission or legacy grade locks edits and publication, even on drafts', async () => {
  for (const kind of ['submission', 'grade']) {
    const exam = await create({ questions: [question], ...window() });
    if (kind === 'submission') await Submission.create({ examId: exam.id, studentId: 'S-001' });
    else await Grade.create({ examId: exam.id, studentId: 'S-001', percentage: 80 });
    for (const [method, suffix, body] of [['PATCH', '', { title: 'Changed' }], ['POST', '/publish'], ['POST', '/unpublish']]) {
      assert.equal((await request(method, `/exams/${exam.id}${suffix}`, teacher.token, body)).status, 409);
    }
  }
});
test('students only see enrolled published exams and never receive questions or answers', async () => {
  const exam = await create({ questions: [objective], ...window() });
  assert.equal((await request('GET', `/exams/${exam.id}`, student.token)).status, 404);
  assert.equal((await request('GET', '/exams', student.token)).body.pagination.total, 0);
  await request('POST', `/exams/${exam.id}/publish`, teacher.token);
  const details = await request('GET', `/exams/${exam.id}`, student.token);
  assert.equal(details.status, 200);
  assert.equal(details.body.exam.questionCount, 1);
  assert.equal(details.body.exam.questions, undefined);
  assert.equal(JSON.stringify(details.body).includes(objective.correctAnswer), false);
  const list = await request('GET', '/exams', student.token);
  assert.equal(list.body.exams[0].questions, undefined);
  assert.equal((await request('GET', '/exams?status=draft', student.token)).body.pagination.total, 0);
  assert.equal((await request('GET', '/exams?includeArchived=true', student.token)).status, 403);
  await Enrollment.updateOne({ userId: student.user.id }, { $set: { enrollment: 'Removed' } });
  assert.equal((await request('GET', `/exams/${exam.id}`, student.token)).status, 403);
});
test('lists filter by class and lifecycle status, paginate, and search literally', async () => {
  await Class.create({ classId: 'it-305', name: 'DB', section: 'A', subject: 'IT', term: '2026', code: 'DB', teacherId: teacher.user.id });
  await create({ title: 'Draft' });
  await create({ title: 'Different class' }, 'it-305');
  for (const status of ['scheduled', 'ongoing', 'past']) {
    const exam = await create({ title: status, ...window() });
    const now = Date.now();
    await Exam.updateOne({ examId: exam.id }, { $set: { published: true,
      startsAt: new Date(now + (status === 'scheduled' ? 3600000 : -7200000)),
      endsAt: new Date(now + (status === 'past' ? -3600000 : 7200000)) } });
  }
  for (const status of ['draft', 'scheduled', 'ongoing', 'past']) {
    const result = await request('GET', `/exams?classId=it-201&status=${status}`, teacher.token);
    assert.equal(result.body.pagination.total, 1);
    assert.equal(result.body.exams[0].status, status);
  }
  const page = await request('GET', '/exams?page=2&limit=2', teacher.token);
  assert.deepEqual(page.body.pagination, { page: 2, limit: 2, total: 5, totalPages: 3 });
  assert.equal(page.body.exams.length, 2);
  assert.equal((await request('GET', '/exams?search=different', teacher.token)).body.pagination.total, 1);
  assert.equal((await request('GET', '/exams?search=.*', teacher.token)).body.pagination.total, 0);
  for (const query of ['status=bad', 'limit=101', 'page=0', 'classId[x]=bad', 'includeArchived=x', 'arbitrary=x']) {
    assert.equal((await request('GET', `/exams?${query}`, teacher.token)).status, 400);
  }
});
test('duplicate copies content and settings into an independent unscheduled draft', async () => {
  const exam = await create({ title: 'Original', questions: [objective], ...window(), captureScreenshots: true });
  await request('POST', `/exams/${exam.id}/publish`, teacher.token);
  const duplicate = await request('POST', `/exams/${exam.id}/duplicate`, teacher.token);
  assert.equal(duplicate.status, 201);
  const copy = duplicate.body.exam;
  assert.notEqual(copy.id, exam.id);
  assert.equal(copy.title, 'Original (copy)');
  assert.equal(copy.status, 'draft');
  assert.equal(copy.availableFrom, null);
  assert.equal(copy.availableUntil, null);
  assert.equal(copy.captureScreenshots, true);
  assert.equal(copy.questionCount, 1);
  await request('PATCH', `/exams/${copy.id}`, teacher.token, { questions: [] });
  assert.equal((await request('GET', `/exams/${exam.id}`, teacher.token)).body.exam.questionCount, 1);
});
test('archive hides lists and student details while preserving submissions, grades and evidence', async () => {
  const exam = await create({ questions: [question], ...window() });
  await request('POST', `/exams/${exam.id}/publish`, teacher.token);
  await Submission.insertMany([{ examId: exam.id, studentId: 'S-001', status: 'submitted', submittedAt: new Date() }]);
  await Grade.create({ examId: exam.id, studentId: 'S-001', percentage: 80 });
  await Flag.create({ examId: exam.id, studentId: 'S-001', evidence: { screenshot: 'keep' } });
  assert.equal((await request('DELETE', `/exams/${exam.id}`, teacher.token)).status, 204);
  assert.equal((await request('GET', '/exams', teacher.token)).body.pagination.total, 0);
  assert.equal((await request('GET', '/exams?includeArchived=true', teacher.token)).body.pagination.total, 1);
  assert.equal((await request('GET', `/exams/${exam.id}`, teacher.token)).status, 200);
  assert.equal((await request('GET', `/exams/${exam.id}`, student.token)).status, 404);
  assert.equal((await request('GET', '/classes/it-201/exams', teacher.token)).body.pagination.total, 0);
  assert.equal((await request('GET', '/classes/it-201/exams', student.token)).body.pagination.total, 0);
  assert.equal((await request('PATCH', `/exams/${exam.id}`, teacher.token, { title: 'No' })).status, 409);
  assert.equal((await request('DELETE', `/exams/${exam.id}`, teacher.token)).status, 409);
  assert.equal(await Submission.countDocuments({ examId: exam.id }), 1);
  assert.equal(await Grade.countDocuments({ examId: exam.id }), 1);
  assert.deepEqual((await Flag.findOne({ examId: exam.id }).lean()).evidence, { screenshot: 'keep' });
  const duplicate = await request('POST', `/exams/${exam.id}/duplicate`, teacher.token);
  assert.equal(duplicate.status, 201);
  assert.equal((await Exam.findOne({ examId: duplicate.body.exam.id }).lean()).hasSubmissions, false);
});
test('archived parent class permits reads but rejects every exam mutation', async () => {
  const exam = await create();
  await Class.updateOne({ classId: 'it-201' }, { $set: { status: 'archived' } });
  for (const [method, path, body] of operations(exam.id)) {
    if (method === 'GET') continue;
    assert.equal((await request(method, path, teacher.token, body)).status, 409);
  }
  assert.equal((await request('GET', `/exams/${exam.id}`, teacher.token)).status, 200);
});
test('revision guards reject stale updates and submission locks survive record deletion', async () => {
  const exam = await create();
  const context = await accessExam(exam.id, teacher.user, true);
  await editExam(context, teacher.user, { name: 'First edit' });
  await assert.rejects(editExam(context, teacher.user, { name: 'Stale edit' }), { statusCode: 409 });
  const current = await accessExam(exam.id, teacher.user, true);
  await Submission.create({ examId: exam.id, studentId: 'S-001' });
  await Submission.deleteMany({ examId: exam.id });
  await assert.rejects(editExam(current, teacher.user, { name: 'After submission' }), { statusCode: 409 });
  assert.equal((await request('PATCH', `/exams/${exam.id}`, teacher.token, { title: 'No' })).status, 409);
});

const bankInputs = [
  { text: 'What is 2 + 2?', type: 'multiple_choice', options: ['3', '4'], correctAnswer: '4', points: 2 },
  { text: 'A stack is LIFO.', type: 'true_false', correctAnswer: true, points: 3 },
  { text: 'Explain a balanced tree.', type: 'essay', points: 5 },
];
async function createBank(input = bankInputs[0], token = teacher.token) {
  const result = await request('POST', '/questions', token, input);
  assert.equal(result.status, 201, JSON.stringify(result.body));
  return result.body.question;
}
test('BE-06 creates all three types, filters own questions and searches with pagination', async () => {
  for (const input of bankInputs) await createBank(input);
  await createBank(bankInputs[0], other.token);
  const list = await request('GET', '/questions', teacher.token);
  assert.equal(list.status, 200);
  assert.equal(list.body.pagination.total, 3);
  assert.equal(list.body.questions.find((item) => item.type === 'true_false').correctAnswer, 'True');
  for (const type of ['multiple_choice', 'true_false', 'essay']) {
    const filtered = await request('GET', `/questions?type=${type}`, teacher.token);
    assert.equal(filtered.body.questions.length, 1);
    assert.equal(filtered.body.questions[0].type, type);
  }
  assert.equal((await request('GET', '/questions?search=stack', teacher.token)).body.pagination.total, 1);
  assert.equal((await request('GET', '/questions?search=.*', teacher.token)).body.pagination.total, 0);
  assert.deepEqual((await request('GET', '/questions?limit=1&page=2', teacher.token)).body.pagination,
    { page: 2, limit: 1, total: 3, totalPages: 3 });
});
test('BE-06 attaches all three, preserves order on refetch, calculates points and removes one', async () => {
  const bank = [];
  for (const input of bankInputs) bank.push(await createBank(input));
  const exam = await create({ ...window() });
  const ids = bank.map((item) => item.id);
  const attached = await request('POST', `/exams/${exam.id}/questions`, teacher.token, { questionIds: ids });
  assert.equal(attached.status, 200);
  assert.equal(attached.body.exam.totalPoints, 10);
  const order = [ids[2], ids[0], ids[1]];
  assert.equal((await request('PATCH', `/exams/${exam.id}/questions/order`, teacher.token, { questionIds: order })).status, 200);
  const details = await request('GET', `/exams/${exam.id}`, teacher.token);
  assert.deepEqual(details.body.exam.questions.map((item) => item.id), order);
  assert.equal(details.body.exam.totalPoints, 10);
  await request('POST', `/exams/${exam.id}/publish`, teacher.token);
  const visible = await request('GET', `/exams/${exam.id}`, student.token);
  assert.equal(visible.status, 200);
  assert.equal(visible.body.exam.totalPoints, 10);
  assert.equal(visible.body.exam.questions, undefined);
  assert.equal(JSON.stringify(visible.body).includes('correctAnswer'), false);
  assert.equal(JSON.stringify((await request('GET', '/exams', student.token)).body).includes('correctAnswer'), false);
  assert.equal(JSON.stringify((await request('GET', '/classes/it-201/exams', student.token)).body).includes('correctAnswer'), false);
  const removed = await request('DELETE', `/exams/${exam.id}/questions/${ids[0]}`, teacher.token);
  assert.equal(removed.status, 200);
  assert.equal(removed.body.exam.totalPoints, 8);
  assert.equal(removed.body.exam.questionCount, 2);
});
test('BE-06 protects every new route with authentication, role and ownership checks', async () => {
  const bank = await createBank();
  const exam = await create();
  const routes = [
    ['POST', '/questions', bankInputs[0]], ['GET', '/questions'],
    ['PATCH', `/questions/${bank.id}`, { text: 'Changed' }], ['DELETE', `/questions/${bank.id}`],
    ['POST', `/exams/${exam.id}/questions`, { questionIds: [bank.id] }],
    ['DELETE', `/exams/${exam.id}/questions/${bank.id}`],
    ['PATCH', `/exams/${exam.id}/questions/order`, { questionIds: [bank.id] }],
  ];
  for (const [method, path, body] of routes) {
    assert.equal((await request(method, path, null, body)).status, 401);
    assert.equal((await request(method, path, student.token, body)).status, 403);
    if (path !== '/questions') assert.equal((await request(method, path, other.token, body)).status, 403);
  }
  const otherQuestion = await createBank(bankInputs[1], other.token);
  assert.equal((await request('POST', `/exams/${exam.id}/questions`, teacher.token, { questionIds: [bank.id, otherQuestion.id] })).status, 403);
  assert.equal((await request('GET', `/exams/${exam.id}`, teacher.token)).body.exam.questionCount, 0);
});
test('BE-06 bank edits and deletion preserve attached snapshots and totals', async () => {
  const bank = await createBank();
  const exam = await create();
  await request('POST', `/exams/${exam.id}/questions`, teacher.token, { questionIds: [bank.id] });
  const edited = await request('PATCH', `/questions/${bank.id}`, teacher.token, { text: 'Updated bank question', points: 7 });
  assert.equal(edited.status, 200);
  assert.equal(edited.body.question.points, 7);
  assert.equal((await request('DELETE', `/questions/${bank.id}`, teacher.token)).status, 204);
  assert.equal((await request('GET', '/questions', teacher.token)).body.pagination.total, 0);
  assert.equal((await request('PATCH', `/questions/${bank.id}`, teacher.token, { points: 1 })).status, 404);
  assert.equal((await request('DELETE', `/questions/${bank.id}`, teacher.token)).status, 404);
  const details = (await request('GET', `/exams/${exam.id}`, teacher.token)).body.exam;
  assert.equal(details.totalPoints, 2);
  assert.equal(details.questions[0].question, bankInputs[0].text);
  const nextExam = await create();
  assert.equal((await request('POST', `/exams/${nextExam.id}/questions`, teacher.token, { questionIds: [bank.id] })).status, 404);
});
test('BE-06 rejects malformed questions, unsupported types and invalid filters', async () => {
  for (const body of [null, [], {}, { ...bankInputs[0], type: 'short_answer' }, { ...bankInputs[0], text: '' },
    { ...bankInputs[0], options: ['3'] }, { ...bankInputs[0], options: ['4', '4'] },
    { ...bankInputs[0], correctAnswer: '5' }, { ...bankInputs[0], points: 0.001 },
    { ...bankInputs[0], teacherId: other.user.id }, { ...bankInputs[1], correctAnswer: 'maybe' },
    { ...bankInputs[2], options: ['unexpected'] }]) {
    assert.equal((await request('POST', '/questions', teacher.token, body)).status, 400, JSON.stringify(body));
  }
  for (const query of ['type=short_answer', 'limit=101', 'page=0', 'search[x]=bad', 'type[x]=bad', 'teacherId=other']) {
    assert.equal((await request('GET', `/questions?${query}`, teacher.token)).status, 400);
  }
  assert.equal((await request('PATCH', '/questions/missing', teacher.token, { points: 2 })).status, 404);
  assert.equal((await request('DELETE', '/questions/missing', teacher.token)).status, 404);
});
test('BE-06 builder rejects duplicates, missing questions and incomplete reorder without partial writes', async () => {
  const bank = await createBank();
  const exam = await create();
  const attach = `/exams/${exam.id}/questions`;
  assert.equal((await request('POST', attach, teacher.token, { questionIds: [bank.id, 'missing'] })).status, 404);
  for (const body of [{}, { questionIds: [] }, { questionIds: [bank.id, bank.id] }, { questionIds: ['bad id'] }, { questionIds: 'bad' }]) {
    assert.equal((await request('POST', attach, teacher.token, body)).status, 400);
  }
  assert.equal((await request('GET', `/exams/${exam.id}`, teacher.token)).body.exam.totalPoints, 0);
  assert.equal((await request('POST', attach, teacher.token, { questionIds: [bank.id] })).status, 200);
  assert.equal((await request('POST', attach, teacher.token, { questionIds: [bank.id] })).status, 409);
  assert.equal((await request('PATCH', `${attach}/order`, teacher.token, { questionIds: ['missing'] })).status, 400);
  assert.equal((await request('DELETE', `${attach}/missing`, teacher.token)).status, 404);
  assert.equal((await request('POST', '/exams/missing/questions', teacher.token, { questionIds: [bank.id] })).status, 404);
  assert.equal((await request('DELETE', '/exams/missing/questions/abc', teacher.token)).status, 404);
  assert.equal((await request('PATCH', '/exams/missing/questions/order', teacher.token, { questionIds: [bank.id] })).status, 404);
});
test('BE-06 builder honors live, submitted and archived exam locks and the published-question minimum', async () => {
  const bank = await createBank();
  const second = await createBank(bankInputs[1]);
  for (const state of ['live', 'submitted', 'archived']) {
    const exam = await create({ ...window() });
    await request('POST', `/exams/${exam.id}/questions`, teacher.token, { questionIds: [bank.id] });
    if (state === 'live') await Exam.updateOne({ examId: exam.id }, { $set: { published: true, startsAt: new Date(Date.now() - 1000) } });
    if (state === 'submitted') await Submission.create({ examId: exam.id, studentId: 'S-001' });
    if (state === 'archived') await request('DELETE', `/exams/${exam.id}`, teacher.token);
    for (const [method, suffix, body] of [['POST', '', { questionIds: [second.id] }], ['DELETE', `/${bank.id}`], ['PATCH', '/order', { questionIds: [bank.id] }]]) {
      assert.equal((await request(method, `/exams/${exam.id}/questions${suffix}`, teacher.token, body)).status, 409);
    }
  }
  const scheduled = await create({ ...window() });
  await request('POST', `/exams/${scheduled.id}/questions`, teacher.token, { questionIds: [bank.id] });
  await request('POST', `/exams/${scheduled.id}/publish`, teacher.token);
  assert.equal((await request('DELETE', `/exams/${scheduled.id}/questions/${bank.id}`, teacher.token)).status, 409);
});
