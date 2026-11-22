import { Router } from 'express';
import { authenticate } from '../services/auth.service.js';
import { getAttemptResults } from '../controllers/attempt.controller.js';

const router = Router();

router.use(authenticate);

router.get('/:attemptId/results', getAttemptResults);

export default router;
