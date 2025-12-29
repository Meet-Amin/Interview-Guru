// State
const state = {
    view: 'welcome', // welcome, landing, interview, report
    resumeText: '',
    messages: [],
    isRecording: false,
    isSpeaking: false,
    questionIndex: 0,
    apiKey: '',
    provider: 'gemini',
    jobRole: '',
    jobDesc: '',
    customQuestions: []
};

// Mock Interview Questions
const QUESTIONS = [
    "Tell me a little about yourself and your background.",
    "I see from your resume you have some interesting experience. Can you describe a challenging technical problem you've solved recently?",
    "How do you handle disagreements with colleagues or stakeholders?",
    "Where do you see yourself in five years?",
    "Do you have any questions for us?"
];

// DOM Elements
const views = {
    welcome: document.getElementById('view-welcome'),
    landing: document.getElementById('view-landing'),
    interview: document.getElementById('view-interview'),
    report: document.getElementById('view-report')
};

const dom = {
    letsGoBtn: document.getElementById('btn-lets-go'),
    dropZone: document.getElementById('drop-zone'),
    fileInput: document.getElementById('resume-upload'),
    filePreview: document.getElementById('file-preview'),
    startBtn: document.getElementById('start-btn'),
    chatFeed: document.getElementById('chat-feed'),
    micBtn: document.getElementById('mic-toggle'),
    endBtn: document.getElementById('end-interview-btn'),
    statusText: document.getElementById('status-text'),
    visualizer: document.querySelector('.visualizer-container'),
    caption: document.getElementById('live-caption')
};

// --- Initialization ---
function init() {
    setupEventListeners();
    checkBrowserSupport();
    initTypewriter();
    initParticles();
}

