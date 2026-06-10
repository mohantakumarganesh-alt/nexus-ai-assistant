"""
llm_manager.py — Multi-LLM Provider Manager with Auto-Fallback

Tries providers in order of priority. If a provider hits a rate limit (429)
or is unavailable (503), it automatically falls back to the next provider.
This maximizes total free usage across all APIs.

Provider Priority:
  1. Google Gemini (gemini-2.5-flash)   — ~500 req/day free
  2. Groq (llama-3.3-70b-versatile)     — 14,400 req/day free 🔥
  3. Groq (gemma2-9b-it)               — 14,400 req/day free 🔥
  4. Cohere (command-r)                — 5,000 req/month free
  5. HuggingFace (Mistral-7B)          — ~300 req/day free
"""

import os
import time
import logging

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# Rate-limit error detection helpers
# ─────────────────────────────────────────────────────────────────────────────

RATE_LIMIT_KEYWORDS = [
    "429", "rate limit", "rate_limit", "resource_exhausted",
    "quota", "too many requests", "503", "unavailable",
    "overloaded", "capacity"
]

def _is_rate_limit_error(error_str: str) -> bool:
    """Return True if the error string indicates a rate limit or service unavailability."""
    lower = error_str.lower()
    return any(kw in lower for kw in RATE_LIMIT_KEYWORDS)


# ─────────────────────────────────────────────────────────────────────────────
# Base Provider Class
# ─────────────────────────────────────────────────────────────────────────────

class LLMProvider:
    """Abstract base class for all LLM providers."""

    name: str = "Unknown"
    model: str = ""

    def is_available(self) -> bool:
        """Check if the provider has a valid API key configured."""
        raise NotImplementedError

    def generate(self, system_prompt: str, contents: list, user_input: str) -> str:
        """
        Generate a response.

        Args:
            system_prompt: The system-level instruction.
            contents: Conversation history list of {'role', 'text'} dicts.
            user_input: The latest user message.

        Returns:
            Generated text response.

        Raises:
            Exception: On any error (rate limit errors will be caught by LLMManager).
        """
        raise NotImplementedError


# ─────────────────────────────────────────────────────────────────────────────
# Provider 1: Google Gemini
# ─────────────────────────────────────────────────────────────────────────────

class GeminiProvider(LLMProvider):
    name = "Google Gemini"
    model = "gemini-2.5-flash"

    def __init__(self):
        self._client = None
        api_key = os.environ.get("GEMINI_API_KEY", "")
        if api_key and api_key != "your_gemini_api_key_here":
            try:
                from google import genai
                self._client = genai.Client(api_key=api_key)
            except Exception as e:
                logger.warning(f"[Gemini] Failed to initialize client: {e}")

    def is_available(self) -> bool:
        return self._client is not None

    def generate(self, system_prompt: str, contents: list, user_input: str) -> str:
        # Build Gemini-format content list
        gemini_contents = []
        for i, msg in enumerate(contents):
            role = msg["role"]
            text = msg["text"]
            if role == "user" and i == 0:
                text = f"System: {system_prompt}\n\nUser: {text}"
            gemini_contents.append({"role": role, "parts": [{"text": text}]})

        # Add current user message
        if len(contents) == 0:
            current_text = f"System: {system_prompt}\n\nUser: {user_input}"
        else:
            current_text = user_input
        gemini_contents.append({"role": "user", "parts": [{"text": current_text}]})

        response = self._client.models.generate_content(
            model=self.model,
            contents=gemini_contents,
        )
        return response.text


# ─────────────────────────────────────────────────────────────────────────────
# Provider 2 & 3: Groq (multiple models)
# ─────────────────────────────────────────────────────────────────────────────

class GroqProvider(LLMProvider):

    def __init__(self, model: str, label: str):
        self.model = model
        self.name = f"Groq ({label})"
        self._client = None
        api_key = os.environ.get("GROQ_API_KEY", "")
        if api_key and api_key != "your_groq_api_key_here":
            try:
                from groq import Groq
                self._client = Groq(api_key=api_key)
            except Exception as e:
                logger.warning(f"[Groq] Failed to initialize client: {e}")

    def is_available(self) -> bool:
        return self._client is not None

    def generate(self, system_prompt: str, contents: list, user_input: str) -> str:
        messages = [{"role": "system", "content": system_prompt}]

        # Add conversation history
        for msg in contents:
            messages.append({
                "role": msg["role"],
                "content": msg["text"]
            })

        # Add current user message
        messages.append({"role": "user", "content": user_input})

        response = self._client.chat.completions.create(
            model=self.model,
            messages=messages,
            max_tokens=1024,
            temperature=0.7,
        )
        return response.choices[0].message.content


# ─────────────────────────────────────────────────────────────────────────────
# Provider 4: Cohere
# ─────────────────────────────────────────────────────────────────────────────

class CohereProvider(LLMProvider):
    name = "Cohere"
    model = "command-nightly"

    def __init__(self):
        self._client = None
        api_key = os.environ.get("COHERE_API_KEY", "")
        if api_key and api_key != "your_cohere_api_key_here":
            try:
                import cohere
                self._client = cohere.ClientV2(api_key=api_key)
            except Exception as e:
                logger.warning(f"[Cohere] Failed to initialize client: {e}")

    def is_available(self) -> bool:
        return self._client is not None

    def generate(self, system_prompt: str, contents: list, user_input: str) -> str:
        messages = [{"role": "system", "content": system_prompt}]

        for msg in contents:
            role = "user" if msg["role"] == "user" else "assistant"
            messages.append({"role": role, "content": msg["text"]})

        messages.append({"role": "user", "content": user_input})

        response = self._client.chat(
            model=self.model,
            messages=messages,
        )
        return response.message.content[0].text


