import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import path from 'path';

// Import Configuration
import connectDB from './config/db.js';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';

// Import Flashcard Generation
import { generateFlashcards } from './controller/flashcardController.js'; // ✅ Fixed import path
import authenticateToken from './middleware/authenticateToken.js';

// Configure Environment
dotenv.config();

// Initialize Express
const app = express();
const upload = multer();

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// Flashcard Generation Route (Protected)
app.post('/api/generate-flashcards', authenticateToken, upload.single('file'), generateFlashcards);

// ✅ Serve Signup Page (if `signup.html` exists in `public`)
app.get('/signup', (req, res) => {
    res.sendFile(path.join(path.resolve(), 'public', 'signup.html'));
});

// ✅ Serve Login Page (if `login.html` exists in `public`)
app.get('/login', (req, res) => {
    res.sendFile(path.join(path.resolve(), 'public', 'login.html'));
});

// ✅ Serve React/SPA Frontend (Catch-All for Other Routes)
app.get('*', (req, res) => {
    res.sendFile(path.join(path.resolve(), 'public', 'index.html'));
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
});
