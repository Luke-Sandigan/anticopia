import { Router } from 'express';
import { authenticate } from '../services/auth.service.js';
import {
  getProfile,
  patchProfile,
  postPassword
} from '../controllers/profile.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', getProfile);
router.patch('/', patchProfile);
router.post('/change-password', postPassword);

export default router;
