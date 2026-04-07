from flask import Flask, request, jsonify
from anthropic import Anthropic
from dotenv import load_dotenv
from werkzeug.security import check_password_hash, generate_password_hash
import os
import uuid
import requests
import json
import traceback

load_dotenv(override=True)

app = Flask(__name__)
from flask_cors import CORS
CORS(app)
client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

def supabase_headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }

DEFAULT_SYSTEM_PROMPT = (
    "You are Compass, an expert Thailand immigration assistant built by Issa Compass. "
    "You are empathetic, clear, and honest. You help immigrants navigate working legally in Thailand. "
    "When answering procedural questions, cite the relevant Thai law or regulation where possible. "
    "Never fabricate visa rules or processing times — if uncertain, say so and direct the user to "
    "official sources (dol.go.th, boi.go.th, immigration.go.th). "
    "Never give legal advice; recommend a licensed Thai immigration lawyer for complex situations."
)

def get_prompt():
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/ai_prompts?order=id.desc&limit=1",
            headers=supabase_headers(),
            timeout=5,
        )
        data = response.json()
        if isinstance(data, list) and data:
            return data[0]["prompt"]
    except Exception:
        pass
    return DEFAULT_SYSTEM_PROMPT

def save_prompt(new_prompt):
    requests.post(
        f"{SUPABASE_URL}/rest/v1/ai_prompts",
        headers=supabase_headers(),
        json={"prompt": new_prompt}
    )

@app.route('/')
def hello():
    return 'Issa Compass AI Server is running!'

@app.route('/get-prompt', methods=['GET'])
def get_current_prompt():
    prompt = get_prompt()
    return jsonify({'prompt': prompt})

@app.route('/generate-reply', methods=['POST'])
def generate_reply():
    try:
        data = request.json
        client_message = data.get('clientSequence', '')
        chat_history = data.get('chatHistory', [])
        quiz_answers = data.get('quizAnswers') or {}

        system_prompt = get_prompt()
        quiz_context = build_quiz_context(quiz_answers)
        if quiz_context:
            system_prompt = (
                system_prompt
                + quiz_context
                + "\n\nThe user completed the onboarding quiz; every line above under "
                "\"VERIFIED CONTEXT\" is confirmed. Treat it as ground truth. Do not ask them to "
                "repeat or re-confirm those facts (including job offer status, nationality, current "
                "visa, urgency, work type, or purpose). Continue as if you already know this "
                "unless they explicitly correct something."
            )

        messages = []
        for msg in chat_history:
            role = 'assistant' if msg['role'] == 'consultant' else 'user'
            messages.append({'role': role, 'content': msg['content']})
        messages.append({'role': 'user', 'content': client_message})

        response = client.messages.create(
            model='claude-opus-4-5',
            max_tokens=1024,
            system=system_prompt,
            messages=messages
        )

        return jsonify({'aiReply': response.content[0].text})

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/improve-ai', methods=['POST'])
def improve_ai():
    data = request.json
    client_message = data.get('clientSequence', '')
    chat_history = data.get('chatHistory', [])
    consultant_reply = data.get('consultantReply', '')

    current_prompt = get_prompt()

    messages = []
    for msg in chat_history:
        role = 'assistant' if msg['role'] == 'consultant' else 'user'
        messages.append({'role': role, 'content': msg['content']})
    messages.append({'role': 'user', 'content': client_message})

    predicted = client.messages.create(
        model='claude-opus-4-5',
        max_tokens=1024,
        system=current_prompt,
        messages=messages
    )
    predicted_reply = predicted.content[0].text

    editor_prompt = f"""You are an AI prompt editor. Compare these two replies and improve the system prompt.

CURRENT SYSTEM PROMPT:
{current_prompt}

CLIENT MESSAGE:
{client_message}

PREDICTED AI REPLY:
{predicted_reply}

REAL CONSULTANT REPLY:
{consultant_reply}

IMPORTANT: You must respond with ONLY a JSON object. No analysis, no explanation, no markdown. Just this exact format: {{"prompt": "updated prompt here"}}"""

    editor_response = client.messages.create(
        model='claude-opus-4-5',
        max_tokens=4096,
        messages=[{'role': 'user', 'content': editor_prompt}]
    )

    clean = editor_response.content[0].text.replace('```json', '').replace('```', '').strip()
    updated = json.loads(clean)
    new_prompt = updated['prompt']
    save_prompt(new_prompt)

    return jsonify({
        'predictedReply': predicted_reply,
        'updatedPrompt': new_prompt
    })

