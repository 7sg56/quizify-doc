import express from 'express';
import { register, login, logout, getCurrentUser } from '../controller/authController.js';
import authenticateToken from '../middleware/authenticateToken.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticateToken, getCurrentUser);

export default router;