const dropFile = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const loading = document.getElementById('loading');
const progressBar = document.querySelector('.progress-bar');
const flashcardsContainer = document.getElementById('flashcards-container');
const newDocumentBtn = document.getElementById('new-document');
const prevCardBtn = document.getElementById('prev-card');
const nextCardBtn = document.getElementById('next-card');
const cardCounter = document.getElementById('card-counter');

const flashcards = document.querySelectorAll('.flashcard');
const revealButtons = document.querySelectorAll('.btn-reveal');
let currentFlashcards = [];
let currentCardIndex = 0;

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

newDocumentBtn.addEventListener('click', () => {
    flashcardsContainer.style.display = 'none';
    dropFile.style.display = 'block';
    fileInput.value = '';
});

prevCardBtn.addEventListener('click', () => {
    navigateCards('prev');
});

nextCardBtn.addEventListener('click', () => {
    navigateCards('next');
});

revealButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
        const flashcard = document.getElementById(`flashcard-${index + 1}`);
        flashcard.classList.toggle('revealed');
        
        if (flashcard.classList.contains('revealed')) {
            button.textContent = 'Hide Answer';
        } else {
            button.textContent = 'Reveal Answer';
        }
    });
});

async function uploadFile(file) {
    if (!(file && file.type === 'application/pdf')) {
        showNotification('Please upload a PDF file', 'error');
        return;
    }
    
    dropFile.style.display = 'none';
    loading.style.display = 'block';
    progressBar.style.width = '0%';

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
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        currentFlashcards = data.flashcards;
        
        setTimeout(() => {
            loading.style.display = 'none';
            flashcardsContainer.style.display = 'block';
            displayFlashcards();
        }, 500);
    } catch (e) {
        console.error('Error uploading file:', e);
        showNotification('Error processing your file. Please try again.', 'error');
        loading.style.display = 'none';
        dropFile.style.display = 'block';
        progressBar.style.width = '0%';
    }
}

function displayFlashcards() {
    flashcards.forEach(card => {
        card.classList.remove('revealed');
        const button = card.querySelector('.btn-reveal');
        if (button) {
            button.textContent = 'Reveal Answer';
        }
    });
    
    currentCardIndex = 0;
    updateCardDisplay();
    
    currentFlashcards.forEach((card, index) => {
        const questionEl = document.getElementById(`question-${index + 1}`);
        const answerEl = document.getElementById(`answer-${index + 1}`);
        
        if (questionEl && answerEl) {
            questionEl.textContent = card.question;
            answerEl.textContent = card.answer;
        }
    });
}

function updateCardDisplay() {
    flashcards.forEach(card => {
        card.classList.remove('active');
    });
    
    flashcards[currentCardIndex].classList.add('active');
    
    cardCounter.textContent = `${currentCardIndex + 1}/${currentFlashcards.length}`;
    
    prevCardBtn.disabled = currentCardIndex === 0;
    nextCardBtn.disabled = currentCardIndex === currentFlashcards.length - 1;
}

function navigateCards(direction) {
    if (direction === 'prev' && currentCardIndex > 0) {
        currentCardIndex--;
    } else if (direction === 'next' && currentCardIndex < currentFlashcards.length - 1) {
        currentCardIndex++;
    }
    
    flashcards[currentCardIndex].classList.remove('revealed');
    const button = flashcards[currentCardIndex].querySelector('.btn-reveal');
    if (button) {
        button.textContent = 'Reveal Answer';
    }
    
    updateCardDisplay();
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

document.addEventListener('keydown', (e) => {
    if (flashcardsContainer.style.display === 'block') {
        if (e.key === 'ArrowLeft') {
            navigateCards('prev');
        } else if (e.key === 'ArrowRight') {
            navigateCards('next');
        } else if (e.key === ' ' || e.key === 'Enter') {
            const currentCard = flashcards[currentCardIndex];
            currentCard.classList.toggle('revealed');
            
            const button = currentCard.querySelector('.btn-reveal');
            if (button) {
                if (currentCard.classList.contains('revealed')) {
                    button.textContent = 'Hide Answer';
                } else {
                    button.textContent = 'Reveal Answer';
                }
            }
        }
    }
});