@app.route('/improve-ai-manually', methods=['POST'])
def improve_ai_manually():
    data = request.json
    instructions = data.get('instructions', '')
    current_prompt = get_prompt()

    editor_prompt = f"""You are an AI prompt editor.

CURRENT PROMPT:
{current_prompt}

INSTRUCTIONS TO APPLY:
{instructions}

Update the prompt based on these instructions.
Return ONLY valid JSON like this: {{"prompt": "updated prompt here"}}"""

    response = client.messages.create(
        model='claude-opus-4-5',
        max_tokens=2048,
        messages=[{'role': 'user', 'content': editor_prompt}]
    )

    clean = response.content[0].text.replace('```json', '').replace('```', '').strip()
    updated = json.loads(clean)
    new_prompt = updated['prompt']
    save_prompt(new_prompt)

    return jsonify({'updatedPrompt': new_prompt})


@app.route('/test-roadmap', methods=['GET'])
def test_roadmap():
    return jsonify({'status': 'ok'})


INTENT_LABELS = {
    'work_company': 'working for a Thai company',
    'work_remote': 'working remotely for a foreign company with Thai presence',
    'own_business': 'starting their own business in Thailand',
    'exploring': 'exploring visa options',
}
WORK_TYPE_LABELS = {
    'manual': 'manual / factory / construction work',
    'professional': 'professional / office / technical work',
    'creative': 'creative / freelance / digital work',
}
JOB_OFFER_LABELS = {
    'yes_thai': 'has a confirmed job offer from a Thai company',
    'yes_foreign': 'has a confirmed job offer from a foreign company with Thai presence',
    'no': 'does not have a job offer yet',
    'self_employed': 'is self-employed or freelancing',
}
VISA_LABELS = {
    'none': 'not yet in Thailand',
    'tourist': 'currently on a tourist visa or visa-exempt entry',
    'non_b': 'already holds a Non-B (Business) visa',
    'other': 'on another type of visa',
}
URGENCY_LABELS = {
    'exploring': 'no immediate deadline — just exploring',
    'planning': 'planning to move within 1–3 months',
    'urgent': 'needs to resolve this within 1 month (urgent)',
}

def build_quiz_context(quiz_answers: dict) -> str:
    if not quiz_answers:
        return ""
    lines = []
    if quiz_answers.get('nationality'):
        lines.append(f"- Nationality: {quiz_answers['nationality']}")
    if quiz_answers.get('intent'):
        lines.append(f"- Purpose: {INTENT_LABELS.get(quiz_answers['intent'], quiz_answers['intent'])}")
    if quiz_answers.get('work_type'):
        lines.append(f"- Work type: {WORK_TYPE_LABELS.get(quiz_answers['work_type'], quiz_answers['work_type'])}")
    if quiz_answers.get('has_job_offer'):
        lines.append(f"- Job offer: {JOB_OFFER_LABELS.get(quiz_answers['has_job_offer'], quiz_answers['has_job_offer'])}")
    if quiz_answers.get('current_visa'):
        lines.append(f"- Current visa status: {VISA_LABELS.get(quiz_answers['current_visa'], quiz_answers['current_visa'])}")
    if quiz_answers.get('urgency'):
        lines.append(f"- Urgency: {URGENCY_LABELS.get(quiz_answers['urgency'], quiz_answers['urgency'])}")
    if quiz_answers.get('notes'):
        lines.append(f"- Additional context from user: {quiz_answers['notes']}")
    if not lines:
        return ""
    return "\n\nVERIFIED CONTEXT FROM ONBOARDING QUIZ (treat as ground truth — do not contradict):\n" + "\n".join(lines)


