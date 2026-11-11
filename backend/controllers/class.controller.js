import { Class } from '../models/class.model.js';
import * as service from '../services/class.service.js';
import { identifier, classUpdate, textBody, listOptions } from '../validators/class.validator.js';

async function access(request, write = false) {
  identifier(request.params.classId, 'classId');
  return service.accessibleClass(request.params.classId, request.user, write);
}
export async function getClasses(request, response) {
  const result = await service.getClasses(request.user, listOptions(request.query, ['includeArchived']));
  return response.json({ classes: result.items, pagination: result.pagination });
}
export async function getClass(request, response) {
  const item = await access(request);
  return response.json({ class: await service.getClassDetails(item, request.user) });
}
export async function updateClass(request, response) {
  await access(request, true);
  const update = classUpdate(request.body);
  const item = await Class.findOneAndUpdate({ classId: request.params.classId, status: { $ne: 'archived' } }, { $set: update }, { new: true, runValidators: true }).lean();
  if (!item) service.fail(409, 'Class is archived or changed; retry');
  return response.json({ class: await service.getClassDetails(item, request.user) });
}
export async function archiveClass(request, response) {
  await access(request, true);
  await Class.updateOne({ classId: request.params.classId }, { $set: { status: 'archived', archivedAt: new Date() } });
  return response.status(204).end();
}
export async function getClassRoster(request, response) {
  service.teacherOnly(request.user);
  await access(request);
  const result = await service.getRoster(request.params.classId, listOptions(request.query));
  return response.json({ roster: result.items, pagination: result.pagination });
}
export async function addStudent(request, response) {
  await access(request, true);
  const value = textBody(request.body, 'identifier', 254);
  return response.status(201).json({ student: await service.addStudentToRoster(request.params.classId, value) });
}
export async function removeStudent(request, response) {
  await access(request, true);
  identifier(request.params.studentId, 'studentId');
  await service.removeStudentFromRoster(request.params.classId, request.params.studentId);
  return response.status(204).end();
}
export async function regenerateCode(request, response) {
  await access(request, true);
  return response.json({ joinCode: await service.regenerateJoinCode(request.params.classId) });
}
export async function joinClass(request, response) {
  const code = textBody(request.body, 'joinCode', 12).toUpperCase();
  if (!/^[A-F0-9]{12}$/.test(code)) service.fail(400, 'Invalid joinCode');
  return response.status(201).json(await service.joinClass(code, request.user));
}
export async function getExams(request, response) {
  await access(request);
  const result = await service.getExams(request.params.classId, request.user, listOptions(request.query, ['status']));
  return response.json({ exams: result.items, pagination: result.pagination });
}
export async function getSummary(request, response) {
  await access(request);
  return response.json({ summary: await service.getSummary(request.params.classId, request.user) });
}
