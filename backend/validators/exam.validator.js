import { fail } from '../services/class.service.js';
import { identifier, listOptions, onlyFields } from './class.validator.js';

const fields = ['title', 'description', 'instructions', 'duration', 'passingScore',
  'availableFrom', 'availableUntil', 'detectTabSwitches', 'detectMultiDevice', 'captureScreenshots', 'questions'];
const questionTypes = ['Multiple choice', 'True/false', 'Short answer', 'Essay'];
function text(value, field, max, required = false) {
  if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim())) fail(400, `Invalid ${field}`);
  return value.trim();
}
function timestamp(value, field) {
  if (value === null) return null;
  const match = typeof value === 'string' && /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match) fail(400, `${field} must be an ISO timestamp with timezone`);
  const [, year, month, day, hour, minute, second = '0', , zone] = match;
  const days = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();
  if (+month < 1 || +month > 12 || +day < 1 || +day > days || +hour > 23 || +minute > 59 || +second > 59
    || (zone !== 'Z' && (+zone.slice(1, 3) > 23 || +zone.slice(4) > 59))) fail(400, `Invalid ${field}`);
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) fail(400, `Invalid ${field}`);
  return date;
}
function questions(value) {
  if (!Array.isArray(value) || value.length > 500) fail(400, 'questions must be an array with at most 500 entries');
  const ids = new Set();
  return value.map((item) => {
    onlyFields(item, ['id', 'topic', 'type', 'question', 'points', 'choices', 'correctAnswer']);
    const id = identifier(item.id, 'question id');
    if (ids.has(id)) fail(400, 'Duplicate question id');
    ids.add(id);
    if (!questionTypes.includes(item.type)) fail(400, 'Invalid question type');
    if (typeof item.points !== 'number' || !Number.isFinite(item.points) || item.points <= 0 || item.points > 10000) fail(400, 'Invalid question points');
    const result = { id, type: item.type, points: item.points, question: text(item.question, 'question', 10000, true),
      topic: item.topic === undefined ? '' : text(item.topic, 'topic', 200) };
    if (item.choices !== undefined) {
      if (!Array.isArray(item.choices) || item.choices.length > 20) fail(400, 'Invalid question choices');
      result.choices = item.choices.map((choice) => text(choice, 'choice', 2000, true));
      if (new Set(result.choices).size !== result.choices.length) fail(400, 'Duplicate question choice');
    }
    if (item.correctAnswer !== undefined) result.correctAnswer = text(item.correctAnswer, 'correctAnswer', 10000, true);
    if (item.type !== 'Essay' && !result.correctAnswer) fail(400, 'Objective questions require correctAnswer');
    if (item.type === 'Multiple choice' && (!result.choices || result.choices.length < 2 || !result.choices.includes(result.correctAnswer))) fail(400, 'Multiple choice questions require choices including the correct answer');
    if (item.type === 'True/false' && !['True', 'False'].includes(result.correctAnswer)) fail(400, 'True/false answer must be True or False');
    return result;
  });
}
export function examInput(body, create = false) {
  onlyFields(body, fields);
  if (!create && !Object.keys(body).length) fail(400, 'At least one exam field is required');
  if (create && body.title === undefined) fail(400, 'title is required');
  const result = {};
  for (const [field, value] of Object.entries(body)) {
    if (['title', 'description', 'instructions'].includes(field)) result[field === 'title' ? 'name' : field] = text(value, field, field === 'title' ? 200 : 10000, field === 'title');
    else if (field === 'duration') {
      if (!Number.isInteger(value) || value < 1 || value > 1440) fail(400, 'duration must be 1–1440 minutes');
      result.duration = value;
    } else if (field === 'passingScore') {
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) fail(400, 'passingScore must be 0–100');
      result.passingScore = value;
    } else if (['availableFrom', 'availableUntil'].includes(field)) result[field === 'availableFrom' ? 'startsAt' : 'endsAt'] = timestamp(value, field);
    else if (field === 'questions') result.questions = questions(value);
    else {
      if (typeof value !== 'boolean') fail(400, `Invalid ${field}`);
      result[field] = value;
    }
  }
  return result;
}
export function validSchedule(exam, required = false) {
  const start = exam.startsAt, end = exam.endsAt;
  if (!start && !end && !required) return;
  if (!start || !end || end <= start) fail(400, 'Schedule requires an end after the start');
  if (exam.duration * 60000 > end - start) fail(400, 'duration must fit inside the schedule window');
}
export function examListOptions(query) {
  const { status, classId, includeArchived, ...base } = query;
  const result = listOptions(base);
  if (status !== undefined && !['draft', 'scheduled', 'ongoing', 'past'].includes(status)) fail(400, 'Invalid exam status');
  if (classId !== undefined) identifier(classId, 'classId');
  if (includeArchived !== undefined && !['true', 'false'].includes(includeArchived)) fail(400, 'Invalid includeArchived');
  return { ...result, status, classId, includeArchived: includeArchived === 'true' };
}
