
import { Router } from 'express';
import { authenticate } from '../services/auth.service.js';

import * as controller from '../controllers/attempt.controller.js';
import { getConfirmation } from '../controllers/confirmation.controller.js';

const router = Router();

router.use(authenticate);

// BE-17: Get attempt details
router.get('/:attemptId', controller.getAttempt);

// BE-17: Autosave an answer
router.put(
  '/:attemptId/answers/:questionId',
  controller.saveAnswer
);

// BE-17: Submit an attempt
router.post(
  '/:attemptId/submit',
  controller.submitAttempt
);

// BE-18: Submission confirmation
router.get(
  '/:attemptId/confirmation',
  getConfirmation
);

export default router;
