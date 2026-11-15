import { Router } from 'express';
import { login, register } from '../controllers/auth.controller.js';
import { authenticate } from '../services/auth.service.js';
import { getProfile, patchProfile, postPassword } from '../controllers/profile.controller.js';
import { parsePhoto, uploadPhoto } from '../services/photo.service.js';

const router = Router();

router.post('/register/:role', register);
router.post('/login', login);
router.get('/me', authenticate, getProfile);
router.patch('/me', authenticate, patchProfile);
router.post('/me/password', authenticate, postPassword);
router.post('/me/photo', authenticate, parsePhoto, uploadPhoto);

export default router;
