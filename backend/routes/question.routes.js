import { Router } from 'express';
import { authenticate } from '../services/auth.service.js';
import * as controller from '../controllers/question.controller.js';

const router = Router();
router.use(authenticate);
router.post('/', controller.createQuestion);
router.get('/', controller.listQuestions);
router.patch('/:id', controller.updateQuestion);
router.delete('/:id', controller.deleteQuestion);
export default router;
