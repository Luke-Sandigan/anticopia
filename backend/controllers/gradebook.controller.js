import { identifier } from '../validators/class.validator.js';
import { gradeOverride } from '../validators/gradebook.validator.js';
import * as service from '../services/gradebook.service.js';

export async function getGradebook(request, response) {
  return response.json(await service.getGradebook(identifier(request.params.classId, 'classId'), request.user));
}

export async function exportGradebook(request, response) {
  const gradebook = await service.getGradebook(identifier(request.params.classId, 'classId'), request.user);
  const filename = `gradebook-${gradebook.class.id}.csv`;
  response.set('Content-Type', 'text/csv; charset=utf-8');
  response.set('Content-Disposition', `attachment; filename="${filename}"`);
  return response.send(service.gradebookCsv(gradebook));
}

export async function updateGrade(request, response) {
  return response.json({ grade: await service.overrideGrade(identifier(request.params.gradeId, 'gradeId'), request.user, gradeOverride(request.body)) });
}