# ─────────────────────────────────────────────────────────────────────────────
# Provider 5: HuggingFace Inference API
# ─────────────────────────────────────────────────────────────────────────────

class HuggingFaceProvider(LLMProvider):
    name = "HuggingFace (Qwen2.5-72B)"
    model = "Qwen/Qwen2.5-72B-Instruct"

    def __init__(self):
        self._client = None
        api_key = os.environ.get("HUGGINGFACE_API_KEY", "")
        if api_key and api_key != "your_huggingface_api_key_here":
            try:
                from huggingface_hub import InferenceClient
                # No explicit provider — let HuggingFace auto-route to working endpoint
                self._client = InferenceClient(api_key=api_key)
            except Exception as e:
                logger.warning(f"[HuggingFace] Failed to initialize client: {e}")

    def is_available(self) -> bool:
        return self._client is not None

    def generate(self, system_prompt: str, contents: list, user_input: str) -> str:
        messages = [{"role": "system", "content": system_prompt}]

        for msg in contents:
            role = "user" if msg["role"] == "user" else "assistant"
            messages.append({"role": role, "content": msg["text"]})

        messages.append({"role": "user", "content": user_input})

        response = self._client.chat.completions.create(
            model=self.model,
            messages=messages,
            max_tokens=1024,
        )
        return response.choices[0].message.content


# ─────────────────────────────────────────────────────────────────────────────
# LLMManager — Orchestrates Fallback
# ─────────────────────────────────────────────────────────────────────────────

class LLMManager:
    """
    Manages multiple LLM providers with automatic fallback.

    When a provider hits a rate limit or is unavailable, the next provider
    in the priority list is tried automatically. This maximizes total free
    API usage across all providers.
    """

    def __init__(self):
        self.providers: list[LLMProvider] = [
            GeminiProvider(),
            GroqProvider("llama-3.3-70b-versatile", "Llama 3.3 70B"),
            GroqProvider("llama-3.1-8b-instant", "Llama 3.1 8B"),
            CohereProvider(),
            HuggingFaceProvider(),
        ]

        available = [p.name for p in self.providers if p.is_available()]
        if available:
            logger.info(f"[LLMManager] Available providers: {', '.join(available)}")
        else:
            logger.warning("[LLMManager] No providers are available! Check your API keys in .env")

    def get_available_providers(self) -> list[str]:
        """Returns list of provider names that have valid API keys."""
        return [p.name for p in self.providers if p.is_available()]

    def generate(
        self,
        system_prompt: str,
        contents: list,
        user_input: str,
        max_retries_per_provider: int = 2
    ) -> tuple[str, str]:
        """
        Generate a response using the first available provider.
        Automatically falls back to the next provider on rate limit errors.

        Args:
            system_prompt: System instruction string.
            contents: Conversation history list of {'role', 'text'} dicts.
            user_input: The latest user message.
            max_retries_per_provider: Retries within each provider before fallback.

        Returns:
            Tuple of (response_text, provider_name_used)

        Raises:
            RuntimeError: If all providers fail or none are available.
        """
        last_error = None
        tried_providers = []

        for provider in self.providers:
            if not provider.is_available():
                continue

            tried_providers.append(provider.name)

            for attempt in range(max_retries_per_provider):
                try:
                    logger.info(f"[LLMManager] Trying {provider.name} (attempt {attempt + 1})")
                    response_text = provider.generate(system_prompt, contents, user_input)
                    logger.info(f"[LLMManager] ✅ Success with {provider.name}")
                    return response_text, provider.name

                except Exception as e:
                    error_str = str(e)
                    last_error = error_str
                    logger.warning(f"[LLMManager] ❌ {provider.name} failed: {error_str[:120]}")

                    if _is_rate_limit_error(error_str):
                        if attempt < max_retries_per_provider - 1:
                            # Brief wait before retry within same provider
                            time.sleep(1.5 ** attempt)
                            continue
                        else:
                            # Rate limited — move to next provider
                            logger.warning(f"[LLMManager] Rate limit hit on {provider.name}, trying next provider...")
                            break
                    else:
                        # Non-rate-limit error (e.g., bad request, invalid prompt) — stop retrying this provider
                        logger.error(f"[LLMManager] Non-recoverable error on {provider.name}: {error_str[:200]}")
                        break

        # All providers exhausted
        providers_str = ", ".join(tried_providers) if tried_providers else "none configured"
        if not tried_providers:
            raise RuntimeError(
                "No LLM providers are configured. Please add at least one API key to your .env file.\n"
                "  GEMINI_API_KEY  → https://aistudio.google.com/app/apikey\n"
                "  GROQ_API_KEY    → https://console.groq.com\n"
                "  COHERE_API_KEY  → https://dashboard.cohere.com\n"
                "  HUGGINGFACE_API_KEY → https://huggingface.co/settings/tokens"
            )

        raise RuntimeError(
            f"All providers exhausted ({providers_str}). Last error: {last_error}"
        )


# ─────────────────────────────────────────────────────────────────────────────
# Singleton instance (imported by app.py)
# ─────────────────────────────────────────────────────────────────────────────

llm_manager = LLMManager()
