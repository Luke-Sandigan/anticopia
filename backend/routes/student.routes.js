import { Router } from 'express';
import { authenticate } from '../services/auth.service.js';

import {
  getDashboard,
  getStudentClasses,
  getStudentClassDetails,
  leaveStudentClass
} from '../controllers/student.controller.js';

const router = Router();

router.use(authenticate);

// BE-14: Student Dashboard
router.get('/dashboard', getDashboard);

// BE-15: Student My Classes
router.get('/classes', getStudentClasses);
router.get('/classes/:classId', getStudentClassDetails);
router.post('/classes/:classId/leave', leaveStudentClass);

export default router;
