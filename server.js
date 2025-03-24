import dotenv from 'dotenv';
import express from 'express';
import multer from 'multer';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';

dotenv.config();

const app = express();
const upload = multer();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(path.resolve(), 'public', 'index.html'));
});

async function extractTextFromPDF(buffer) {
    try {
        const data = await pdfParse(buffer);
        return data.text;
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
}

async function generateFlashcardsFromText(text) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        
        const prompt = `Based on the following text, create exactly 5 flashcards. 
        Each flashcard should have a question and an answer about important concepts in the text.

        Return ONLY a JSON array of objects with 'question' and 'answer' properties.
        Example format:
        [
        {
            "question": "What is X?",
            "answer": "X is Y."
        },
        ...more cards...
        ]

        Text content:
        ${text}`;

        
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 2048
            }
        });

        const response = await result.response;
        let flashcardsText = response.text();
        
        flashcardsText = flashcardsText.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
        flashcardsText = flashcardsText.trim();
        
        console.log("Raw response from Gemini:", flashcardsText);
        
        if (!flashcardsText.startsWith('[') || !flashcardsText.endsWith(']')) {
            console.warn("Invalid JSON format received, using fallback flashcards");
            return createFallbackFlashcards();
        }
        
        try {
            const flashcards = JSON.parse(flashcardsText);
            
            if (!Array.isArray(flashcards) || flashcards.length === 0) {
                console.warn("Response is not a valid array, using fallback flashcards");
                return createFallbackFlashcards();
            }
            
            const validFlashcards = flashcards
                .filter(card => card && typeof card === 'object' && card.question && card.answer)
                .map(card => ({
                    question: String(card.question).trim(),
                    answer: String(card.answer).trim()
                }))
                .slice(0, 5);
            
            if (validFlashcards.length < 5) {
                console.warn(`Only ${validFlashcards.length} valid flashcards found, padding with fallbacks`);
                const fallbacks = createFallbackFlashcards().slice(validFlashcards.length);
                return [...validFlashcards, ...fallbacks];
            }
            
            return validFlashcards;
        } catch (jsonError) {
            console.error("JSON parsing error:", jsonError);
            return createFallbackFlashcards();
        }
    } catch (error) {
        console.error('Error generating flashcards:', error);
        return createFallbackFlashcards();
    }
}

function createFallbackFlashcards() {
    return [
        {
            question: "Error generating flashcard 1",
            answer: "Please try uploading the PDF again or try a different document."
        },
        {
            question: "Error generating flashcard 2",
            answer: "The system encountered an issue processing your document."
        },
        {
            question: "Error generating flashcard 3",
            answer: "Check that your PDF contains text content that can be extracted."
        },
        {
            question: "Error generating flashcard 4",
            answer: "Make sure your PDF is not password protected or corrupted."
        },
        {
            question: "Error generating flashcard 5",
            answer: "If the problem persists, try a different PDF file with clearer content."
        }
    ];
}

app.post('/api/generate-flashcards', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                error: 'No file uploaded',
                flashcards: createFallbackFlashcards()
            });
        }

        if (req.file.mimetype === 'application/pdf') {
            const text = await extractTextFromPDF(req.file.buffer);
            
            if (!text || text.trim().length === 0) {
                console.warn("No text extracted from PDF");
                return res.json({ 
                    flashcards: createFallbackFlashcards(),
                    warning: "No text could be extracted from the PDF"
                });
            }
            
            console.log(`Extracted ${text.length} characters from PDF`);
            
            const flashcards = await generateFlashcardsFromText(text);
            
            console.log("Final flashcards being sent to frontend:", JSON.stringify(flashcards, null, 2));
            return res.json({ flashcards });
        } else {
            return res.status(400).json({ 
                error: 'Unsupported file type. Only PDF files are supported.',
                flashcards: createFallbackFlashcards()
            });
        }
    } catch (e) {
        console.error('Error processing file: ', e);
        return res.status(500).json({ 
            error: 'Error processing file', 
            details: e.message,
            flashcards: createFallbackFlashcards()
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
});