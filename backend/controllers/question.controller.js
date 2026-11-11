import * as service from '../services/question.service.js';
import { accessExam } from '../services/exam.service.js';
import { teacherOnly } from '../services/class.service.js';
import { identifier } from '../validators/class.validator.js';
import { questionIds, questionListOptions } from '../validators/question.validator.js';

export async function createQuestion(request, response) {
  return response.status(201).json({ question: await service.createQuestion(request.user, request.body) });
}
export async function listQuestions(request, response) {
  teacherOnly(request.user);
  const result = await service.listQuestions(request.user, questionListOptions(request.query));
  return response.json({ questions: result.items, pagination: result.pagination });
}
export async function updateQuestion(request, response) {
  teacherOnly(request.user);
  const item = await service.accessQuestion(identifier(request.params.id, 'questionId'), request.user);
  return response.json({ question: await service.updateQuestion(item, request.body) });
}
export async function deleteQuestion(request, response) {
  teacherOnly(request.user);
  const item = await service.accessQuestion(identifier(request.params.id, 'questionId'), request.user);
  await service.deleteQuestion(item);
  return response.status(204).end();
}
async function examContext(request) {
  teacherOnly(request.user);
  return accessExam(identifier(request.params.examId, 'examId'), request.user, true);
}
export async function addQuestions(request, response) {
  const context = await examContext(request);
  return response.json({ exam: await service.addQuestions(context, request.user, questionIds(request.body)) });
}
export async function removeQuestion(request, response) {
  const context = await examContext(request);
  return response.json({ exam: await service.removeQuestion(context, request.user, identifier(request.params.questionId, 'questionId')) });
}
export async function reorderQuestions(request, response) {
  const context = await examContext(request);
  return response.json({ exam: await service.reorderQuestions(context, request.user, questionIds(request.body)) });
}
