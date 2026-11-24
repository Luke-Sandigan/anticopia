
import { Router } from 'express';
import { authenticate } from '../services/auth.service.js';
import * as controller from '../controllers/attempt.controller.js';

const router = Router();

router.use(authenticate);

router.get('/:attemptId', controller.getAttempt);

router.put(
  '/:attemptId/answers/:questionId',
  controller.saveAnswer
);

router.post(
  '/:attemptId/submit',
  controller.submitAttempt
);

export default router;
