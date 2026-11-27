import { Router } from 'express';
import { authenticate } from '../services/auth.service.js';
import { getTeacherDashboard, getExamAlerts } from '../controllers/dashboard.controller.js';

const router = Router();

router.use(authenticate);
router.get('/', getTeacherDashboard);
router.get('/exams/:examId/alerts', getExamAlerts);

export default router;
