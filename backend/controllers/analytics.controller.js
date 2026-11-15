import { identifier } from '../validators/class.validator.js';
import * as service from '../services/analytics.service.js';

export async function getExamAnalytics(request, response) {
  const examId = identifier(request.params.examId, 'examId');
  return response.json(await service.getExamAnalytics(examId, request.user));
}

export async function getClassAnalytics(request, response) {
  const classId = identifier(request.params.classId, 'classId');
  return response.json(await service.getClassAnalytics(classId, request.user));
}

export async function getIntegrityReport(request, response) {
  const examId = identifier(request.params.examId, 'examId');
  return response.json(await service.getIntegrityReport(examId, request.user));
}
