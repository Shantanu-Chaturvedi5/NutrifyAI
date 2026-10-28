"""
In-process embeddings — no external server required.

Groq has no embeddings endpoint, and Ollama (the old fallback) requires
a separate long-running server process that most deployment targets (a
single container on a PaaS, a serverless function, etc.) can't host
alongside this service. fastembed runs a small ONNX model directly in
this process instead — no server, no network call, no GPU — so it works
identically on a laptop and in production.

The model (~130MB) downloads once to a local cache on first use. For
production, pre-warm this in the Dockerfile (run a one-line script that
instantiates TextEmbedding() during the build) so the first real request
isn't the one paying for the download — ask if you want that added.
"""

from functools import lru_cache


class LocalEmbeddings:
    """Drop-in replacement for a LangChain Embeddings object — exposes
    embed_query() / embed_documents() with the same signatures used by
    app/rag/retriever.py, so nothing calling get_embeddings_model() needs
    to change."""

    def __init__(self, model_name: str = "BAAI/bge-small-en-v1.5"):
        self.model_name = model_name

    @property
    def _model(self):
        return _load_model(self.model_name)

    def embed_query(self, text: str) -> list[float]:
        return next(self._model.embed([text])).tolist()

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [v.tolist() for v in self._model.embed(texts)]


@lru_cache(maxsize=1)
def _load_model(model_name: str):
    from fastembed import TextEmbedding

    return TextEmbedding(model_name=model_name)