@app.route('/generate-roadmap', methods=['POST'])
def generate_roadmap():
    try:
        data = request.json
        chat_history = data.get('chatHistory', [])
        quiz_answers = data.get('quizAnswers', {})
        print(f"[generate-roadmap] received {len(chat_history)} messages, quiz keys: {list(quiz_answers.keys())}")

        quiz_context = build_quiz_context(quiz_answers)

        # Not an f-string: the JSON example below contains { } which must stay literal.
        system_prompt = (
            """You are an immigration roadmap generator. \
Based on a conversation between a user and an immigration assistant, extract the user's situation \
and generate a structured to-do list in JSON format."""
            + quiz_context
            + """

When quiz context is provided above, use it as authoritative ground truth. \
The chat may add nuance but should not override quiz-verified facts like nationality or job offer status.

Field definitions:
- status: "available" (can start now), "blocked" (waiting on something else first — name it in blockedBy), "in_progress" (already underway)
- priority: "urgent" (must complete in first 2 weeks), "high" (weeks 2-4), "normal" (can wait)
- subtasks: 2-4 concrete numbered steps the person must take to complete this task
- canAutomate: true if a service or the Issa app can handle this step for the user
- automationHint: short string like "Issa handles this" or "Upload doc in app" if canAutomate is true, else null
- blockedBy: short string naming what must come first, e.g. "Employer documents" — only set if status is "blocked"
- done: always false initially

Prioritisation rules:
- Mark tasks the user can do immediately without waiting for anyone as status "available"
- If a task depends on employer action completing first, mark it status "blocked"
- Assign priority "urgent" to anything that must be done in the first 2 weeks given the user's timeline
- Ensure logical dependency ordering — user tasks that depend on employer tasks should reference blockedBy

Return ONLY valid JSON, no markdown, no explanation:
{
  "userName": "name if mentioned, else null",
  "visaType": "Non-B or other detected type",
  "timeline": "e.g. 6 weeks",
  "estimatedDays": 42,
  "userTasks": [
    {
      "id": 1,
      "task": "Short task title",
      "detail": "One sentence explaining what this is and why it matters",
      "subtasks": ["Step 1 — specific action", "Step 2 — specific action"],
      "canAutomate": false,
      "automationHint": null,
      "status": "available",
      "priority": "urgent",
      "blockedBy": null,
      "done": false
    }
  ],
  "employerTasks": [
    {
      "id": 1,
      "task": "Short task title",
      "detail": "One sentence explaining what this is and why it matters",
      "subtasks": ["Step 1", "Step 2"],
      "canAutomate": false,
      "automationHint": null,
      "status": "in_progress",
      "priority": "high",
      "blockedBy": null,
      "done": false
    }
  ]
}"""
        )

        messages = []
        for msg in chat_history:
            role = 'assistant' if msg['role'] == 'consultant' else 'user'
            messages.append({'role': role, 'content': msg['content']})

        # Anthropic requires at least one user message
        if not messages or messages[-1]['role'] != 'user':
            messages.append({'role': 'user', 'content': 'Generate my immigration roadmap based on our conversation.'})

        print(f"[generate-roadmap] sending {len(messages)} messages to Claude")

        response = client.messages.create(
            model='claude-opus-4-5',
            max_tokens=2048,
            system=system_prompt,
            messages=messages,
        )

        raw = response.content[0].text
        print(f"[generate-roadmap] raw response: {raw[:200]}")

        clean = raw.replace('```json', '').replace('```', '').strip()
        roadmap = json.loads(clean)
        return jsonify(roadmap)

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/generate-overview', methods=['POST'])
def generate_overview():
    try:
        data = request.json
        roadmap = data.get('roadmap', {})
        print(f"[generate-overview] hit — userName={roadmap.get('userName')} visaType={roadmap.get('visaType')}")

        overview_instruction = (
            "You are writing a warm, personal 2-3 sentence summary of a visa applicant's current situation. "
            "Use only the data provided — their name, visa type, timeline, how many tasks they've completed, "
            "and what their next priority task is. Sound like a trusted friend giving a quick honest update. "
            "Never use bullet points. Never use jargon without explaining it. Never mention the word 'roadmap'."
        )

        response = client.messages.create(
            model='claude-opus-4-5',
            max_tokens=256,
            system=overview_instruction,
            messages=[{
                'role': 'user',
                'content': f"Here is the applicant's current data: {json.dumps(roadmap)}"
            }]
        )

        summary = response.content[0].text
        print(f"[generate-overview] success — {len(summary)} chars")
        return jsonify({'summary': summary})

    except Exception as e:
        traceback.print_exc()
        print(f"[generate-overview] ERROR: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.json or {}
        username = (data.get('username') or '').strip().lower()
        password = data.get('password') or ''

        if not username or not password:
            return jsonify({'error': 'Username and password required'}), 400
        if len(username) < 3:
            return jsonify({'error': 'Username must be at least 3 characters'}), 400
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400

        # Check for existing username
        check = requests.get(
            f"{SUPABASE_URL}/rest/v1/mock_users?username=eq.{username}&select=username",
            headers=supabase_headers(),
        )
        print(f"[register] duplicate check status={check.status_code} body={check.text[:200]}")
        if check.ok and check.json():
            return jsonify({'error': 'Username already taken'}), 409

        # Create user
        password_hash = generate_password_hash(password)
        create = requests.post(
            f"{SUPABASE_URL}/rest/v1/mock_users",
            headers=supabase_headers(),
            json={'username': username, 'password_hash': password_hash},
        )
        print(f"[register] create user status={create.status_code} body={create.text[:200]}")
        if not create.ok:
            return jsonify({'error': f'Could not create user: {create.text}'}), 500

        # Create session
        token = str(uuid.uuid4())
        sess = requests.post(
            f"{SUPABASE_URL}/rest/v1/mock_sessions",
            headers=supabase_headers(),
            json={'token': token, 'username': username},
        )
        print(f"[register] create session status={sess.status_code} body={sess.text[:200]}")
        if not sess.ok:
            return jsonify({'error': f'Could not create session: {sess.text}'}), 500

        return jsonify({'token': token, 'username': username}), 201

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/login', methods=['POST'])
def login():
    data = request.json or {}
    username = (data.get('username') or '').strip().lower()
    password = data.get('password') or ''

    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400

    resp = requests.get(
        f"{SUPABASE_URL}/rest/v1/mock_users?username=eq.{username}&select=username,password_hash",
        headers=supabase_headers(),
    )
    print(f"[login] Supabase status={resp.status_code} body={resp.text[:200]}")
    users = resp.json() if resp.ok else []
    if not users:
        print(f"[login] No user found for username='{username}'")
        return jsonify({'error': 'Invalid credentials'}), 401

    if not check_password_hash(users[0]['password_hash'], password):
        print(f"[login] Password mismatch for username='{username}'")
        return jsonify({'error': 'Invalid credentials'}), 401

    token = str(uuid.uuid4())
    requests.post(
        f"{SUPABASE_URL}/rest/v1/mock_sessions",
        headers=supabase_headers(),
        json={'token': token, 'username': username},
    )

    return jsonify({'token': token, 'username': username})


@app.route('/logout', methods=['POST'])
def logout():
    auth = request.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        token = auth.split(' ', 1)[1]
        requests.delete(
            f"{SUPABASE_URL}/rest/v1/mock_sessions?token=eq.{token}",
            headers=supabase_headers(),
        )
    return jsonify({'ok': True})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
