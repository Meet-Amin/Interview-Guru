# AI Interviewer Web App - Implementation Plan

## Overview
A web application designed to simulate an AI-driven job interview. Users upload a resume, and an AI agent conducts an interview via voice/text, analyzing responses and providing a final hiring report.

**Constraint Note:** `node` and `npm` are unavailable in the current environment. The application will be built using standard HTML-5, Vanilla CSS, and modular JavaScript (ESM), utilizing CDNs for necessary libraries (e.g., PDF.js).

## Architecture
- **Frontend Only:** No dedicated backend server. Logic runs in the browser.
- **AI Integration:** Direct calls to LLM API (Gemini/OpenAI) from the client (requires user API key) or Mock Mode for demonstration.
- **Audio:** Browser native `SpeechRecognition` (Web Speech API) and `SpeechSynthesis`.
- **Parsing:** `pdf.js` (via CDN) for local resume text extraction.

## File Structure
- `index.html`: Main entry point.
- `styles.css`: Custom premium styling (Glassmorphism, animations).
- `js/app.js`: Main application logic and state management.
- `js/audio.js`: Speech-to-text and Text-to-speech handlers.
- `js/ai.js`: LLM interaction (real + mock).
- `js/parser.js`: Resume parsing logic.

## Features & Flow

### 1. Landing / Setup
- Hero section with "Start Interview" CTA.
- API Key Input (Optional - default to Mock Mode).
- Resume Upload (Drag & Drop).

### 2. Resume Processing
- Parse text from uploaded PDF/TXT.
- Generate initial context for the AI interviewer.

### 3. Interview Session
- **Interface:** Chat-style UI with an animated avatar or visualizer for the AI.
- **Interaction:**
    1.  AI asks a question (Audio + Text).
    2.  User speaks (Visualizer reacts to mic).
    3.  Speech converted to text.
    4.  AI analyzes and responds.
- **Controls:** Mute, End Interview.

### 4. Report Generation
- Final analysis of all Q&A.
- Score (0-100).
- Hiring Recommendation (Yes/No/Maybe).
- Key Strengths & Improvements.

## Visual Design (Aesthetics)
- **Theme:** Dark mode, deep blues/purples, neon accents.
- **Typography:** Inter or Outfit (Google Fonts).
- **Effects:** Glassmorphism cards, soft glowing gradients, smooth transitions.

## Step-by-Step Implementation
1.  **Setup**: Create directory structure and base files.
2.  **UI Construction**: Build HTML structure and CSS for Landing, Chat, and Report views.
3.  **Logic - Core**: Implement state switching (views).
4.  **Logic - Audio**: Hook up Speech APIs.
5.  **Logic - Parsing**: Implement PDF text extraction.
6.  **Logic - AI**: Implement specific Mock questions and analysis generation.
7.  **Refinement**: Polish animations and error handling.
