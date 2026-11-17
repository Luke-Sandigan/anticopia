import { fail } from '../services/class.service.js';

export function identifier(value, field) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_.-]{0,99}$/.test(value)) fail(400, `Invalid ${field}`);
  return value;
}
export function bodyObject(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail(400, 'A JSON object is required');
  return body;
}
export function onlyFields(body, fields) {
  bodyObject(body);
  if (Object.keys(body).some((key) => !fields.includes(key))) fail(400, 'Unknown request field');
}
export function textBody(body, field, max) {
  onlyFields(body, [field]);
  if (typeof body[field] !== 'string' || !body[field].trim() || body[field].trim().length > max) fail(400, `Invalid ${field}`);
  return body[field].trim();
}
export function classCreate(body) {
  const limits = { name: 200, section: 100, subject: 200, term: 100, schedule: 500, description: 5000 };
  onlyFields(body, Object.keys(limits));
  const required = ['name', 'section', 'subject', 'term'];
  if (required.some((field) => typeof body[field] !== 'string' || !body[field].trim())) {
    fail(400, 'name, section, subject and term are required');
  }
  const result = {};
  for (const [field, value] of Object.entries(body)) {
    if (typeof value !== 'string' || value.trim().length > limits[field]
      || (!['schedule', 'description'].includes(field) && !value.trim())) fail(400, `Invalid ${field}`);
    result[field] = value.trim();
  }
  return result;
}
export function classUpdate(body) {
  const limits = { name: 200, code: 100, section: 100, subject: 200, term: 100, schedule: 500, description: 5000 };
  onlyFields(body, Object.keys(limits));
  if (!Object.keys(body).length) fail(400, 'At least one class field is required');
  const result = {};
  for (const [field, value] of Object.entries(body)) {
    if (typeof value !== 'string' || value.trim().length > limits[field] || (!['schedule', 'description'].includes(field) && !value.trim())) fail(400, `Invalid ${field}`);
    result[field] = value.trim();
  }
  return result;
}
function parseCsvRecords(text) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') { value += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else value += character;
    } else if (character === '"' && value.length === 0) quoted = true;
    else if (character === ',') { row.push(value.trim()); value = ''; }
    else if (character === '\n' || character === '\r') {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);
      row = []; value = '';
    } else value += character;
  }
  if (quoted) fail(400, 'CSV contains an unclosed quoted field');
  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}
export function rosterCsv(body) {
  if (typeof body !== 'string' || !body.trim()) fail(400, 'A non-empty CSV file is required');
  const rows = parseCsvRecords(body.replace(/^\uFEFF/, ''));
  if (rows.length < 2) fail(400, 'CSV must contain a header and at least one student');
  const headers = rows[0].map((header) => header.trim().toLowerCase().replace(/[\s_-]/g, ''));
  const identifierIndex = headers.indexOf('identifier');
  const emailIndex = headers.indexOf('email');
  const studentIdIndex = headers.indexOf('studentid');
  if (identifierIndex < 0 && emailIndex < 0 && studentIdIndex < 0) {
    fail(400, 'CSV needs an identifier, email, or studentId column');
  }
  const identifiers = rows.slice(1).map((row, rowIndex) => {
    const value = row[identifierIndex] || row[emailIndex] || row[studentIdIndex];
    if (!value) fail(400, `CSV row ${rowIndex + 2} has no student identifier`);
    return value.trim();
  });
  if (identifiers.length > 500) fail(400, 'CSV may contain at most 500 students');
  const keys = identifiers.map((value) => value.toLowerCase());
  if (new Set(keys).size !== keys.length) fail(400, 'CSV contains duplicate student identifiers');
  return identifiers;
}
export function listOptions(query, extras = []) {
  if (Object.keys(query).some((key) => !['page', 'limit', 'search', ...extras].includes(key))) fail(400, 'Unknown query parameter');
  const result = { page: 1, limit: 20, search: '' };
  for (const key of ['page', 'limit']) {
    if (query[key] !== undefined) {
      if (typeof query[key] !== 'string' || !/^[1-9]\d*$/.test(query[key])) fail(400, `Invalid ${key}`);
      result[key] = Number(query[key]);
      if (!Number.isSafeInteger(result[key]) || result[key] > (key === 'limit' ? 100 : 1000000)) fail(400, `Invalid ${key}`);
    }
  }
  if (query.search !== undefined) {
    if (typeof query.search !== 'string' || query.search.length > 100) fail(400, 'Invalid search');
    result.search = query.search.trim();
  }
  if (query.status !== undefined && !['upcoming', 'ongoing', 'past'].includes(query.status)) fail(400, 'Invalid exam status');
  if (query.includeArchived !== undefined && !['true', 'false'].includes(query.includeArchived)) fail(400, 'Invalid includeArchived');
  return { ...result, status: query.status, includeArchived: query.includeArchived === 'true' };
}
