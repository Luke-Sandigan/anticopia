import { randomUUID } from 'node:crypto';
import { Question } from '../models/question.model.js';
import { fail, paginated, searchFilter, teacherOnly } from './class.service.js';
import { editExam } from './exam.service.js';
import { questionInput, questionSnapshot } from '../validators/question.validator.js';

export function publicQuestion(item) {
  return { id: item.questionId, text: item.text, type: item.type, topic: item.topic,
    options: item.options, ...(item.correctAnswer !== undefined ? { correctAnswer: item.correctAnswer } : {}),
    points: item.points, createdAt: item.createdAt, updatedAt: item.updatedAt };
}
export async function accessQuestion(id, user) {
  teacherOnly(user);
  const item = await Question.findOne({ questionId: id, deletedAt: null }).lean();
  if (!item) fail(404, 'Question not found');
  if (item.teacherId !== user.id) fail(403, 'You do not own this question');
  return item;
}
export async function createQuestion(user, body) {
  teacherOnly(user);
  const item = await Question.create({ ...questionInput(body), questionId: randomUUID(), teacherId: user.id });
  return publicQuestion(item);
}
export async function listQuestions(user, options) {
  teacherOnly(user);
  return paginated(Question, { teacherId: user.id, deletedAt: null, ...(options.type ? { type: options.type } : {}),
    ...searchFilter(options.search, ['text', 'topic']) }, options, { createdAt: -1, questionId: 1 }, publicQuestion);
}
export async function updateQuestion(item, body) {
  const values = questionInput(body, item);
  const { correctAnswer, ...fields } = values;
  const updated = await Question.findOneAndUpdate({ questionId: item.questionId, deletedAt: null, revision: item.revision },
    { $set: { ...fields, ...(correctAnswer !== undefined ? { correctAnswer } : {}) },
      ...(correctAnswer === undefined ? { $unset: { correctAnswer: '' } } : {}), $inc: { revision: 1 } }, { new: true, runValidators: true }).lean();
  if (!updated) fail(409, 'Question changed or was deleted; reload before retrying');
  return publicQuestion(updated);
}
export async function deleteQuestion(item) {
  const result = await Question.updateOne({ questionId: item.questionId, deletedAt: null, revision: item.revision },
    { $set: { deletedAt: new Date() }, $inc: { revision: 1 } });
  if (!result.modifiedCount) fail(409, 'Question changed or was deleted; reload before retrying');
}
export async function addQuestions(context, user, ids) {
  const current = context.item.questions ?? [];
  if (current.length + ids.length > 500) fail(400, 'An exam can contain at most 500 questions');
  if (ids.some((id) => current.some((question) => question.id === id))) fail(409, 'Question is already attached to this exam');
  // Resolve and authorize the entire batch before changing the exam. Snapshots
  // preserve published content when bank entries are later edited or deleted.
  const found = await Question.find({ questionId: { $in: ids }, deletedAt: null }).lean();
  if (found.some((item) => item.teacherId !== user.id)) fail(403, 'You do not own this question');
  if (found.length !== ids.length) fail(404, 'Question not found');
  const byId = new Map(found.map((item) => [item.questionId, item]));
  return editExam(context, user, { questions: [...current, ...ids.map((id) => questionSnapshot(byId.get(id)))] });
}
export async function removeQuestion(context, user, id) {
  const current = context.item.questions ?? [];
  if (!current.some((item) => item.id === id)) fail(404, 'Question is not attached to this exam');
  return editExam(context, user, { questions: current.filter((item) => item.id !== id) });
}
export async function reorderQuestions(context, user, ids) {
  const current = context.item.questions ?? [];
  const byId = new Map(current.map((item) => [item.id, item]));
  if (ids.length !== current.length || ids.some((id) => !byId.has(id))) fail(400, 'questionIds must contain every attached question exactly once');
  return editExam(context, user, { questions: ids.map((id) => byId.get(id)) });
}
