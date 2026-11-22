import { Router } from 'express';
import { authenticate } from '../services/auth.service.js';
import { getGrades } from '../controllers/student.controller.js';

const router = Router();

router.use(authenticate);

router.get('/grades', getGrades);

export default router;
