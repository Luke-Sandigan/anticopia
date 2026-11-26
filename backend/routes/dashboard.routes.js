import { Router } from 'express';
import { authenticate } from '../services/auth.service.js';
import { getTeacherDashboard } from '../controllers/dashboard.controller.js';

const router = Router();

router.use(authenticate);
router.get('/', getTeacherDashboard);

export default router;
