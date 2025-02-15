const dropFile = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const loading = document.getElementById('loading');
const progressBar = document.querySelector('.progress-bar');
const carousel = document.getElementById('flashcard-carousel');

let currentFlashcards = [];

dropFile.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropFile.classList.add('dragover');
});

dropFile.addEventListener('dragleave', () => {
    dropFile.classList.remove('dragover');
});

dropFile.addEventListener('drop', (e) => {
    e.preventDefault();
    dropFile.classList.remove('dragover');
    uploadFile(e.dataTransfer.files[0]);
});

dropFile.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    uploadFile(file);
});

async function uploadFile(file) {
    if (!(file && file.type === 'application/pdf')) {
        alert('Please upload a PDF file');
        return;
    }
    
    dropFile.style.display = 'none';
    loading.style.display = 'block';

    const formData = new FormData();
    formData.append('file', file);

    try {
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 5;
            if (progress > 90) clearInterval(progressInterval);
            progressBar.style.width = `${progress}%`;
        }, 200);

        const response = await fetch('/api/generate-flashcards', {
            method: 'POST',
            body: formData
        });

        clearInterval(progressInterval);
        progressBar.style.width = '100%';

        const data = await response.json();
        currentFlashcards = data.flashcards;
        
        setTimeout(() => {
            loading.style.display = 'none';
            carousel.style.display = 'block';
            displayFlashcards();
        }, 500);
    } catch (e) {
        console.error('Error uploading file:', e);
        alert('Error uploading file');
        loading.style.display = 'none';
        dropFile.style.display = 'block';
        progressBar.style.width = '0%';
    }
}

function displayFlashcards() {
    currentFlashcards.forEach((card, index) => {
        const questionEl = document.getElementById(`question-${index + 1}`);
        const answerEl = document.getElementById(`answer-${index + 1}`);
        
        if (questionEl && answerEl) {
            questionEl.textContent = card.question;
            answerEl.textContent = card.answer;
        }
    });
}