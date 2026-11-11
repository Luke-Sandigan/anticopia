import { fail } from '../services/class.service.js';
import { identifier, listOptions, onlyFields } from './class.validator.js';
import { examInput } from './exam.validator.js';

const labels = { multiple_choice: 'Multiple choice', true_false: 'True/false', essay: 'Essay' };
export function questionType(value) {
  const canonical = Object.keys(labels).find((key) => key === value || labels[key] === value);
  if (!canonical) fail(400, 'type must be multiple_choice, true_false or essay');
  return canonical;
}
export function questionInput(body, existing) {
  onlyFields(body, ['text', 'type', 'topic', 'options', 'correctAnswer', 'points']);
  if (!Object.keys(body).length) fail(400, 'At least one question field is required');
  const values = { ...existing, ...body };
  const type = questionType(values.type);
  if (values.options !== undefined && !Array.isArray(values.options)) fail(400, 'options must be an array');
  if (type !== 'multiple_choice' && values.options?.length) fail(400, 'Only multiple choice questions have options');
  let answer = values.correctAnswer;
  if (type === 'true_false' && typeof answer === 'boolean') answer = answer ? 'True' : 'False';
  const snapshot = { id: 'validation', type: labels[type], question: values.text, points: values.points,
    ...(values.topic !== undefined ? { topic: values.topic } : {}),
    ...(values.options !== undefined ? { choices: values.options } : {}),
    ...(answer !== undefined ? { correctAnswer: answer } : {}) };
  const normalized = examInput({ questions: [snapshot] }).questions[0];
  return { text: normalized.question, type, topic: normalized.topic, options: type === 'multiple_choice' ? normalized.choices : [],
    correctAnswer: normalized.correctAnswer, points: normalized.points };
}
export function questionListOptions(query) {
  const { type, ...base } = query;
  return { ...listOptions(base), ...(type !== undefined ? { type: questionType(type) } : {}) };
}
export function questionIds(body) {
  onlyFields(body, ['questionIds']);
  if (!Array.isArray(body.questionIds) || !body.questionIds.length || body.questionIds.length > 500) fail(400, 'questionIds must contain 1–500 IDs');
  const ids = body.questionIds.map((id) => identifier(id, 'questionId'));
  if (new Set(ids).size !== ids.length) fail(400, 'questionIds must be unique');
  return ids;
}
export function questionSnapshot(item) {
  return { id: item.questionId, topic: item.topic, type: labels[item.type], question: item.text, points: item.points,
    ...(item.type === 'multiple_choice' ? { choices: item.options } : {}),
    ...(item.correctAnswer !== undefined ? { correctAnswer: item.correctAnswer } : {}) };
}