function initParticles() {
    const canvas = document.getElementById('welcome-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];

    // Resize
    const resize = () => {
        width = canvas.width = canvas.parentElement.offsetWidth;
        height = canvas.height = canvas.parentElement.offsetHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // Particle Class
    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 1; // Velocity
            this.vy = (Math.random() - 0.5) * 1;
            this.size = Math.random() * 2 + 1;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            // Bounce
            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;
        }

        draw() {
            ctx.fillStyle = 'rgba(99, 102, 241, 0.5)'; // Primary color
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Create Particles
    for (let i = 0; i < 50; i++) particles.push(new Particle());

    // Animate
    function animate() {
        if (state.view !== 'welcome') {
            requestAnimationFrame(animate);
            return; // Pause if not visible to save resources, but keep loop for when it returns? or just clear
        }

        ctx.clearRect(0, 0, width, height);

        // Draw connections
        for (let i = 0; i < particles.length; i++) {
            const p1 = particles[i];
            p1.update();
            p1.draw();

            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 150) {
                    ctx.strokeStyle = `rgba(99, 102, 241, ${1 - dist / 150})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animate);
    }

    animate();
}

function initTypewriter() {
    const textElement = document.getElementById('typewriter-text');
    const phrases = ["Next Interview", "Dream Job", "Career Growth", "Soft Skills", "Technical Round"];
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typeSpeed = 100;

    function type() {
        const currentPhrase = phrases[phraseIndex];

        if (isDeleting) {
            textElement.textContent = currentPhrase.substring(0, charIndex - 1);
            charIndex--;
            typeSpeed = 50; // Faster deleting
        } else {
            textElement.textContent = currentPhrase.substring(0, charIndex + 1);
            charIndex++;
            typeSpeed = 100; // Normal typing
        }

        if (!isDeleting && charIndex === currentPhrase.length) {
            // Finished typing phrase
            isDeleting = true;
            typeSpeed = 2000; // Pause at end
        } else if (isDeleting && charIndex === 0) {
            // Finished deleting
            isDeleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            typeSpeed = 500; // Pause before new phrase
        }

        setTimeout(type, typeSpeed);
    }

    type();
}

function checkBrowserSupport() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert("Speech Recognition API not supported in this browser. Please use Chrome or Safari.");
    }
}

// --- Event Listeners ---
function setupEventListeners() {
    // File Upload
    dom.dropZone.addEventListener('click', () => dom.fileInput.click());
    dom.dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dom.dropZone.classList.add('dragover');
    });
    dom.dropZone.addEventListener('dragleave', () => dom.dropZone.classList.remove('dragover'));
    dom.dropZone.addEventListener('drop', handleDrop);
    dom.fileInput.addEventListener('change', handleFileSelect);

    document.getElementById('remove-file').addEventListener('click', (e) => {
        e.stopPropagation();
        resetFile();
    });

    // Navigation
    dom.letsGoBtn.addEventListener('click', () => switchView('landing'));
    dom.startBtn.addEventListener('click', startInterview);
    dom.endBtn.addEventListener('click', endInterview);

    // Audio Control
    dom.micBtn.addEventListener('click', toggleRecording);
}

// --- File Handling ---
async function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) await processFile(file);
}

async function handleDrop(e) {
    e.preventDefault();
    dom.dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) await processFile(file);
}

async function processFile(file) {
    // Show preview
    dom.dropZone.classList.add('hidden');
    dom.filePreview.classList.remove('hidden');
    document.getElementById('filename').textContent = file.name;

    // Parse
    try {
        if (file.type === 'application/pdf') {
            state.resumeText = await parsePDF(file);
        } else {
            state.resumeText = await file.text();
        }
        dom.startBtn.disabled = false;
        console.log("Resume Parsed:", state.resumeText.substring(0, 100) + "...");
    } catch (err) {
        console.error(err);
        alert("Error parsing file. Please try a simple text file.");
    }
}

function resetFile() {
    dom.fileInput.value = '';
    state.resumeText = '';
    dom.dropZone.classList.remove('hidden');
    dom.filePreview.classList.add('hidden');
    dom.startBtn.disabled = true;
}

// PDF Parsing using PDF.js
async function parsePDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map(item => item.str);
        fullText += strings.join(' ') + '\n';
    }
    return fullText;
}


// --- Interview Logic ---

function switchView(viewName) {
    Object.values(views).forEach(el => el.classList.remove('active'));
    setTimeout(() => {
        Object.values(views).forEach(el => el.classList.add('hidden'));
        views[viewName].classList.remove('hidden');
        // Force reflow
        void views[viewName].offsetWidth;
        views[viewName].classList.add('active');
    }, 500);
}

async function startInterview() {
    state.apiKey = document.getElementById('api-key-input').value.trim();
    state.provider = document.getElementById('ai-provider').value;
    state.jobRole = document.getElementById('job-role').value;
    state.jobDesc = document.getElementById('job-desc').value;

    if (state.apiKey) console.log(`Using Real AI Mode (${state.provider})`);

    // Loading State
    dom.startBtn.textContent = "Preparing Interview...";
    dom.startBtn.disabled = true;

    // Clear dynamic gen logic

    switchView('interview');
    state.questionIndex = 0;
    state.messages = [];
    dom.chatFeed.innerHTML = '';

    // Reset Button
    dom.startBtn.textContent = "Start Interview";
    dom.startBtn.disabled = false;

    // Delay for transition then start
    setTimeout(() => {
        // Start conversation
        generateNextInteraction(null);
    }, 1500);
}

// Dynamic Interaction Loop
async function generateNextInteraction(previousUserResponse) {
    // If no previous response (first message), generate intro

    // Check if we reached question limit (e.g. 5)
    const aiMessageCount = state.messages.filter(m => m.sender === 'ai').length;
    if (aiMessageCount >= 5) {
        endInterview();
        return;
    }

    const isFirst = aiMessageCount === 0;

    // Optimistic UI for AI thinking
    const thinkingId = addMessage("Thinking...", 'ai', true); // true = temporary
    dom.statusText.textContent = "AI is thinking...";

    try {
        let questionText = "Tell me about yourself.";

        if (state.apiKey) {
            const prompt = `
            You are a professional Interviewer. 
            Resume: ${state.resumeText.substring(0, 1500)}
            Role: ${state.jobRole}
            Job Desc: ${state.jobDesc.substring(0, 500)}
            
            Conversation History:
            ${state.messages.map(m => `${m.sender.toUpperCase()}: ${m.text}`).join('\n')}
            
            Instruction:
            ${isFirst ? `Generate the FIRST opening question. Reference the resume directly (e.g. "I see you worked at X").` : `Based on the candidate's last answer, generate the NEXT follow-up question. Dig deeper or move to a new topic. Be conversational.`}
            
            Keep the question concise (under 2 sentences).
            Return ONLY the raw question text.
            `;

            if (state.provider === 'openai') {
                questionText = await callOpenAI(prompt);
            } else {
                questionText = await callGemini(prompt);
            }
        } else {
            // Mock Mode Fallback
            questionText = QUESTIONS[aiMessageCount] || "That's all the questions I have.";
        }

        // Remove thinking message
        const thinkingEl = document.getElementById(thinkingId);
        if (thinkingEl) thinkingEl.remove();

        addMessage(questionText, 'ai');
        speak(questionText);

    } catch (e) {
        console.error("AI Gen Failed", e);
        // Fallback
        const fallback = QUESTIONS[aiMessageCount] || "Tell me more.";
        document.getElementById(thinkingId)?.remove();
        addMessage(fallback, 'ai');
        speak(fallback);
    }
}

// generateDynamicQuestions removed - dynamic is now realtime

function addMessage(text, sender, isTemp = false) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender === 'ai' ? 'ai-message' : 'user-message');
    if (isTemp) {
        msgDiv.id = 'msg-thinking';
        msgDiv.classList.add('thinking');
    }
    msgDiv.textContent = text;
    dom.chatFeed.appendChild(msgDiv);
    dom.chatFeed.scrollTop = dom.chatFeed.scrollHeight;

    if (!isTemp) {
        state.messages.push({ sender, text });
    }
    return msgDiv.id;
}

function handleUserResponse(text) {
    addMessage(text, 'user');

    // Trigger dynamic next step
    generateNextInteraction(text);
}

// --- Audio Handling ---
let recognition;

function initSpeech() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = true; // Enabled for captions

    recognition.onstart = () => {
        state.isRecording = true;
        updateMicStatus();
        dom.caption.classList.remove('hidden');
        dom.caption.textContent = '';
    };

    recognition.onend = () => {
        state.isRecording = false;
        updateMicStatus();
        setTimeout(() => dom.caption.classList.add('hidden'), 2000);
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        // Show interim in caption
        if (interimTranscript) {
            dom.caption.textContent = interimTranscript;
        }

        // Handle final immediately
        if (finalTranscript) {
            dom.caption.textContent = finalTranscript;
            handleUserResponse(finalTranscript);
        }
    };

    return recognition;
}

function toggleRecording() {
    if (!recognition) recognition = initSpeech();
    if (!recognition) return;

    if (state.isRecording) {
        recognition.stop();
    } else {
        recognition.start();
    }
}

function updateMicStatus() {
    if (state.isRecording) {
        dom.micBtn.classList.add('active');
        dom.statusText.textContent = "Listening... (Speak Now)";
        dom.visualizer.classList.add('listening'); // New class
        dom.visualizer.classList.remove('speaking');
    } else {
        dom.micBtn.classList.remove('active');
        dom.statusText.textContent = "Press Mic to Answer";
        dom.visualizer.classList.remove('listening');
        // Do not remove speaking here, as it might be speaking
    }
}

function speak(text) {
    if ('speechSynthesis' in window) {
        // Stop listening if speaking
        if (state.isRecording) {
            recognition.stop();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        // Find a decent voice
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha'));
        if (preferred) utterance.voice = preferred;

        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onstart = () => {
            state.isSpeaking = true;
            dom.visualizer.classList.remove('listening'); // Ensure not both
            dom.visualizer.classList.add('speaking');
            dom.statusText.textContent = "AI is speaking...";
        };

        utterance.onend = () => {
            state.isSpeaking = false;
            dom.visualizer.classList.remove('speaking');
            dom.statusText.textContent = "Press Mic to Answer";

            // Auto-start listening for better UX?
            // Let's enable it to make it smoother for the user
            toggleRecording();
        };

        window.speechSynthesis.cancel(); // kill current
        window.speechSynthesis.speak(utterance);
    }
}

function handleUserResponse_Deprecated(text) {
    // Removed
}

// --- Report Generation ---
async function endInterview() {
    // Stop any ongoing speech/listening
    if (state.isRecording && recognition) recognition.stop();
    window.speechSynthesis.cancel();

    switchView('report');

    if (state.apiKey) {
        await generateRealReport();
    } else {
        generateReport(); // Fallback to mock
    }
}

async function callGemini(prompt) {
    // Helper to make request
    const makeRequest = async (modelName) => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${state.apiKey}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });
        const data = await response.json();
        if (!response.ok) throw { status: response.status, data };
        if (!data.candidates || data.candidates.length === 0) throw { message: "No response candidates" };

        return data.candidates[0].content.parts[0].text;
    };

    // List of models to try in order of preference
    // We try specific versions (1.0-pro) instead of aliases (gemini-pro) which can have routing issues
    const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro'];

    let lastError = null;

    for (const model of models) {
        try {
            console.log(`Attempting to connect to ${model}...`);
            return await makeRequest(model);
        } catch (e) {
            console.warn(`Model ${model} failed.`, e);
            lastError = e;
            // Continue to next model
        }
    }

    // If we get here, all failed
    console.error("All Gemini models failed:", lastError);
    const msg = lastError?.data?.error?.message || lastError?.message || "Unknown API Error";
    alert(`AI Connection Failed: ${msg}. Please ensure your API Key is from Google AI Studio.`);
    throw lastError;
}

async function callOpenAI(prompt) {
    const url = 'https://api.openai.com/v1/chat/completions';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("OpenAI API Error:", data);
            throw new Error(data.error?.message || "OpenAI Error");
        }

        return data.choices[0].message.content;
    } catch (error) {
        console.error("OpenAI Call Failed:", error);
        alert(`OpenAI Connection Failed: ${error.message}`);
        throw error;
    }
}

async function generateRealReport() {
    document.getElementById('report-summary').textContent = `Analyzing with ${state.provider === 'openai' ? 'GPT-4' : 'Gemini'}...`;

    // Build Transcript
    const transcript = state.messages.map(m => `${m.sender.toUpperCase()}: ${m.text}`).join('\n');

    const prompt = `
    You are an expert HR interviewer. Analyze the following job interview transcript based on the candidate's resume and responses.
    
    Role Applied For: ${state.jobRole}
    Job Description context: ${state.jobDesc.substring(0, 500)}

    Transcript:
    ${transcript}
    
    Provide a detailed evaluation in valid JSON format with the following structure:
    {
        "score": number (0-100),
        "recommendation": "HIRE" | "NO HIRE" | "MAYBE",
        "summary": "Detailed summary string...",
        "strengths": ["string", "string", ...],
        "improvements": ["string", "string", ...]
    }
    
    BE CRITICAL. If the interview was very short (less than 3 questions answered), give a low score and NO HIRE.
    Do not output markdown code blocks, just the raw JSON string.
    `;

    try {
        let resultText = '';
        if (state.provider === 'openai') {
            resultText = await callOpenAI(prompt);
        } else {
            resultText = await callGemini(prompt);
        }

        // Clean cleanup if model adds backticks
        const cleanJson = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleanJson);

        renderReport(data.score, data.recommendation, data.summary, data.strengths, data.improvements);

    } catch (e) {
        console.error(e);
        document.getElementById('report-summary').textContent = "Error analyzing report. Please try again.";
    }
}

function renderReport(score, recommendation, summaryText, strengths, improvements) {
    const circle = document.querySelector('.progress-ring__circle');
    const radius = circle.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (score / 100) * circumference;

    // Animate Score
    circle.style.strokeDashoffset = offset;
    document.getElementById('final-score').textContent = score;

    // Update Recommendation Text
    const scoreDiv = document.querySelector('.score-text small');
    scoreDiv.textContent = recommendation;

    if (recommendation === 'NO HIRE') scoreDiv.style.color = '#ef4444';
    else if (recommendation === 'MAYBE') scoreDiv.style.color = '#f59e0b';
    else scoreDiv.style.color = '#10b981';

    document.getElementById('report-summary').textContent = summaryText;

    const sList = document.getElementById('list-strengths');
    const iList = document.getElementById('list-improvements');

    sList.innerHTML = strengths.map(s => `<li>${s}</li>`).join('');
    iList.innerHTML = improvements.map(s => `<li>${s}</li>`).join('');
}

function generateReport() {
    // ... Existing Mock Logic ...
    // Reuse renderReport for the mock logic too to clean up code? 
    // For now, let's just keep the existing math logic but updated to use renderReport if we wanted, 
    // but I'll leave the existing function logic I previously wrote to avoid breaking changes in this chunk,
    // OR I will refactor it to use renderReport for consistency.

    const userAnswers = state.messages.filter(m => m.sender === 'user').length;
    const totalQuestions = QUESTIONS.length;

    let score;
    let recommendation = "HIRE";
    let summaryText = "";

    if (userAnswers < 2) {
        score = Math.floor(Math.random() * (40 - 10) + 10);
        recommendation = "NO HIRE";
        summaryText = "The interview was terminated early. Insufficient data.";
    } else if (userAnswers < totalQuestions) {
        score = Math.floor(Math.random() * (70 - 40) + 40);
        recommendation = "MAYBE";
        summaryText = "The candidate demonstrated potential but did not complete the assessment.";
    } else {
        score = Math.floor(Math.random() * (98 - 75) + 75);
        recommendation = "HIRE";
        summaryText = "The candidate showed strong technical knowledge. Recommended for next rounds.";
    }

    let strengths = score > 70 ? ["Good communication", "Relevance", "Confidence"] : ["Polite"];
    let improvements = score > 70 ? ["More metrics"] : ["Answer more questions", "Confidence"];

    renderReport(score, recommendation, summaryText, strengths, improvements);
}

// Boot
init();
