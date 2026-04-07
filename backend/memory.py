"""
Persistent memory extraction from chat turns.
Runs as a background thread after each assistant response.
"""
import os
import json
import threading
import anthropic
from supabase import create_client


def _get_clients():
    sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
    ai = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    return sb, ai


EXTRACTION_PROMPT = """\
You are a memory extractor for an immigration assistant app.

Given the following conversation turn between a user and an AI assistant, extract any
structured facts worth remembering about the user.

Return a JSON array (may be empty). Each item:
{
  "memory_type": "fact" | "preference" | "concern",
  "content": "one-sentence summary of what was learned",
  "confidence": 0.0–1.0
}

Only extract things that are durable and useful for future sessions.
Do NOT extract things already obvious from the user's profile quiz answers.

<user_message>{user_message}</user_message>
<assistant_message>{assistant_message}</assistant_message>

Return ONLY the JSON array, no other text."""


def extract_and_store(user_id: str, user_message: str, assistant_message: str):
    """Fire-and-forget: extract memory facts and store them in Supabase."""
    thread = threading.Thread(
        target=_run_extraction,
        args=(user_id, user_message, assistant_message),
        daemon=True,
    )
    thread.start()


def _run_extraction(user_id: str, user_message: str, assistant_message: str):
    try:
        sb, ai = _get_clients()
        prompt = EXTRACTION_PROMPT.format(
            user_message=user_message,
            assistant_message=assistant_message,
        )
        response = ai.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=512,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = response.content[0].text.strip()
        facts = json.loads(raw)
        if not isinstance(facts, list):
            return
        rows = [
            {
                "user_id": user_id,
                "memory_type": f.get("memory_type", "fact"),
                "content": f.get("content", ""),
                "source": "inferred",
                "confidence": float(f.get("confidence", 0.8)),
            }
            for f in facts
            if f.get("content")
        ]
        if rows:
            sb.table("user_memory").insert(rows).execute()
    except Exception:
        pass  # Memory extraction is best-effort


def load_user_memory(user_id: str) -> list[dict]:
    """Load all stored memory facts for a user."""
    sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
    result = (
        sb.table("user_memory")
        .select("memory_type, content, confidence")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(30)
        .execute()
    )
    return result.data or []
