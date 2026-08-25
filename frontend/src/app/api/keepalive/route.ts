// Pinged daily by Vercel Cron (see vercel.json). Calls the backend's
// /get-prompt, which reads the ai_prompts table — that request counts as
// Supabase API activity and stops the free-tier project from auto-pausing
// (pause kicks in after ~7 days idle and takes register/login down with it).
export const dynamic = "force-dynamic";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://issa-compass-hackathon-production-0e72.up.railway.app";

export async function GET() {
  try {
    const res = await fetch(`${BASE_URL}/get-prompt`, { cache: "no-store" });
    return Response.json({ ok: res.ok, status: res.status });
  } catch (err) {
    return Response.json({ ok: false, error: String(err) }, { status: 502 });
  }
}
