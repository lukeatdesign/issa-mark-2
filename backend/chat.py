"""
Core chat logic: system prompt construction + Claude API calls.
"""
import os
import json
import anthropic

MODEL = "claude-sonnet-4-20250514"


def build_system_prompt(user_profile: dict, roadmap_progress: dict, memory_facts: list[dict]) -> str:
    profile_json = json.dumps(user_profile, indent=2)
    roadmap_json = json.dumps(roadmap_progress, indent=2)

    memory_section = ""
    if memory_facts:
        facts_text = "\n".join(
            f"- [{f['memory_type']}] {f['content']}" for f in memory_facts
        )
        memory_section = f"\nKnown facts about this user from previous sessions:\n{facts_text}\n"

    return f"""You are Compass, an expert Thailand immigration assistant built by Issa Compass.
You are empathetic, clear, and honest. You help immigrants navigate working legally in Thailand.

User profile:
{profile_json}

Current roadmap progress:
{roadmap_json}
{memory_section}
Guidelines:
- Respond with empathy and clarity adapted to the user's persona and situation.
- When answering procedural questions, cite the relevant Thai law or regulation when possible \
(e.g. Alien Working Act B.E. 2551, Immigration Act B.E. 2522).
- Never fabricate visa rules or processing times. If uncertain, say so clearly and \
direct the user to official sources (dol.go.th, boi.go.th, immigration.go.th).
- Never give legal advice — recommend consulting a licensed Thai immigration lawyer \
for complex legal situations.
- At the end of each response, include a JSON block with 3 suggested follow-up questions:
  <followups>["Question 1?", "Question 2?", "Question 3?"]</followups>
- If the user message is exactly "__welcome__", do not treat it as a question. \
Instead, open the conversation as a warm, professional visa consultant. \
Greet the user based on their nationality, work type, and current visa status from the profile above. \
Name the immigration path you will be helping them with. Keep it under 4 sentences. \
Invite them to ask their first question. Speak simply and clearly. Do not mention the word "roadmap".
"""


def chat(
    messages: list[dict],
    user_profile: dict,
    roadmap_progress: dict,
    memory_facts: list[dict],
    kb_answer: dict | None = None,
) -> tuple[str, list[str]]:
    """
    Call Claude and return (reply_text, suggested_followups).
    messages: list of {"role": "user"|"assistant", "content": str}
    """
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    system = build_system_prompt(user_profile, roadmap_progress, memory_facts)

    if kb_answer:
        system += (
            f"\n\nA consultant-approved answer exists for a similar question:\n"
            f"Q: {kb_answer.get('question', '')}\n"
            f"A: {kb_answer.get('canonical_answer', '')}\n"
            f"Incorporate this authoritative answer in your response."
        )

    response = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        system=system,
        messages=messages,
    )
    full_text = response.content[0].text

    # Extract suggested followups from <followups>...</followups> tag
    followups = []
    if "<followups>" in full_text and "</followups>" in full_text:
        start = full_text.index("<followups>") + len("<followups>")
        end = full_text.index("</followups>")
        try:
            followups = json.loads(full_text[start:end].strip())
        except Exception:
            followups = []
        full_text = (full_text[:full_text.index("<followups>")] + full_text[full_text.index("</followups>") + len("</followups>"):]).strip()

    return full_text, followups


def generate_correction(original_question: str, original_answer: str) -> str:
    """Re-generate an answer with a correction prompt."""
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    response = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        system=(
            "You are a Thailand immigration expert. The user flagged the following answer as "
            "incorrect or unhelpful. Provide a [CORRECTION ATTEMPT] with a better, more accurate answer. "
            "Be specific and cite official sources where possible."
        ),
        messages=[
            {"role": "user", "content": f"Original question: {original_question}\n\nOriginal answer: {original_answer}\n\nPlease provide a corrected answer."},
        ],
    )
    return response.content[0].text
