import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { access, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import mongoose from 'mongoose';
import sharp from 'sharp';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import { connectToDatabase } from '../database.js';
import { User } from '../models/user.model.js';
import { uploadDirectory } from '../services/photo.service.js';

let mongo, server, base, teacher, student;
const photos = new Set();
async function request(method, path, token, body) {
  const response = await fetch(`${base}/api/auth${path}`, {
    method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, body: await response.json() };
}
async function register(role) {
  const result = await request('POST', `/register/${role}`, null, {
    firstName: role, lastName: 'Test', email: `profile-${role}@example.com`, password: 'password123',
    ...(role === 'teacher' ? { employeeId: 'profile-teacher', department: 'IT' } : { studentId: 'profile-student' }),
  });
  assert.equal(result.status, 201);
  return result.body;
}
async function upload(token, bytes, type = 'image/png', field = 'photo') {
  const form = new FormData();
  form.append(field, new Blob([bytes], { type }), 'untrusted-name.png');
  const response = await fetch(`${base}/api/auth/me/photo`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form });
  const body = await response.json();
  if (body.user?.photo) photos.add(body.user.photo);
  return { status: response.status, body };
}
before(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  await connectToDatabase();
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  teacher = await register('teacher');
  student = await register('student');
});
after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  await mongo?.stop();
  for (const photo of photos) {
    await unlink(join(uploadDirectory, photo.slice('uploads/'.length))).catch((error) => { if (error.code !== 'ENOENT') throw error; });
  }
});

test('all profile routes require authentication', async () => {
  for (const [method, path, body] of [['GET', '/me'], ['PATCH', '/me', { firstName: 'X' }], ['POST', '/me/password', { currentPassword: 'password123', newPassword: 'new-password123' }]]) {
    assert.equal((await request(method, path, null, body)).status, 401);
    assert.equal((await request(method, path, 'invalid', body)).status, 401);
  }
  assert.equal((await upload(null, 'invalid')).status, 401);
});

test('profile serialization is explicit and supports both roles and legacy documents', async () => {
  for (const account of [teacher, student]) {
    // Simulate a document predating the new profile fields.
    await User.updateOne({ id: account.user.id }, { $unset: { photo: '', contactInfo: '', preferences: '' } });
    const { status, body: { user } } = await request('GET', '/me', account.token);
    assert.equal(status, 200);
    assert.equal(user.id, account.user.id);
    assert.equal(user.role, account.user.role);
    assert.equal(user.photo, null);
    assert.deepEqual(user.contactInfo, { phone: '' });
    assert.equal(user.preferences.notifications.examUpdatesEmail, true);
    assert.ok(user.createdAt);
    for (const key of ['password', 'passwordHash', '_id', 'updatedAt', '__v']) assert.equal(key in user, false);
  }
});

test('partial profile changes persist without changing another account or sibling preferences', async () => {
  for (const account of [teacher, student]) {
    const updated = await request('PATCH', '/me', account.token, {
      firstName: ' Updated ', lastName: ' Person ', contactInfo: { phone: ' +63 123456 ' },
      preferences: { notifications: { examUpdatesEmail: false }, monitoring: { soundOnAlert: false } },
    });
    assert.equal(updated.status, 200);
    const fetched = await request('GET', '/me', account.token);
    assert.deepEqual(fetched.body, updated.body);
    assert.equal(fetched.body.user.firstName, 'Updated');
    assert.equal(fetched.body.user.contactInfo.phone, '+63 123456');
    assert.equal(fetched.body.user.preferences.notifications.examUpdatesEmail, false);
    assert.equal(fetched.body.user.preferences.notifications.flaggedEventAlerts, true);
  }
  assert.equal((await request('PATCH', '/me', teacher.token, { lastName: 'TeacherOnly' })).status, 200);
  assert.equal((await request('GET', '/me', student.token)).body.user.lastName, 'Person');
});

test('email updates normalize, remain unique, and are usable for login', async () => {
  const duplicate = await request('PATCH', '/me', teacher.token, { email: ' PROFILE-STUDENT@example.com ' });
  assert.equal(duplicate.status, 409);
  assert.match(duplicate.body.error, /email/);
  assert.equal((await request('PATCH', '/me', teacher.token, { email: ' PROFILE-NEW@example.com ' })).status, 200);
  assert.equal((await request('GET', '/me', teacher.token)).body.user.email, 'profile-new@example.com');
  assert.equal((await request('POST', '/login', null, { email: 'profile-new@example.com', password: 'password123', role: 'teacher' })).status, 200);
});

