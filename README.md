# Wayfarer Submission — Built for Mo

---

## A Bit of Context

Honestly, I accepted this assignment without much belief that I could actually do it. I even texted to ask if it would be okay if I needed an entire month. (I ended up using around two weeks though.)

I started by reading the brief step by step, just to understand what it really meant and what I needed to do. Until at some point I just thought — let's see what I can do.

In the first few hours I tried to understand what vibe coding actually is. Then I found myself quite interested, and thought maybe someone who hasn't touched code in 10 years might be able to do this. That's when I shifted to think about the product more.

I came up with a few personas — I thought about my friend who sells roti from a pushcart (you'll meet him later), but I knew there would be too many nuances. I cut out digital nomads because their path felt too straightforward.

What I was looking for was someone who had the potential to go somewhere but was held back by something as solvable as a border. That's how I came up with Mo Rakat.

---

## Meet Mo Rakat (มรกต)

Mo is a 24-year-old UX designer from Cambodia with a job offer from a company in Bangkok. Skill is not an issue for her anymore as she already has an offer — but she is just worried. Would everything go smoothly? Would she really be able to proudly relocate to Bangkok?

Thai immigration is layered and document-heavy. I can't even imagine how difficult it is. Every question leads to three more. Every form asks for something you've never heard of.

I tried to build this product thinking about what Mo would need at each touchpoint.

**Fun fact:** I looked up a company list in Cambodia and found the first designer I came across. Her name is Mo Rakat. That's the origin of this persona's name. It actually means Emerald — and it's pronounced very similarly to its Thai equivalent "มรกต" (More-Ra-Kot).

---

## How I Reframed: Visa Companion

I tried to think about her user journey and what she actually needs at 11pm the night before her visa appointment. I read the assignment and believed a workable chatbot is not enough — both for the submission, and for Mo.

She needs someone who would be her companion through this slightly concerning journey. Someone to reassure her that everything is going to be fine because she is on the right track.

So I reframed the product around a journey:

**Onboarding quiz → Chat with personalized consultant → Personalized roadmap → Document checklist → Application status**

Each step exists because Mo needed it. The app won't just respond to a chat message — it knows her nationality, her job situation, her urgency, so that it can build her a roadmap and guide her step by step through each task. It checks in on her required documents and celebrates when she completes something, like a companion.

I know immigration can't be completed in a few minutes like Grab, but I tried to stick with that principle — to make it a series of interactions that are simple and easy enough to follow, almost like calling a ride each day. Getting even a little closer to that felt like the right goal.

---

## What I Built

| Feature | What it does |
|---|---|
| Landing page | Entry point — sign up or sign in |
| Onboarding quiz | 7-step quiz — captures nationality, intent, work type, job offer, visa status, urgency as verified ground truth |
| Dashboard overview | AI overview summary, next actions, document + status mini cards |
| Chat with consultant | Chat with personalized AI consultant, task panel, auto-welcome from quiz answers |
| Roadmap | AI-generated roadmap split into user tasks and employer tasks |
| Documents | Document checklist with progress tracking |
| Application status | 5-stage application timeline with celebration animations |
| Approved | Celebration screen — Mo made it! |

**A few design decisions worth noting:**

**The onboarding quiz as ground truth.**
Nationality, job offer status, current visa, and urgency are collected during onboarding to ensure the system has enough information to proceed to the roadmap and inject this information into any feature to make it personalized for the user.

**The roadmap separates "what Mo owns" from "what her employer owns".**
User tasks and employer tasks are generated as separate lists because one of the most confusing parts of immigration is not knowing which things are yours to handle. Each task has a status, priority level, subtasks, and a flag for things the app can handle on Mo's behalf.

**The AI consultant cites real sources and knows its limits.**
Responses reference Thai immigration authorities (dol.go.th, boi.go.th) where relevant. The system is designed to decline legal advice rather than guess. The AI prompt improves over time by comparing its replies against real consultant answers — each improvement is saved to Supabase and picked up on the next conversation.

**The Consultant View + Diff Visualization.**
There's a button at the top right of the chat page that opens a consultant overlay. From there you can trigger the self-improvement flow — Claude compares the current AI prompt against a consultant-quality answer and suggests a rewrite. The diff shows as a before/after comparison. It's a demo feature that should really live in a back-office system rather than on the user-facing side, but it's a real self-learning loop and seeing it work is the point.

**Meaningful animations.**
The onboarding flow has meaningful animations throughout — answer options slowly activate when clicked, and the transition slides to the next question rather than snapping, to make it feel progressive because it is. Sparkle bursts, checkbox bounces, and text brightening give users a sense of completion at each interaction. Immigration is a stressful process, so I believe every small moment and interaction matters to the user.

**Overview summary in a trusted-friend voice.**
The dashboard generates a warm 2–3 sentence status update with your name, where you are, and what's next — written in a friendly way without any jargon.

---

## Tech Stack

- **Frontend:** Next.js 14 · React 18 · Tailwind CSS · Zustand · shadcn/ui · TanStack Query · react-markdown · Heroicons v2 · Lucide React
- **Backend:** Flask · Anthropic Claude API · Supabase (prompt versioning via `ai_prompts` table) · Gunicorn · Flask-CORS
- **Deployed:** Vercel (frontend) · Railway (backend)

---

## Honest Reflection

I haven't touched code in about 10 years. Before this project I had never really used GitHub, never deployed anything on any platform.

Throughout this assignment, I found it to be one of the most disorienting and rewarding experiences I've ever had in my career.

**What clicked:**

I truly believe I could go beyond just working on Figma with mockups and prototypes, which are quite static compared to building what's in my head through prompting. This assignment made me really believe this is where UX/UI design is heading — the deliverables can be utilized for more accurate concept testing, usability testing, stakeholder alignment, or even as developer handoff itself. Cursor and Claude Code were genuinely great tools for this. The gap between idea and working product got smaller each day.

**What was hard:**

I don't fully understand everything I used in this project, just the concept of each piece. I leaned on the tools to handle most of the debugging. There were moments where something broke and I couldn't fully explain why the fix worked. But I think that's part of learning — at least the tools are capable of handling these things, and learning by doing day by day creates deeper understanding as well.

**On skipping GCP/Docker:**
The assignment mentioned Dockerized infrastructure on GCP or AWS. I looked into it seriously but felt it would take too long, as I had already used up two weeks on the build.

---

## What I Didn't Expect

As designers, we've gone through many tools over the years. But being able to vibe code and deploy something technical — even without fully understanding everything behind it — is already a signal that we can push ourselves further with better tools and become better designers in the process.

I'm glad I got to think about it through Mo's story. Trying to work on something that might help someone reach their potential, I got a small glimpse of my own.

---

## Please Give It a Try

**Live demo:** [https://issa-mark-2.vercel.app](https://issa-mark-2.vercel.app)

The best way to experience it is to **sign up fresh** and go through the onboarding as Mo:

| Step | Answer |
|---|---|
| Name | Mo (or anything you like) |
| Purpose | Work for a company here |
| Work type | Professional / office / technical |
| Nationality | Cambodia |
| Job offer | Yes, from a Thai company |
| Current visa | Not in Thailand yet |
| Urgency | Planning to move in 1–3 months |

Once you're in the chat, try asking a few questions or providing some information before generating the roadmap, as the AI uses information from the conversation to build a personalized plan.

Example questions:

- *"What visa do I need to work legally in Bangkok?"*
- *"My company said they'll handle the work permit — what do I need to do on my side?"*
- *"How long does the Non-B process usually take?"*

Then hit **Generate Roadmap** to see upcoming tasks split into what Mo owns and what her employer owns.

Feel free to follow Mo's answers exactly or change a few things — maybe a different nationality, different urgency, or no job offer yet — and see how the roadmap and consultant tone adjust.

Once the roadmap is generated, try clicking into any task to expand it and see its subtasks. From there, hit **"Help me do this"** to open a focused chat thread with context already loaded. Information provided in the conversation might also trigger the app to ask whether you have completed a subtask or task.

When you've marked enough progress, the Documents and Status pages unlock. These are prototype flows without a real backend behind the uploads or status stages, but they're there to show the full journey Mo would go through.

**Note:** Test accounts (`test01`–`test10` / `password01`–`password10`) are also available in case sign up is unavailable.

**Backend:** `https://issa-compass-hackathon-production-0e72.up.railway.app`

---

## Where This Could Go

Mo's journey was the right place to start — clear enough to scope, real enough to matter. But she's not the only person who needs this.

I have a friend called Nozim. He's in his late 50s, migrated from Myanmar to Bangkok, and sells roti from a pushcart to survive and send money back to his family. I've known him since university — even with the age gap, we saw each other every day when I walked back to the dorm. He's a close friend, closer than many fellow students were.

A few years ago I helped him a little with some paperwork. Just a little. But I remember how much that small thing mattered, and how alone you can feel navigating a system that wasn't built for you.

He deserves more than a demo can give him right now. But here's what building for him could look like:

- **Document checker** — photograph a Thai document, get an explanation of what it says and whether it's what you need
- **Voice input** — for users who navigate the world through speech rather than text, with support across multiple languages
- **Caseworker / agent mode** — a simplified view for NGO workers, social workers, or professional immigration agents to use the product on someone's behalf
- **NGO partnerships** — because the app fee shouldn't be a barrier for the people who need it most

The other thing I keep thinking about is generative UI. Right now my deliverable is a chat interface, which assumes you know what to ask. Most people would freeze at a blank input or not even feel comfortable typing.

What if the product surfaced the right interface for each task at the right moment? A form when you need to fill something in. A checklist when you need to track. A guided flow when the next step is well-defined.

As common journeys become clearer, the UI could shape itself around them — making the experience closer to being guided. These are the improvements still forming in my mind.

---

### cURL Examples

**1. Send a chat message**
```bash
curl -X POST https://issa-compass-hackathon-production-0e72.up.railway.app/generate-reply \
  -H "Content-Type: application/json" \
  -d '{
    "clientSequence": "msg_001",
    "chatHistory": [
      { "role": "user", "content": "What documents do I need for a Non-B visa?" }
    ],
    "quizAnswers": {
      "nationality": "Cambodian",
      "intent": "work_company",
      "workType": "professional"
    }
  }'
```

**2. Generate a personalized roadmap**
```bash
curl -X POST https://issa-compass-hackathon-production-0e72.up.railway.app/generate-roadmap \
  -H "Content-Type: application/json" \
  -d '{
    "chatHistory": [],
    "quizAnswers": {
      "nationality": "Cambodian",
      "intent": "work_company",
      "workType": "professional",
      "hasJobOffer": true,
      "currentVisa": "tourist",
      "urgency": "within_month"
    }
  }'
```

**3. Fetch the current AI prompt**
```bash
curl https://issa-compass-hackathon-production-0e72.up.railway.app/get-prompt
```

---

## Links

| | |
|---|---|
| GitHub | [lukeatdesign/issa-mark-2](https://github.com/lukeatdesign/issa-mark-2) |
| Frontend | [https://issa-mark-2.vercel.app](https://issa-mark-2.vercel.app) |
| Backend | [https://issa-compass-hackathon-production-0e72.up.railway.app](https://issa-compass-hackathon-production-0e72.up.railway.app) |

---

Warmest regards,
Luke
