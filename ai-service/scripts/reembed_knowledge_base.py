"""
Re-embed every row in knowledge_base_chunks with the current embedding
model (fastembed / BAAI/bge-small-en-v1.5, 384 dims), after the column
was resized from vector(768) (Ollama nomic-embed-text) to vector(384).

Standalone by design: there's no existing ingestion script to reuse here,
so this connects to Postgres directly, pulls every row's `content`, and
updates `embedding` in place. It does NOT touch `content` or any other
column, and does not re-chunk anything - it assumes the rows and their
text are already correct and only the vectors are stale/wrong-dimension.

Run from inside the ai-service container:

    docker compose exec ai-service python scripts/reembed_knowledge_base.py

Safe to re-run: it just overwrites embedding for every row again.
"""

import asyncio
import sys

import asyncpg

sys.path.insert(0, "/app")  # match container layout so `app.*` imports resolve

from app.core.config import settings  # noqa: E402
from app.core.embeddings_local import LocalEmbeddings  # noqa: E402

TABLE = "knowledge_base_chunks"
BATCH_SIZE = 64  # rows per embed+update batch


def vector_literal(vec: list[float]) -> str:
    """pgvector's text input format, e.g. '[0.123,-0.456,...]'. Passed as
    a plain string and cast with ::vector in SQL - avoids needing to
    register a custom asyncpg type codec for the vector type."""
    return "[" + ",".join(repr(x) for x in vec) + "]"


async def main() -> None:
    embeddings = LocalEmbeddings()  # BAAI/bge-small-en-v1.5, 384 dims

    conn = await asyncpg.connect(settings.DATABASE_URL)
    try:
        total = await conn.fetchval(f"SELECT count(*) FROM {TABLE}")
        print(f"Re-embedding {total} rows in {TABLE} with "
              f"'{embeddings.model_name}' (384 dims)...")

        rows = await conn.fetch(f"SELECT id, content FROM {TABLE} ORDER BY id")

        done = 0
        for i in range(0, len(rows), BATCH_SIZE):
            batch = rows[i : i + BATCH_SIZE]
            texts = [r["content"] for r in batch]
            vectors = embeddings.embed_documents(texts)

            async with conn.transaction():
                for row, vec in zip(batch, vectors):
                    await conn.execute(
                        f"UPDATE {TABLE} SET embedding = $1::vector WHERE id = $2",
                        vector_literal(vec),
                        row["id"],
                    )

            done += len(batch)
            print(f"  {done}/{total}")

        print("Done. Re-run the chatbot query that was failing to confirm "
              "the dimension-mismatch error is gone.")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
