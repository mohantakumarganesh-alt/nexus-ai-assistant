# Nexus AI Assistant

Nexus AI is a sleek, web-based AI assistant powered by a **multi-LLM fallback engine** — integrating Google Gemini, Groq, Cohere, and HuggingFace. When one API hits its free-tier rate limit, the system **automatically falls back** to the next provider, maximising uptime and extending free usage to **29,000+ requests/day**.

🌐 **Live Demo**: [nexus-ai-assistant-4sby.onrender.com](https://nexus-ai-assistant-4sby.onrender.com)

---

## ✨ Features

- **Multi-LLM Fallback Engine**: Automatically switches between 5 AI providers when rate limits are hit — no manual intervention needed.
- **Multi-Functional Operations**:
  - **Answer Questions**: Acts as a personal tutor or encyclopedia.
  - **Summarize Text**: Condenses long documents into concise summaries.
  - **Creative Content**: Generates stories, poems, and humorous text.
- **Dynamic Prompt Styles**: Each function has three distinct output styles (e.g., *Explain Like I'm 5*, *Bullet Points*, *Poem*) to customize how the AI responds.
- **Conversational Memory**: The AI remembers previous messages within a session for natural follow-up questions.
- **Beautiful Responsive UI**: Full-screen dark mode with aurora background, glassmorphism, micro-animations, and full **Markdown rendering**. Works seamlessly on desktop, tablet, and mobile (including iOS safe areas).
- **Feedback Loop**: Users can rate responses (👍/👎), logged locally to `feedback.json` for analysis.

---

## 🤖 LLM Provider Chain

The app uses a priority-based fallback chain. If a provider returns a rate-limit error (429) or is unavailable (503), the next one is tried automatically:

| Priority | Provider | Model | Free Tier |
|----------|----------|-------|-----------|
| 1 | **Google Gemini** | `gemini-2.5-flash` | ~500 req/day |
| 2 | **Groq** | `llama-3.3-70b-versatile` | 14,400 req/day |
| 3 | **Groq** | `llama-3.1-8b-instant` | 14,400 req/day |
| 4 | **Cohere** | `command-nightly` | 5,000 req/month |
| 5 | **HuggingFace** | `Qwen/Qwen2.5-72B-Instruct` | ~300 req/day |

> **Total free capacity: ~29,000+ requests/day** across all providers.

---

## 🛠️ Technologies Used

- **Backend**: Python, Flask, Gunicorn
- **AI SDKs**: `google-genai`, `groq`, `cohere`, `huggingface_hub`
- **Frontend**: HTML5, CSS3 (full-screen dark theme, responsive), Vanilla JavaScript
- **Libraries**: `marked.js` (Markdown), `python-dotenv` (env management), Font Awesome (icons)
- **Deployment**: Render (free tier)

---

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/mohantakumarganesh-alt/nexus-ai-assistant.git
cd nexus-ai-assistant
```

### 2. Set Up a Virtual Environment
```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure API Keys

Create a `.env` file in the root directory. Add at least one key — the more you add, the more free usage time you get:

```env
# Primary — Google Gemini (~500 req/day free)
# Get key: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Fallback 1 & 2 — Groq (14,400 req/day FREE!)
# Get key: https://console.groq.com
GROQ_API_KEY=your_groq_api_key_here

# Fallback 3 — Cohere (5,000 req/month free)
# Get key: https://dashboard.cohere.com
COHERE_API_KEY=your_cohere_api_key_here

# Fallback 4 — HuggingFace (~300 req/day free)
# Get key: https://huggingface.co/settings/tokens
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
```

### 5. Run the Application
```bash
python app.py
```

### 6. Open in Browser
Navigate to: [http://127.0.0.1:5000](http://127.0.0.1:5000)

---

## 🧪 Testing All Providers

Run the test script to verify each provider is working with your API keys:

```bash
python test_api.py
```

This tests each provider individually and then runs a full end-to-end fallback test.

---

## ☁️ Deployment (Render)

This project includes a `render.yaml` for one-click deployment to [Render.com](https://render.com) (free tier):

1. Push the repo to GitHub.
2. Connect repo on [dashboard.render.com](https://dashboard.render.com).
3. Add your API keys as **Environment Variables** in the Render dashboard.
4. Deploy — Render auto-deploys on every `git push`.

---

## 📖 How to Use

1. **Select a Function** — Use the sidebar (desktop) or top pill nav (mobile) to choose: Answer, Summarize, or Creative.
2. **Choose a Style** — Select the tone or format for the response.
3. **Chat** — Type your input and press Send.
   > *Changing the Function or Style resets conversation memory for a fresh start.*
4. **Feedback** — Click 👍 or 👎 under any response to log feedback.

---

## 📁 Project Structure

```
nexus-ai-assistant/
├── app.py              # Flask application & API routes
├── llm_manager.py      # Multi-LLM fallback engine
├── prompts.py          # Prompt templates for each function/style
├── test_api.py         # Provider verification script
├── requirements.txt    # Python dependencies
├── render.yaml         # Render deployment config
├── .env                # API keys (not committed to git)
├── templates/
│   └── index.html      # Main UI template
└── static/
    ├── style.css        # Full responsive dark theme CSS
    └── script.js        # Frontend logic & chat handling
```

---

## 📄 License
MIT License
