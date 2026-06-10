# -*- coding: utf-8 -*-
"""
test_api.py -- Test all configured LLM providers individually.

Run this to verify which providers are working with your API keys:
    python test_api.py
"""
import os
import sys

# Force UTF-8 output so status symbols display correctly on Windows
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

from dotenv import load_dotenv

load_dotenv()

TEST_PROMPT = "Say hello in one sentence."

def separator(title):
    print(f"\n{'='*55}")
    print(f"  {title}")
    print('='*55)

# ---------------------------------------------------------
# 1. Google Gemini
# ---------------------------------------------------------
separator("1. Google Gemini (gemini-2.5-flash)")
try:
    from google import genai
    key = os.environ.get("GEMINI_API_KEY", "")
    if not key or key == "your_gemini_api_key_here":
        print("[!] GEMINI_API_KEY not set in .env")
    else:
        client = genai.Client(api_key=key)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=TEST_PROMPT,
        )
        print("[OK] Success:", response.text.strip())
except Exception as e:
    print("[FAIL] Error:", str(e)[:200])

# ---------------------------------------------------------
# 2. Groq -- Llama 3.3 70B
# ---------------------------------------------------------
separator("2. Groq (llama-3.3-70b-versatile)")
try:
    from groq import Groq
    key = os.environ.get("GROQ_API_KEY", "")
    if not key or key == "your_groq_api_key_here":
        print("[!] GROQ_API_KEY not set in .env")
        print("    Get free key at: https://console.groq.com")
    else:
        client = Groq(api_key=key)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": TEST_PROMPT}],
            max_tokens=100,
        )
        print("[OK] Success:", response.choices[0].message.content.strip())
except Exception as e:
    print("[FAIL] Error:", str(e)[:200])

# ---------------------------------------------------------
# 3. Groq -- Gemma2 9B
# ---------------------------------------------------------
separator("3. Groq (llama-3.1-8b-instant)")
try:
    from groq import Groq
    key = os.environ.get("GROQ_API_KEY", "")
    if not key or key == "your_groq_api_key_here":
        print("[!] GROQ_API_KEY not set in .env (same key as above)")
    else:
        client = Groq(api_key=key)
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": TEST_PROMPT}],
            max_tokens=100,
        )
        print("[OK] Success:", response.choices[0].message.content.strip())
except Exception as e:
    print("[FAIL] Error:", str(e)[:200])

# ---------------------------------------------------------
# 4. Cohere
# ---------------------------------------------------------
separator("4. Cohere (command-nightly)")
try:
    import cohere
    key = os.environ.get("COHERE_API_KEY", "")
    if not key or key == "your_cohere_api_key_here":
        print("[!] COHERE_API_KEY not set in .env")
        print("    Get free key at: https://dashboard.cohere.com")
    else:
        client = cohere.ClientV2(api_key=key)
        response = client.chat(
            model="command-r",
            messages=[{"role": "user", "content": TEST_PROMPT}],
        )
        print("[OK] Success:", response.message.content[0].text.strip())
except Exception as e:
    print("[FAIL] Error:", str(e)[:200])

# ---------------------------------------------------------
# 5. HuggingFace
# ---------------------------------------------------------
separator("5. HuggingFace (Qwen2.5-72B-Instruct)")
try:
    from huggingface_hub import InferenceClient
    key = os.environ.get("HUGGINGFACE_API_KEY", "")
    if not key or key == "your_huggingface_api_key_here":
        print("[!] HUGGINGFACE_API_KEY not set in .env")
        print("    Get free key at: https://huggingface.co/settings/tokens")
    else:
        client = InferenceClient(api_key=key)
        response = client.chat.completions.create(
            model="Qwen/Qwen2.5-72B-Instruct",
            messages=[{"role": "user", "content": TEST_PROMPT}],
            max_tokens=100,
        )
        print("[OK] Success:", response.choices[0].message.content.strip())
except Exception as e:
    print("[FAIL] Error:", str(e)[:200])

# ---------------------------------------------------------
# 6. Full LLMManager fallback test
# ---------------------------------------------------------
separator("6. Full LLMManager Fallback Test")
try:
    from llm_manager import llm_manager
    available = llm_manager.get_available_providers()
    print(f"Available providers: {available}")
    if available:
        response_text, provider_used = llm_manager.generate(
            system_prompt="You are a helpful assistant.",
            contents=[],
            user_input=TEST_PROMPT,
        )
        print(f"[OK] Response from [{provider_used}]: {response_text.strip()[:120]}")
    else:
        print("[!] No providers available. Add API keys to .env first.")
except Exception as e:
    print("[FAIL] Error:", str(e)[:300])

print(f"\n{'='*55}")
print("  Test complete!")
print('='*55)
