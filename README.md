# Nexus AI Assistant

Nexus AI is a sleek, web-based artificial intelligence assistant powered by the Google Gemini API. It features a beautifully designed "Balanced Modern" dark theme interface and supports contextual conversational memory, multiple AI tasks, and dynamic prompt engineering.

## Features

- **Multi-Functional Operations**:
  - **Answer Questions**: Acts as a personal tutor or encyclopedia.
  - **Summarize Text**: Condenses long documents into summaries.
  - **Creative Content**: Generates stories, poems, and humorous text.
- **Dynamic Prompt Styles**: Each function has three distinct output styles (e.g., "Explain Like I'm 5", "Bullet Points", "Poem") allowing you to customize how the AI responds.
- **Conversational Memory**: The AI remembers previous messages within a chat session to answer follow-up questions naturally.
- **Beautiful UI**: Features a highly optimized, premium dark mode aesthetic with Indigo accents, smooth CSS micro-animations, and full **Markdown rendering** for code blocks and text formatting.
- **Robust API Handling**: Built-in exponential backoff retry logic to automatically handle temporary API traffic spikes (e.g., 503 or 429 errors).
- **Feedback Loop**: Users can rate responses (Yes/No), which are logged locally to `feedback.json` for analysis.

## Technologies Used

- **Backend**: Python, Flask
- **AI Integration**: Google Gemini API (`google-genai`)
- **Frontend**: HTML5, CSS3 (Modern Dark Theme), Vanilla JavaScript
- **Libraries**: `marked.js` for Markdown parsing, `python-dotenv` for environment variable management.

## Installation & Setup

1. **Clone or Download the Repository**

2. **Set Up a Virtual Environment (Optional but recommended)**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Your API Key**
   Create a `.env` file in the root directory and add your Google Gemini API key:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   ```

5. **Run the Application**
   ```bash
   python app.py
   ```

6. **Access the Web Interface**
   Open your browser and navigate to: [http://127.0.0.1:5000](http://127.0.0.1:5000)

## How to Use

1. **Select a Function**: Use the sidebar to choose what you want the AI to do (Answer, Summarize, Creative).
2. **Choose a Style**: Select the tone or format for the response.
3. **Chat**: Type your input and hit Send! 
   *Note: Changing the Function or Style will reset the conversation memory for a fresh start.*
4. **Provide Feedback**: Click the "Yes" or "No" buttons under the AI's response to log feedback.

## License
MIT License
