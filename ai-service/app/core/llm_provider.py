"""
LLM provider abstraction.

Every feature that needs a chat model or an embedding model (chatbot,
report analyzer, diet planner, nutrition twin, RAG retriever) should call
get_chat_model() / get_embeddings_model() from here — never import a
provider's client class directly in a service module. That's what makes
switching providers a one-line env change instead of a code change.

Three chat providers, all free-tier friendly:
  - "ollama": self-hosted, unlimited, private, weakest reasoning
  - "groq":   free hosted tier, fast, much stronger open models
              (openai/gpt-oss-120b) than anything practical to self-host
              on a laptop — the best "free but good" default for a
              public demo
  - "openai": paid, strongest reasoning, use per-feature if you need it

Every LangChain chat model class here exposes the same .invoke() /
.stream() interface, so calling code doesn't need to know which provider
it got.

Usage:
    from app.core.llm_provider import get_chat_model

    llm = get_chat_model()
    response = llm.invoke("Can I eat oats with diabetes?")

Per-feature override (e.g. force Groq for the chatbot specifically,
regardless of the global default) — pass an explicit provider:
    llm = get_chat_model(provider="groq")
"""

from functools import lru_cache
from typing import Literal

from app.core.config import settings

Provider = Literal["ollama", "groq", "openai"]


def _resolve_provider(provider: Provider | None) -> Provider:
    resolved = provider or settings.LLM_PROVIDER
    if resolved not in ("ollama", "groq", "openai"):
        raise ValueError(
            f"Unknown LLM_PROVIDER '{resolved}'. Expected 'ollama', 'groq', or 'openai'."
        )
    if resolved == "groq" and not settings.GROQ_API_KEY:
        raise ValueError(
            "LLM_PROVIDER is 'groq' but GROQ_API_KEY is not set in .env. "
            "Get a free key at https://console.groq.com/keys"
        )
    if resolved == "openai" and not settings.OPENAI_API_KEY:
        raise ValueError(
            "LLM_PROVIDER is 'openai' but OPENAI_API_KEY is not set in .env."
        )
    return resolved


@lru_cache(maxsize=8)
def get_chat_model(provider: Provider | None = None, temperature: float = 0.3):
    resolved = _resolve_provider(provider)

    if resolved == "ollama":
        from langchain_community.chat_models import ChatOllama

        return ChatOllama(
            model=settings.OLLAMA_MODEL,
            base_url=settings.OLLAMA_BASE_URL,
            temperature=temperature,
        )

    if resolved == "groq":
        from langchain_openai import ChatOpenAI

        # Groq's API is OpenAI-compatible — same client, different base_url.
        return ChatOpenAI(
            model=settings.GROQ_MODEL,
            api_key=settings.GROQ_API_KEY,
            base_url=settings.GROQ_BASE_URL,
            temperature=temperature,
        )

    from langchain_openai import ChatOpenAI

    return ChatOpenAI(
        model=settings.OPENAI_MODEL,
        api_key=settings.OPENAI_API_KEY,
        temperature=temperature,
    )


@lru_cache(maxsize=4)
def get_embeddings_model(provider: Provider | None = None):
    resolved = _resolve_provider(provider)

    # Groq has no embeddings endpoint. This used to fall back to a
    # self-hosted Ollama server, but that only works on a machine that
    # actually has Ollama running — it breaks in any real deployment
    # (a cloud container has no Ollama process to reach). Instead, Groq
    # now uses a small ONNX embedding model that runs in-process, right
    # inside this container: no external server, no network call, works
    # identically on a laptop and in production. See
    # app/core/embeddings_local.py.
    if resolved == "groq":
        from app.core.embeddings_local import LocalEmbeddings

        return LocalEmbeddings()

    if resolved == "ollama":
        from langchain_community.embeddings import OllamaEmbeddings

        return OllamaEmbeddings(
            model=settings.OLLAMA_EMBED_MODEL,
            base_url=settings.OLLAMA_BASE_URL,
        )

    from langchain_openai import OpenAIEmbeddings

    return OpenAIEmbeddings(
        model=settings.OPENAI_EMBED_MODEL,
        api_key=settings.OPENAI_API_KEY,
    )