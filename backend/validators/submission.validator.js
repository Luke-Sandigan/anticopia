import { fail } from '../services/class.service.js';
import { identifier, listOptions, onlyFields } from './class.validator.js';

export function submissionListOptions(query) {
  const { status, ...base } = query;
  const options = listOptions(base);
  if (status !== undefined && !['needs_grading', 'graded'].includes(status)) {
    fail(400, 'status must be needs_grading or graded');
  }
  return { ...options, status };
}

export function answerId(value) {
  return identifier(value, 'answerId');
}

export function answerGrade(body, maximumScore) {
  onlyFields(body, ['score', 'feedback']);
  if (!Object.keys(body).length) fail(400, 'At least one grading field is required');

  const result = {};
  if (body.score !== undefined) {
    if (typeof body.score !== 'number' || !Number.isFinite(body.score) || body.score < 0 || body.score > maximumScore) {
      fail(400, `score must be between 0 and ${maximumScore}`);
    }
    result.score = body.score;
  }
  if (body.feedback !== undefined) {
    if (typeof body.feedback !== 'string' || body.feedback.length > 10000) fail(400, 'Invalid feedback');
    result.feedback = body.feedback.trim();
  }
  return result;
}
