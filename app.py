import os
import json
import time
from datetime import datetime
from flask import Flask, request, jsonify, render_template
from google import genai
from dotenv import load_dotenv
from prompts import PROMPTS

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# Initialize Google Gemini Client
# Note: Ensure GEMINI_API_KEY is set in the environment or .env file
try:
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY", "dummy_key_to_allow_server_start"))
except Exception:
    client = None # Handle missing API key gracefully for now

FEEDBACK_FILE = "feedback.json"

def init_feedback_file():
    if not os.path.exists(FEEDBACK_FILE):
        with open(FEEDBACK_FILE, "w") as f:
            json.dump([], f)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate', methods=['POST'])
def generate():
    data = request.json
    func = data.get('function')
    style = data.get('style')
    user_input = data.get('input')
    history = data.get('history', [])

    if not all([func, style, user_input]):
        return jsonify({"error": "Missing required fields"}), 400

    if func not in PROMPTS or style not in PROMPTS[func]:
        return jsonify({"error": "Invalid function or style"}), 400

    try:
        contents = []
        for i, msg in enumerate(history):
            role = msg['role']
            text = msg['text']
            if role == 'user' and i == 0:
                text = f"System: You are a helpful AI assistant.\n\nUser: {PROMPTS[func][style].format(input=text)}"
            contents.append({'role': role, 'parts': [{'text': text}]})

        current_text = user_input
        if len(history) == 0:
            current_text = f"System: You are a helpful AI assistant.\n\nUser: {PROMPTS[func][style].format(input=user_input)}"

        contents.append({'role': 'user', 'parts': [{'text': current_text}]})

        max_retries = 3
        ai_response = ""
        for attempt in range(max_retries):
            try:
                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=contents,
                )
                ai_response = response.text
                break
            except Exception as e:
                error_msg = str(e)
                if attempt < max_retries - 1 and ('503' in error_msg or '429' in error_msg or 'UNAVAILABLE' in error_msg):
                    time.sleep(1.5 ** attempt) # Exponential backoff
                    continue
                else:
                    raise e

        return jsonify({
            "response": ai_response,
            "prompt_used": current_text if len(history) == 0 else "Follow-up question"
        })
    except Exception as e:
        error_str = str(e)
        if '429' in error_str or 'RESOURCE_EXHAUSTED' in error_str:
            return jsonify({"response": "I'm receiving too many requests right now! Google's Free Tier limits me to 20 messages per day on this API Key. Please try again tomorrow, or add billing to your Google Cloud account! ⏳", "prompt_used": "Rate Limit Reached"}), 200
        return jsonify({"error": error_str}), 500

@app.route('/feedback', methods=['POST'])
def feedback():
    data = request.json
    helpful = data.get('helpful')
    func = data.get('function')
    style = data.get('style')
    user_input = data.get('input')
    ai_response = data.get('response')

    if helpful is None:
         return jsonify({"error": "Missing 'helpful' field"}), 400

    feedback_entry = {
        "timestamp": datetime.now().isoformat(),
        "function": func,
        "style": style,
        "input": user_input,
        "response": ai_response,
        "helpful": helpful
    }

    try:
        init_feedback_file()
        with open(FEEDBACK_FILE, "r") as f:
            feedbacks = json.load(f)
        
        feedbacks.append(feedback_entry)

        with open(FEEDBACK_FILE, "w") as f:
            json.dump(feedbacks, f, indent=4)
            
        return jsonify({"message": "Feedback saved successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    init_feedback_file()
    app.run(debug=True, port=5000)
