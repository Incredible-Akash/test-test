let questions = [];
let currentQuestionIndex = 0;
let score = 0;

document.getElementById("pdf-upload").addEventListener("change", handleFileUpload);
document.getElementById("submit-btn").addEventListener("click", submitAnswer);
document.getElementById("next-btn").addEventListener("click", nextQuestion);
document.getElementById("restart-btn").addEventListener("click", restartTest);

function handleFileUpload(event) {
    const file = event.target.files[0];

    if (file && file.type === "application/pdf") {
        const reader = new FileReader();
        reader.onload = function(e) {
            const pdfData = new Uint8Array(e.target.result);
            extractPDFContent(pdfData);
        };
        reader.readAsArrayBuffer(file);
    } else {
        alert("Please upload a valid PDF file.");
    }
}

function extractPDFContent(pdfData) {
    pdfjsLib.getDocument(pdfData).promise.then(function(pdf) {
        let allText = '';
        let numPages = pdf.numPages;

        // Extract text from each page
        let pagePromises = [];

        for (let i = 1; i <= numPages; i++) {
            const pagePromise = pdf.getPage(i).then(function(page) {
                return page.getTextContent().then(function(textContent) {
                    allText += textContent.items.map(item => item.str).join(' ') + '\n'; // Collect text
                });
            });

            pagePromises.push(pagePromise);
        }

        // Wait until all pages are processed
        Promise.all(pagePromises).then(function() {
            processExtractedText(allText);
        });
    }).catch(function(error) {
        console.error("Error extracting PDF content:", error);
        alert("There was an error processing the PDF file.");
    });
}

function processExtractedText(text) {
    // Basic split logic assuming a consistent format: Question => Options => Correct Answer
    const questionBlocks = text.split("\n\n"); // Split by newlines for each question block
    
    questions = questionBlocks.map(block => {
        const lines = block.split("\n").map(line => line.trim()).filter(Boolean);
        
        if (lines.length >= 3) {
            const question = lines[0];
            const options = lines.slice(1, -1); // Options are everything between question and answer
            const correctAnswer = lines[lines.length - 1]; // Correct answer is the last line
            return { question, options, correctAnswer };
        }
        return null;
    }).filter(Boolean);

    if (questions.length > 0) {
        // Hide the upload section and show the test
        document.getElementById("upload-container").classList.add("hidden");
        document.getElementById("test-container").classList.remove("hidden");

        // Load the first question
        loadQuestion();
    } else {
        alert("No questions found in the PDF.");
    }
}

function loadQuestion() {
    const question = questions[currentQuestionIndex];

    document.getElementById("question-title").textContent = `Question ${currentQuestionIndex + 1}`;
    document.getElementById("question").textContent = question.question;

    const form = document.getElementById("answers-form");
    form.innerHTML = ''; // Clear previous options

    question.options.forEach((option, index) => {
        const label = document.createElement("label");
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "answer";
        input.value = option;
        label.appendChild(input);
        label.appendChild(document.createTextNode(option));
        form.appendChild(label);
        form.appendChild(document.createElement("br"));
    });
}

function submitAnswer() {
    const selectedOption = document.querySelector('input[name="answer"]:checked');
    if (selectedOption) {
        const question = questions[currentQuestionIndex];
        if (selectedOption.value === question.correctAnswer) {
            score++;
        }
    }

    // Proceed to next question
    nextQuestion();
}

function nextQuestion() {
    currentQuestionIndex++;

    if (currentQuestionIndex < questions.length) {
        loadQuestion();
    } else {
        showResults();
    }
}

function showResults() {
    document.getElementById("test-container").classList.add("hidden");
    document.getElementById("results-container").classList.remove("hidden");
    document.getElementById("score").textContent = `Your score is: ${score} out of ${questions.length}`;
}

function restartTest() {
    score = 0;
    currentQuestionIndex = 0;
    questions = [];
    document.getElementById("results-container").classList.add("hidden");
    document.getElementById("upload-container").classList.remove("hidden");
}
