import * as service from '../services/exam.service.js';
import { examInput, examListOptions } from '../validators/exam.validator.js';
import { identifier, onlyFields } from '../validators/class.validator.js';
import { teacherOnly } from '../services/class.service.js';

function emptyBody(request) {
  if (request.body !== undefined) onlyFields(request.body, []);
}
async function access(request, write = false, allowArchived = false) {
  if (write) teacherOnly(request.user);
  return service.accessExam(identifier(request.params.examId, 'examId'), request.user, write, allowArchived);
}
export async function createExam(request, response) {
  teacherOnly(request.user);
  const classId = identifier(request.params.classId, 'classId');
  const exam = await service.createExam(classId, request.user, examInput(request.body, true));
  return response.status(201).json({ exam });
}
export async function listExams(request, response) {
  const result = await service.listExams(request.user, examListOptions(request.query));
  return response.json({ exams: result.items, pagination: result.pagination });
}
export async function getExam(request, response) {
  const context = await access(request);
  return response.json({ exam: service.publicExam(context.item, context.classItem, request.user) });
}
export async function editExam(request, response) {
  const context = await access(request, true);
  return response.json({ exam: await service.editExam(context, request.user, examInput(request.body)) });
}
export async function publishExam(request, response) {
  const context = await access(request, true);
  emptyBody(request);
  return response.json({ exam: await service.publishExam(context, request.user) });
}
export async function scheduleExam(request, response) {
  const context = await access(request, true);
  onlyFields(request.body, ['availableFrom', 'availableUntil']);
  const schedule = examInput(request.body);
  // Both endpoints are required here; a draft's saved schedule is not implicit.
  if (!schedule.startsAt || !schedule.endsAt) {
    const error = new Error('availableFrom and availableUntil are required');
    error.statusCode = 400;
    throw error;
  }
  return response.json({ exam: await service.publishExam(context, request.user, schedule) });
}
export async function unpublishExam(request, response) {
  const context = await access(request, true);
  emptyBody(request);
  return response.json({ exam: await service.unpublishExam(context, request.user) });
}
export async function duplicateExam(request, response) {
  const context = await access(request, true, true);
  emptyBody(request);
  return response.status(201).json({ exam: await service.duplicateExam(context, request.user) });
}
export async function archiveExam(request, response) {
  const context = await access(request, true);
  emptyBody(request);
  await service.archiveExam(context);
  return response.status(204).end();
}
