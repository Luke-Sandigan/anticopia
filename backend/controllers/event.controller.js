
import {
  recordMultiDevice
} from '../services/attempt.service.js';

export async function createEvent(req, res) {
  if (
    !req.body ||
    req.body.type !== 'multi_device' ||
    typeof req.body.attemptId !== 'string' ||
    typeof req.body.sessionId !== 'string'
  ) {
    return res.status(400).json({
      error: 'Invalid event payload'
    });
  }

  const result = await recordMultiDevice(
    req.body.attemptId,
    req.user,
    req.body.sessionId
  );

  return res.status(201).json(result);
}
