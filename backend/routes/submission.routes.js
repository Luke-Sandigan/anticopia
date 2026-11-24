import { Router } from 'express';
import { authenticate } from '../services/auth.service.js';
import * as controller from '../controllers/submission.controller.js';

const router = Router();
router.use(authenticate);
router.get('/:id', controller.getSubmission);
router.patch('/:id/answers/:answerId', controller.gradeAnswer);
router.post('/:id/finalize', controller.finalizeSubmission);

export default router;
