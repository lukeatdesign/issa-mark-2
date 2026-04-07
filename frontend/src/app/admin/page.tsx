"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

interface Stats {
  total_flagged: number;
  pending_review: number;
  consultant_reviewed: number;
  knowledge_base_entries: number;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    // Load basic counts from existing endpoints
    Promise.all([
      api.get("/admin/overrides").catch(() => ({ data: { flagged_items: [] } })),
      api.get("/admin/knowledge").catch(() => ({ data: { items: [] } })),
    ]).then(([overridesRes, kbRes]) => {
      const items = overridesRes.data.flagged_items ?? [];
      setStats({
        total_flagged: items.length,
        pending_review: items.filter((i: { status: string }) => i.status === "pending").length,
        consultant_reviewed: items.filter((i: { status: string }) => i.status === "consultant_reviewed").length,
        knowledge_base_entries: kbRes.data.items?.length ?? 0,
      });
    });
  }, []);

  const CARDS = stats
    ? [
        { label: "Pending review", value: stats.pending_review, color: "text-amber-600" },
        { label: "Total flagged", value: stats.total_flagged, color: "text-gray-700" },
        { label: "Consultant reviewed", value: stats.consultant_reviewed, color: "text-green-600" },
        { label: "KB entries", value: stats.knowledge_base_entries, color: "text-brand-600" },
      ]
    : [];

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-display font-semibold text-gray-900 mb-1">Consultant Panel</h1>
      <p className="text-sm text-gray-500 mb-8">Review flagged AI answers and manage the knowledge base.</p>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {CARDS.map((c) => (
            <div key={c.label} className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
              <p className="text-xs text-gray-500 mt-1">{c.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <a href="/admin/overrides" className="rounded-2xl border border-gray-100 bg-white p-5 hover:border-brand-200 transition-colors">
          <span className="text-2xl">🔍</span>
          <p className="mt-2 font-semibold text-sm text-gray-900">Override Queue</p>
          <p className="text-xs text-gray-500 mt-0.5">Review flagged AI answers</p>
        </a>
        <a href="/admin/knowledge" className="rounded-2xl border border-gray-100 bg-white p-5 hover:border-brand-200 transition-colors">
          <span className="text-2xl">📚</span>
          <p className="mt-2 font-semibold text-sm text-gray-900">Knowledge Base</p>
          <p className="text-xs text-gray-500 mt-0.5">Manage canonical answers</p>
        </a>
      </div>
    </div>
  );
}
