import * as service from '../services/dashboard.service.js';
import { identifier } from '../validators/class.validator.js';

export async function getTeacherDashboard(request, response) {
  response.set('Cache-Control', 'private, no-store');
  return response.json(await service.getTeacherDashboard(request.user));
}

export async function getExamAlerts(request, response) {
  const examId = identifier(request.params.examId, 'examId');
  const studentId = request.query.studentId === undefined ? undefined : identifier(request.query.studentId, 'studentId');
  response.set('Cache-Control', 'private, no-store');
  return response.json(await service.getExamAlerts(examId, request.user, studentId));
}
