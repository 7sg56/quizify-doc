document.addEventListener('DOMContentLoaded', () => {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const loading = document.getElementById('loading');
    const flashcardCarousel = document.getElementById('flashcard-carousel');

    // Drag and drop functionality
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => dropzone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => dropzone.classList.remove('dragover'), false);
    });

    dropzone.addEventListener('drop', handleDrop, false);
    dropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFiles);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    function handleFiles(files) {
        const file = files instanceof FileList ? files[0] : files.target.files[0];
        
        if (file && file.type === 'application/pdf') {
            uploadPDF(file);
        } else {
            alert('Please upload a PDF file');
        }
    }

    async function uploadPDF(file) {
        // Show loading state
        dropzone.style.display = 'none';
        loading.style.display = 'block';

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/generate-flashcards', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.flashcards) {
                updateFlashcards(data.flashcards);
                loading.style.display = 'none';
                flashcardCarousel.style.display = 'block';
            } else {
                throw new Error(data.error || 'Failed to generate flashcards');
            }
        } catch (error) {
            console.error('Error:', error);
            loading.style.display = 'none';
            dropzone.style.display = 'flex';
            alert('Error generating flashcards: ' + error.message);
        }
    }

    function updateFlashcards(flashcards) {
        flashcards.forEach((card, index) => {
            const questionEl = document.getElementById(`question-${index + 1}`);
            const answerEl = document.getElementById(`answer-${index + 1}`);
            
            questionEl.textContent = card.question;
            answerEl.textContent = card.answer;
        });
    }
});