import Link from "next/link";

const PERSONAS = [
  {
    icon: "🏗️",
    title: "The Worker",
    description:
      "Blue-collar migrant from Myanmar, Laos, or Cambodia. We guide you through the MOU pathway step by step, in plain language.",
  },
  {
    icon: "💼",
    title: "The Professional",
    description:
      "White-collar expat with a job offer. Get clarity on Non-B visas, work permits, tax IDs, and everything in between.",
  },
  {
    icon: "💻",
    title: "The Nomad",
    description:
      "Remote worker or freelancer evaluating LTR, SMART Visa, or grey-area options. We give you honest, nuanced guidance.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <span className="font-display font-bold text-lg text-brand-900">
          Wayfarer
        </span>
        <div className="flex items-center gap-2">
          <Link
            href="/login?tab=signup"
            className="text-sm font-medium text-gray-600 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
          >
            Sign up
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg px-4 py-2 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
        <p className="text-xs font-semibold tracking-widest text-brand-600 uppercase mb-4">
          Thailand Work Immigration
        </p>
        <h1 className="text-4xl sm:text-5xl font-display font-semibold text-gray-900 leading-tight mb-6">
          Your intelligent guide to working legally in Thailand
        </h1>
        <p className="text-lg text-gray-600 mb-10 max-w-xl mx-auto">
          Whether you&apos;re a factory worker from Myanmar, a software engineer
          evaluating a Bangkok offer, or a freelancer exploring the LTR visa —
          Wayfarer meets you where you are.
        </p>
        <Link
          href="/onboarding"
          className="inline-block px-8 py-4 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors text-sm"
        >
          Get my personalized roadmap →
        </Link>
        <p className="mt-4 text-xs text-gray-400">Free · No credit card · 2 minutes</p>
      </section>

      {/* Persona cards */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <h2 className="text-xl font-display font-semibold text-gray-800 text-center mb-8">
          Who is this for?
        </h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {PERSONAS.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-gray-100 bg-gray-50 p-6 hover:border-brand-200 transition-colors"
            >
              <span className="text-3xl">{p.icon}</span>
              <h3 className="mt-3 font-semibold text-gray-900">{p.title}</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                {p.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-6 text-center text-xs text-gray-400">
        Wayfarer — Not legal advice. Always consult a licensed Thai immigration lawyer for complex situations.
      </footer>
    </div>
  );
}
