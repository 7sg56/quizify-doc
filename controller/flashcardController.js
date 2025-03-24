import { GoogleGenerativeAI } from '@google/generative-ai';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';

// PDF Text Extraction Function
export async function extractTextFromPDF(buffer) {
    try {
        const data = await pdfParse(buffer);
        return data.text;
    } catch (error) {
        console.error('Error extracting text from PDF:', error.stack || error);
        throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
}

// Fallback Flashcards Function
export function createFallbackFlashcards() {
    return [
        { question: "Error generating flashcard 1", answer: "Please try uploading the PDF again or try a different document." },
        { question: "Error generating flashcard 2", answer: "The system encountered an issue processing your document." },
        { question: "Error generating flashcard 3", answer: "Check that your PDF contains text content that can be extracted." },
        { question: "Error generating flashcard 4", answer: "Make sure your PDF is not password protected or corrupted." },
        { question: "Error generating flashcard 5", answer: "If the problem persists, try a different PDF file with clearer content." }
    ];
}

// Flashcard Generation Function
export async function generateFlashcardsFromText(text) {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        const prompt = `Based on the following text, create exactly 5 flashcards. 
        Each flashcard should have a question and an answer about important concepts in the text.

        Return ONLY a JSON array of objects with 'question' and 'answer' properties.
        Example format:
        [
            { "question": "What is X?", "answer": "X is Y." },
            { "question": "What is Z?", "answer": "Z is a concept in..." },
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

        const response = result.response;
        const firstCandidate = response?.candidates?.[0];

        if (!firstCandidate || !firstCandidate.content || !firstCandidate.content.parts?.length) {
            console.error("AI response is empty or invalid.");
            return createFallbackFlashcards();
        }

        let flashcardsText = firstCandidate.content.parts[0].text.trim();
        flashcardsText = flashcardsText.replace(/```json\s*/g, '').replace(/```\s*$/g, ''); // Remove code block formatting

        try {
            const flashcards = JSON.parse(flashcardsText);

            const validFlashcards = flashcards
                .filter(card => card && typeof card === 'object' && card.question && card.answer)
                .map(card => ({
                    question: String(card.question).trim(),
                    answer: String(card.answer).trim()
                }))
                .slice(0, 5);

            return validFlashcards.length === 5 ? validFlashcards : createFallbackFlashcards();
        } catch (jsonError) {
            console.error("JSON parsing error:", jsonError.stack || jsonError);
            return createFallbackFlashcards();
        }
    } catch (error) {
        console.error('Error generating flashcards:', error.stack || error);
        return createFallbackFlashcards();
    }
}

// Flashcard Generation Handler
export async function generateFlashcards(req, res) {
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
                return res.json({
                    flashcards: createFallbackFlashcards(),
                    warning: "No text could be extracted from the PDF."
                });
            }

            const flashcards = await generateFlashcardsFromText(text);

            return res.json({ flashcards });
        } else {
            return res.status(400).json({
                error: 'Unsupported file type. Only PDF files are supported.',
                flashcards: createFallbackFlashcards()
            });
        }
    } catch (e) {
        console.error('Error processing file: ', e.stack || e);
        return res.status(500).json({
            error: 'Error processing file',
            details: e.message,
            flashcards: createFallbackFlashcards()
        });
    }
}
