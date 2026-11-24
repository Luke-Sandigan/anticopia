
import { Router } from 'express';
import { authenticate } from '../services/auth.service.js';
import { createEvent } from '../controllers/event.controller.js';

const router = Router();

router.use(authenticate);

router.post('/', createEvent);

export default router;
