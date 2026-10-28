import asyncio

from app.core.llm_provider import get_embeddings_model
from app.db.pool import get_pool


async def retrieve_relevant_chunks(query: str, top_k: int = 4) -> list[dict]:
    """
    Returns [] gracefully if knowledge_base_chunks is empty (e.g. before
    seed_kb.py has been run) — the chatbot falls back to the LLM's general
    knowledge rather than failing.
    """
    embeddings = get_embeddings_model()
    query_vector = await _embed(embeddings, query)

    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT source, content, 1 - (embedding <=> $1) AS similarity
            FROM knowledge_base_chunks
            ORDER BY embedding <=> $1
            LIMIT $2
            """,
            query_vector,
            top_k,
        )

    return [
        {"source": r["source"], "content": r["content"], "score": float(r["similarity"])}
        for r in rows
    ]


async def _embed(embeddings, text: str) -> list[float]:
    # LangChain's embedding classes are synchronous — offload to a thread
    # so a slow local embedding call doesn't block the event loop.
    return await asyncio.to_thread(embeddings.embed_query, text)
