import { Router } from 'express';
import { authenticate } from '../services/auth.service.js';
import { getGrades, getExamHistory } from '../controllers/student.controller.js';

const router = Router();

router.use(authenticate);

router.get('/grades', getGrades);

router.get('/exam-history', getExamHistory);

export default router;
