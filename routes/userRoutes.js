import express from 'express';
import authenticateToken from '../middleware/authenticateToken.js';

const router = express.Router();

// Add any user-specific routes here
router.get('/profile', authenticateToken, (req, res) => {
    // Example route to get user profile
    res.json({ 
        message: 'User profile route',
        userId: req.user._id 
    });
});

export default router;