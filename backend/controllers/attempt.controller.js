
import * as service from '../services/attempt.service.js';

export async function startAttempt(req, res) {
  const result = await service.startAttempt(
    req.params.examId,
    req.user
  );

  return res.status(201).json(result);
}

export async function getAttempt(req, res) {
  const result = await service.getAttempt(
    req.params.attemptId,
    req.user,
    req.get('X-Attempt-Session')
  );

  return res.json(result);
}

export async function saveAnswer(req, res) {
  const result = await service.saveAnswer(
    req.params.attemptId,
    req.params.questionId,
    req.user,
    req.body
  );

  return res.json(result);
}

export async function submitAttempt(req, res) {
  const result = await service.submitAttempt(
    req.params.attemptId,
    req.user
  );

  return res.json(result);
}
