import type { ChatMessage, ChatActiveTask, QuizAnswers } from "@/types";

const AI_DONE_RE =
  /\b(completed|finished|done|all set|good to go|successfully|next step|marked as|well done|congratulations)\b/i;

// ── General thread ────────────────────────────────────────────────────────────

export function deriveGeneralSuggestions(
  messages: ChatMessage[],
  quizAnswers: QuizAnswers
): string[] {
  const userCount  = messages.filter((m) => m.role === "user").length;
  const assistantCount = messages.filter((m) => m.role === "assistant").length;
  const intent     = quizAnswers.intent;
  const jobOffer   = quizAnswers.has_job_offer;

  // Right after welcome (or empty thread) — intent-aware starters
  if (assistantCount <= 1 && userCount === 0) {
    const byIntent: Record<string, string[]> = {
      work_company: [
        "What does my employer need to do to sponsor me?",
        "How long does the Non-B visa + work permit take?",
        "What documents will I need to prepare?",
      ],
      work_remote: [
        "Do I need a Thai work permit if I work for a foreign company?",
        "What's the difference between a tourist visa and a Non-B?",
        "What documents will I need?",
      ],
      own_business: [
        "What visa options are available if I'm starting a business?",
        "What are the minimum capital requirements?",
        "How long does the whole process take?",
      ],
      exploring: [
        "What are my main visa options for working in Thailand?",
        "What's the easiest route if I already have a job offer?",
        "How much does the whole process typically cost?",
      ],
    };
    return byIntent[intent ?? ""] ?? [
      "What are my visa options for working in Thailand?",
      "How long does the process typically take?",
      "What documents will I need?",
    ];
  }

  // Early conversation (1–3 user messages)
  if (userCount <= 3) {
    return [
      "How much does it cost in total?",
      jobOffer === "yes_thai" || jobOffer === "yes_foreign"
        ? "What does my employer need to submit?"
        : "Can I apply without a job offer?",
      "What are the risks of working before my permit is ready?",
    ];
  }

  // Mid conversation (4–7 user messages)
  if (userCount <= 7) {
    return [
      "What's the most common mistake people make?",
      "Can I bring my family while I'm on a work permit?",
      "What happens when my visa expires — can I renew it?",
    ];
  }

  // Deeper conversation
  return [
    "Can you create my personalised roadmap?",
    "What happens after I get my work permit?",
    "Are there any recent rule changes I should know about?",
  ];
}

// ── Task thread ───────────────────────────────────────────────────────────────

export function deriveTaskSuggestions(
  messages: ChatMessage[],
  task: ChatActiveTask
): string[] {
  const userCount = messages.filter((m) => m.role === "user").length;
  const subtasks  = task.subtasks ?? [];

  // Detect if AI suggests the overall task is done
  const lastAiText = messages
    .filter((m) => m.role === "assistant")
    .slice(-2)
    .map((m) => m.content)
    .join(" ");
  const aiSuggestsDone = userCount > 1 && AI_DONE_RE.test(lastAiText);

  if (aiSuggestsDone) {
    return [
      "What's the next task I should work on?",
      "Is there anything else I should double-check before moving on?",
      "Can you give me a quick summary of what I just completed?",
    ];
  }

  // Task just opened — first suggestions focus on the subtask steps
  if (userCount === 0) {
    const chips: string[] = [];
    if (subtasks.length > 0) {
      chips.push(
        `How do I ${subtasks[0].toLowerCase().replace(/\.$/, "")}?`
      );
    }
    chips.push("Walk me through all the steps in order");
    chips.push("What documents do I need for this?");
    if (task.canAutomate) {
      chips.push("What can Issa handle for me automatically?");
    }
    return chips.slice(0, 3);
  }

  // Progress through subtasks: every ~2 messages advance one step
  const subtaskIdx = Math.min(Math.floor(userCount / 2), subtasks.length - 1);
  const nextSubtask = subtasks[subtaskIdx + 1];

  const chips: string[] = [];

  if (nextSubtask) {
    chips.push(
      `What about — ${nextSubtask.toLowerCase().replace(/\.$/, "")}?`
    );
  }

  chips.push(
    "How long does this step typically take?",
    "What could go wrong here and how do I avoid it?",
    "Is this something my employer handles, or do I need to do it?",
    "What's the next task after this one?"
  );

  return chips.slice(0, 3);
}
