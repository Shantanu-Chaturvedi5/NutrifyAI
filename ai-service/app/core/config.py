from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Central config. Every value here is overridable via environment
    variable / .env — nothing below is meant to be hardcoded elsewhere.
    """

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- LLM provider switch ---
    # "ollama" (free, self-hosted), "groq" (free hosted tier, fast, better
    # quality than small local models), or "openai" (paid). See
    # app/core/llm_provider.py for how this is used.
    LLM_PROVIDER: str = "ollama"

    OLLAMA_BASE_URL: str = "http://host.docker.internal:11434"
    OLLAMA_MODEL: str = "llama3.1:8b"
    OLLAMA_EMBED_MODEL: str = "nomic-embed-text"

    # Groq: free tier at console.groq.com, no card required as of this
    # writing. OpenAI-compatible API — same client class, different
    # base_url. No embedding endpoint, so embeddings always fall back to
    # Ollama when this is the chat provider (see llm_provider.py).
    GROQ_API_KEY: str | None = None
    GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    OPENAI_API_KEY: str | None = None
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_EMBED_MODEL: str = "text-embedding-3-small"

    # --- Infra ---
    DATABASE_URL: str = "postgresql://nutrifyai:nutrifyai_dev_password@localhost:5432/nutrifyai"
    AI_SERVICE_INTERNAL_TOKEN: str = "change-me-in-.env"
    BACKEND_CORE_URL: str = "http://backend-core:8080/api/v1"

    AWS_ACCESS_KEY_ID: str | None = None
    AWS_SECRET_ACCESS_KEY: str | None = None
    AWS_REGION: str = "ap-south-1"
    AWS_S3_BUCKET: str = "nutrifyai-dev"

    # Shared with backend-core's S3Service local-disk fallback (same
    # default path, same Docker volume — see docker-compose.yml). Used
    # when a report was uploaded without real AWS credentials configured.
    LOCAL_STORAGE_PATH: str = "/app/data/uploads"


settings = Settings()