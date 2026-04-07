"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import type { FeedbackLogItem } from "@/types";

export default function OverridesPage() {
  const [items, setItems] = useState<FeedbackLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [canonicalAnswer, setCanonicalAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/admin/overrides")
      .then((res) => setItems(res.data.flagged_items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id: string) => {
    if (!canonicalAnswer.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/admin/overrides/${id}/approve`, { canonical_answer: canonicalAnswer });
      setItems((prev) => prev.filter((i) => i.id !== id));
      setEditingId(null);
      setCanonicalAnswer("");
    } catch {
      // show error
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-display font-semibold text-gray-900 mb-1">Override Queue</h1>
      <p className="text-sm text-gray-500 mb-8">
        {items.length} item{items.length !== 1 ? "s" : ""} pending review
      </p>

      {items.length === 0 && (
        <p className="text-sm text-gray-400">No items pending review. 🎉</p>
      )}

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">User question</p>
              <p className="text-sm text-gray-800">{item.question || "—"}</p>
            </div>
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">AI answer (flagged)</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                {item.ai_answer}
              </p>
            </div>
            {item.corrected_answer && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Self-correction attempt</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                  {item.corrected_answer}
                </p>
              </div>
            )}

            {editingId === item.id ? (
              <div className="space-y-3 mt-3">
                <textarea
                  rows={4}
                  placeholder="Write the canonical correct answer…"
                  value={canonicalAnswer}
                  onChange={(e) => setCanonicalAnswer(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-brand-300 rounded-xl text-sm focus:outline-none focus:border-brand-500 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(item.id)}
                    disabled={submitting || !canonicalAnswer.trim()}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {submitting ? "Saving…" : "Approve & save to KB"}
                  </button>
                  <button
                    onClick={() => { setEditingId(null); setCanonicalAnswer(""); }}
                    className="px-4 py-2 border border-gray-200 text-sm text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { setEditingId(item.id); setCanonicalAnswer(item.corrected_answer ?? ""); }}
                className="mt-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                Write canonical answer →
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
