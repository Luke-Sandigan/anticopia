import { Router } from 'express';
import { login, register } from '../controllers/auth.controller.js';

const router = Router();

router.post('/register/:role', register);
router.post('/login', login);

export default router;
