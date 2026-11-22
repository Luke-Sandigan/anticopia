
import { identifier } from '../validators/class.validator.js';
import * as service from '../services/submission.service.js';

export async function getAttemptResults(request, response) {
  const attemptId = identifier(
    request.params.attemptId,
    'attemptId'
  );

  const result = await service.getSubmission(
    attemptId,
    request.user
  );

  const submission = result.submission;

  return response.json({
    attemptId: submission.id,
    examId: submission.examId,
    status: submission.status,
    score: submission.percentage,
    totalScore: submission.totalScore,
    totalPoints: submission.totalPoints,
    passed: submission.percentage >= 60,
    released: submission.released,
    answers: submission.answers
  });
}
