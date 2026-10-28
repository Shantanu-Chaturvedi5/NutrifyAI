from langchain_core.messages import HumanMessage, SystemMessage

from app.core.llm_provider import get_chat_model
from app.rag.retriever import retrieve_relevant_chunks

# Below this cosine-similarity score, a retrieved chunk is treated as
# unrelated noise rather than supplementary context — otherwise, on a
# question the tiny starter KB has nothing relevant for, we'd hand the
# model a barely-related snippet that could nudge it off track instead of
# just letting it answer from its own knowledge.
RELEVANCE_THRESHOLD = 0.65

SYSTEM_PROMPT = """You are NutrifyAI's assistant. You are a fully capable, \
general-purpose AI — like ChatGPT or Claude — and you answer the user's \
question directly using everything you know, not only nutrition topics. \
Never refuse or shrink an answer just because it falls outside nutrition; \
answer it the way any competent general assistant would.

Nutrition and health questions are where you have extra help: below, you \
may be given supplementary reference material retrieved from a small, \
growing knowledge base. Treat it as optional backup, never as a ceiling:
- If it's relevant, you can use it to sharpen or double-check a nutrition \
claim.
- If it's empty, irrelevant, or missing, that changes nothing — answer \
fully from your own knowledge exactly as you would anyway.
- Never say you "don't have information" on something just because it \
isn't in the reference material below.

The one place you should hold back: specific medical diagnosis, \
medication guidance, or acute symptoms. There, say plainly that you're not \
a doctor and recommend a qualified professional, rather than guessing.

If a user health context is given below, you can use it to personalize \
your answer — but never invent conditions, goals, or allergies that \
aren't listed there.

Reference material (optional — may be empty):
{context}

User health context (optional — may be empty): {health_context}
"""


async def get_reply(user_message: str, health_context: dict | None) -> tuple[str, list[dict]]:
    all_chunks = await retrieve_relevant_chunks(user_message)
    relevant_chunks = [c for c in all_chunks if c["score"] >= RELEVANCE_THRESHOLD]

    context_text = (
        "\n\n".join(f"[{c['source']}] {c['content']}" for c in relevant_chunks)
        if relevant_chunks
        else "(none retrieved — answer from your own knowledge)"
    )

    llm = get_chat_model()
    system = SYSTEM_PROMPT.format(
        context=context_text,
        health_context=health_context or "(not provided)",
    )

    response = llm.invoke([SystemMessage(content=system), HumanMessage(content=user_message)])
    reply = response.content if hasattr(response, "content") else str(response)

    # Only report chunks we actually judged relevant enough to use —
    # otherwise the frontend's "sources" display would show noise.
    return reply, relevant_chunks

