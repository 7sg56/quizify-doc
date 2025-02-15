require('dotenv').config();
const express = require('express');
const multer = require('multer');
const pdf = require('pdf-parse');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const upload = multer();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
});

async function extractTextFromPDF(buffer){
    const data = await pdf(buffer);
    return data.text;
}

async function generateFlashcards(text){
    try{
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = `Create 5 flashcards from the following text. Return only a JSON array with objects containing 'question' and 'answer' properties. The response should be in this exact format: [{"question": " <no> <this is a question>", "answer": " <no> <this is answer>"}, ...]. Here's the text to process: ${text}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const flashcardsText = response.text();
        return JSON.parse(flashcardsText);
    }
    catch(error){
        console.error('Error generating flashcards:', error);
        throw error;
    }
}

app.post('/api/generate-flashcards', upload.single('file'), async (req, res) => {
    try{
        if(!req.file){
            return res.status(400).json({ error: 'No file uploaded' });
        }

        if (req.file.mimetype === 'application/pdf') {
            const text = await extractTextFromPDF(req.file.buffer);
            const flashcards = await generateFlashcards(text);
            res.json({flashcards});
        } else {
            return res.status(400).json({ error: 'Unsupported file type' });
        }
    } catch(e){
        console.error('Error processing file: ', e);
        res.status(500).json({ error: 'Error processing file' });
    }
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
});