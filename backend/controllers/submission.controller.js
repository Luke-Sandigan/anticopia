import { identifier, onlyFields } from '../validators/class.validator.js';
import { answerGrade, answerId, submissionListOptions } from '../validators/submission.validator.js';
import * as service from '../services/submission.service.js';

export async function getExamSubmissions(request, response) {
  const examId = identifier(request.params.examId, 'examId');
  return response.json(await service.listSubmissions(examId, request.user, submissionListOptions(request.query)));
}

export async function getSubmission(request, response) {
  return response.json(await service.getSubmission(identifier(request.params.id, 'submissionId'), request.user));
}

export async function gradeAnswer(request, response) {
  const submissionId = identifier(request.params.id, 'submissionId');
  const submission = await service.getSubmission(submissionId, request.user);
  const answer = submission.submission.answers.find((item) => item.id === answerId(request.params.answerId));
  if (!answer?.question) {
    const error = new Error('Answer not found');
    error.statusCode = 404;
    throw error;
  }
  return response.json(await service.gradeSubmissionAnswer(submissionId, answer.id, request.user, answerGrade(request.body, answer.question.points)));
}

export async function finalizeSubmission(request, response) {
  if (request.body !== undefined) onlyFields(request.body, []);
  return response.json(await service.finalizeSubmission(identifier(request.params.id, 'submissionId'), request.user));
}

export async function releaseResults(request, response) {
  if (request.body !== undefined) onlyFields(request.body, []);
  return response.json(await service.releaseExamResults(identifier(request.params.examId, 'examId'), request.user));
}
