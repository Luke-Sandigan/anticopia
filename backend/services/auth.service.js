import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHmac } from 'node:crypto';
import { promisify } from 'node:util';
import { findUserByEmail, findUserByIdentifier, saveUser } from '../models/user.model.js';

const scrypt = promisify(scryptCallback);
const tokenLifetimeSeconds = 60 * 60;
const tokenSecret = process.env.JWT_SECRET || 'local-development-secret-change-me';

function publicUser(user) {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

async function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const derivedKey = await scrypt(password, salt, 64);
  return { salt, hash: derivedKey.toString('hex') };
}

async function verifyPassword(password, { salt, hash }) {
  const expected = Buffer.from(hash, 'hex');
  const actual = await scrypt(password, salt, expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function createToken(user) {
  const now = Math.floor(Date.now() / 1000);
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const unsigned = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({
    sub: user.id,
    role: user.role,
    email: user.email,
    iat: now,
    exp: now + tokenLifetimeSeconds,
  })}`;
  const signature = createHmac('sha256', tokenSecret).update(unsigned).digest('base64url');
  return `${unsigned}.${signature}`;
}

export async function registerUser(role, input) {
  const email = input.email.trim().toLowerCase();
  const identifierField = role === 'teacher' ? 'employeeId' : 'studentId';
  const identifier = input[identifierField].trim();

  if (findUserByEmail(email)) {
    const error = new Error('An account with this email already exists');
    error.statusCode = 409;
    throw error;
  }
  if (findUserByIdentifier(identifierField, identifier)) {
    const error = new Error(`This ${identifierField} is already registered`);
    error.statusCode = 409;
    throw error;
  }

  const credentials = await hashPassword(input.password);
  const user = saveUser({
    id: randomBytes(12).toString('hex'),
    role,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email,
    [identifierField]: identifier,
    ...(role === 'teacher' ? { department: input.department.trim() } : {}),
    passwordHash: credentials,
    createdAt: new Date().toISOString(),
  });

  return { user: publicUser(user), token: createToken(user) };
}

export async function loginUser({ email, password, role }) {
  const user = findUserByEmail(email.trim().toLowerCase());
  if (!user || user.role !== role || !(await verifyPassword(password, user.passwordHash))) {
    const error = new Error('Invalid email, password, or account type');
    error.statusCode = 401;
    throw error;
  }

  return { user: publicUser(user), token: createToken(user) };
}
