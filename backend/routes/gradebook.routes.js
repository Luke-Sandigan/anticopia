import { Router } from 'express';
import { authenticate } from '../services/auth.service.js';
import { updateGrade } from '../controllers/gradebook.controller.js';

const router = Router();
router.use(authenticate);
router.patch('/:gradeId', updateGrade);

export default router;
