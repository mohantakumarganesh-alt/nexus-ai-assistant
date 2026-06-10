# Slide 1: Title Slide
- **Title**: Build Your Own AI Assistant
- **Subtitle**: A Project by [Your Name]
- **Visuals**: A clean, modern title slide with a robot icon.

# Slide 2: Project Overview
- **Objective**: To build a web-based AI assistant capable of multiple tasks driven by different prompt structures and conversational memory.
- **Technologies Used**:
    - Backend: Python (Flask)
    - AI Integration: Google Gemini API (gemini-2.5-flash)
    - Frontend: HTML5, CSS3 (Balanced Modern Dark Theme), Vanilla JS

# Slide 3: Core Functionalities
- **1. Answer Questions**: Provide factual answers to any query, with context-aware follow-ups.
- **2. Summarize Text**: Condense long documents into easily digestible formats.
- **3. Creative Content**: Generate stories, poems, or humorous paragraphs based on a topic.

# Slide 4: The Power of Prompt Engineering
- **Concept**: Different prompts yield dramatically different results.
- **Implementation**: We built 3 prompt styles for each function.
    - *Example (Questions)*: Concise, Detailed, Explain Like I'm 5
    - *Example (Summary)*: Bullet Points, One Sentence, Executive Summary
    - *Example (Creative)*: Story, Poem, Humorous

# Slide 5: User Interface Design
- **Concept**: A premium, balanced modern web interface called "Nexus AI".
- **Features**:
    - Professional dark mode (slate/charcoal) with sleek Indigo accents.
    - Clean borders and elegant subtle shadows for lightning-fast performance.
    - Chat interface with typing indicators and full **Markdown rendering** (using marked.js).

# Slide 6: Feedback Loop & Robustness
- **Feedback Logging**: After every AI response, the user is asked "Was this helpful?". Data is logged into a local `feedback.json` file to evaluate prompt effectiveness.
- **Context Memory**: The system remembers the chat history within a specific style/function to allow natural follow-up questions.
- **Robust API Handling**: Implemented Exponential Backoff retry logic to gracefully handle transient API demand spikes.

# Slide 7: Demonstration
- *(In the actual presentation, show screenshots or a live demo here)*
- Highlight the difference in output when changing prompt styles for the same input.
- Show a multi-turn conversation to demonstrate the AI remembering context.

# Slide 8: Setup Guide (How to Run)
1. Install Python dependencies: `pip install -r requirements.txt` (includes `google-genai`).
2. Set your Google Gemini API Key in a `.env` file: `GEMINI_API_KEY=your_key`
3. Start the Flask server: `python app.py`
4. Open your web browser to `http://localhost:5000`

# Slide 9: Conclusion
- **Summary**: Successfully built a fully functional, robust AI assistant showcasing prompt engineering, conversation history, and a premium web design.
- **Future Improvements**:
    - Support for comparing multiple AI models side-by-side.
    - User accounts and cloud database storage for chat sessions.
    - Voice input/output integration.
