import { Router } from 'express';
import { addStudent, getClass, getClassRoster, removeStudent } from '../controllers/class.controller.js';

const router = Router();

router.get('/:classId', getClass);
router.get('/:classId/roster', getClassRoster);
router.post('/:classId/roster', addStudent);
router.delete('/:classId/roster/:studentId', removeStudent);

export default router;