test('invalid, unknown and protected fields are rejected without applying other changes', async () => {
  const invalid = [null, [], {}, { firstName: '' }, { email: 'bad' }, { contactInfo: null }, { contactInfo: { address: 'x' } },
    { contactInfo: { phone: 123 } }, { preferences: { unknown: {} } }, { preferences: { monitoring: { soundOnAlert: 'yes' } } }];
  for (const field of ['id', '_id', 'role', 'employeeId', 'studentId', 'department', 'passwordHash', 'password', 'createdAt', 'photo', '$set', 'contactInfo.phone']) invalid.push({ firstName: 'MustNotSave', [field]: 'bad' });
  for (const body of invalid) {
    const result = await request('PATCH', '/me', teacher.token, body);
    assert.equal(result.status, 400, JSON.stringify(body));
    if (body === null) assert.equal(result.body.error, 'Invalid JSON body');
    else {
      assert.equal(result.body.error, 'Validation failed');
      assert.ok(Array.isArray(result.body.details));
    }
  }
  assert.equal((await request('GET', '/me', teacher.token)).body.user.firstName, 'Updated');
});

test('password change validates input and current password; only new password works afterward for both roles', async () => {
  for (const account of [teacher, student]) {
    for (const body of [null, {}, { currentPassword: 'password123', newPassword: 'short' }, { currentPassword: 'password123', newPassword: 'x'.repeat(129) }, { currentPassword: 'password123', newPassword: 'new-password123', role: 'teacher' }]) {
      assert.equal((await request('POST', '/me/password', account.token, body)).status, 400);
    }
    assert.equal((await request('POST', '/me/password', account.token, { currentPassword: 'wrong', newPassword: 'new-password123' })).status, 401);
    assert.equal((await request('POST', '/me/password', account.token, { currentPassword: 'password123', newPassword: 'password123' })).status, 400);
    const email = (await request('GET', '/me', account.token)).body.user.email;
    const credentials = { email, role: account.user.role };
    assert.equal((await request('POST', '/login', null, { ...credentials, password: 'password123' })).status, 200);
    const changed = await request('POST', '/me/password', account.token, { currentPassword: 'password123', newPassword: 'new-password123' });
    assert.equal(changed.status, 200);
    assert.deepEqual(changed.body, { message: 'Password changed successfully' });
    assert.equal((await request('POST', '/login', null, { ...credentials, password: 'password123' })).status, 401);
    const login = await request('POST', '/login', null, { ...credentials, password: 'new-password123' });
    assert.equal(login.status, 200);
    assert.equal('passwordHash' in login.body.user, false);
  }
});

test('photo upload validates type, content and size, serves an image, and removes the old photo', async () => {
  const png = await sharp({ create: { width: 2, height: 2, channels: 3, background: 'red' } }).png().toBuffer();
  const jpeg = await sharp(png).jpeg().toBuffer();
  for (const [bytes, type, field] of [[png, 'text/plain', 'photo'], [png, 'image/jpeg', 'photo'], ['fake', 'image/png', 'photo'], [png.subarray(0, 16), 'image/png', 'photo'], [Buffer.alloc(2 * 1024 * 1024 + 1), 'image/png', 'photo'], [png, 'image/png', 'wrong']]) {
    assert.equal((await upload(teacher.token, bytes, type, field)).status, 400);
  }
  assert.equal((await request('POST', '/me/photo', teacher.token)).status, 400);
  const first = await upload(teacher.token, png);
  assert.equal(first.status, 200);
  assert.match(first.body.user.photo, /^uploads\/[0-9a-f-]{36}\.png$/);
  assert.equal((await fetch(`${base}/${first.body.user.photo}`)).status, 401);
  assert.equal((await fetch(`${base}/${first.body.user.photo}`, { headers: { Authorization: `Bearer ${student.token}` } })).status, 404);
  const image = await fetch(`${base}/${first.body.user.photo}`, { headers: { Authorization: `Bearer ${teacher.token}` } });
  assert.equal(image.status, 200);
  assert.match(image.headers.get('content-type'), /image\/png/);
  assert.equal(image.headers.get('x-content-type-options'), 'nosniff');
  const second = await upload(teacher.token, jpeg, 'image/jpeg');
  assert.equal(second.status, 200);
  assert.notEqual(first.body.user.photo, second.body.user.photo);
  await assert.rejects(access(join(uploadDirectory, first.body.user.photo.slice('uploads/'.length))), { code: 'ENOENT' });
  assert.equal((await request('GET', '/me', teacher.token)).body.user.photo, second.body.user.photo);
  assert.equal((await request('GET', '/me', student.token)).body.user.photo, null);
  assert.equal((await upload(student.token, png)).status, 200);
});
