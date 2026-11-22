import { Router } from 'express';
import { authenticate } from '../services/auth.service.js';
import { getDashboard } from '../controllers/student.controller.js';

const router = Router();

router.use(authenticate);

router.get('/dashboard', getDashboard);

export default router;
