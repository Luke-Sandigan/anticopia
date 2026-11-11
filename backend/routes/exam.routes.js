import { Router } from 'express';
import { authenticate } from '../services/auth.service.js';
import * as controller from '../controllers/exam.controller.js';

const router = Router();
router.use(authenticate);
router.get('/', controller.listExams);
router.get('/:examId', controller.getExam);
router.patch('/:examId', controller.editExam);
router.post('/:examId/publish', controller.publishExam);
router.post('/:examId/schedule', controller.scheduleExam);
router.post('/:examId/unpublish', controller.unpublishExam);
router.post('/:examId/duplicate', controller.duplicateExam);
router.delete('/:examId', controller.archiveExam);
export default router;
