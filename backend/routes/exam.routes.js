import { Router } from 'express';
import { authenticate } from '../services/auth.service.js';
import * as controller from '../controllers/exam.controller.js';
import * as questions from '../controllers/question.controller.js';

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
router.post('/:examId/questions', questions.addQuestions);
router.delete('/:examId/questions/:questionId', questions.removeQuestion);
router.patch('/:examId/questions/order', questions.reorderQuestions);
export default router;
