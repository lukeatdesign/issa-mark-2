"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import type { KnowledgeBaseItem } from "@/types";

const EMPTY_FORM = { topic: "", path_id: "", question: "", canonical_answer: "" };

export default function KnowledgePage() {
  const [items, setItems] = useState<KnowledgeBaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    api.get("/admin/knowledge")
      .then((res) => setItems(res.data.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    if (!form.question.trim() || !form.canonical_answer.trim()) return;
    setSubmitting(true);
    try {
      if (editingId) {
        await api.patch(`/admin/knowledge/${editingId}`, form);
      } else {
        await api.post("/admin/knowledge", form);
      }
      setForm(EMPTY_FORM);
      setShowForm(false);
      setEditingId(null);
      load();
    } catch {
      // show error
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this knowledge base entry?")) return;
    await api.delete(`/admin/knowledge/${id}`);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const startEdit = (item: KnowledgeBaseItem) => {
    setForm({ topic: item.topic, path_id: item.path_id ?? "", question: item.question, canonical_answer: item.canonical_answer });
    setEditingId(item.id);
    setShowForm(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-display font-semibold text-gray-900">Knowledge Base</h1>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); }}
          className="px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors"
        >
          + Add entry
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-8">{items.length} canonical answer{items.length !== 1 ? "s" : ""}</p>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border-2 border-brand-200 p-5 mb-6 space-y-3">
          <h2 className="font-semibold text-sm text-gray-800">{editingId ? "Edit entry" : "New entry"}</h2>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Topic" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-400" />
            <input placeholder="Path ID (optional)" value={form.path_id} onChange={(e) => setForm({ ...form, path_id: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-400" />
          </div>
          <input placeholder="Question" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-400" />
          <textarea rows={4} placeholder="Canonical answer" value={form.canonical_answer}
            onChange={(e) => setForm({ ...form, canonical_answer: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-400 resize-none" />
          <div className="flex gap-2">
            <button onClick={handleSubmit} disabled={submitting}
              className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors">
              {submitting ? "Saving…" : "Save"}
            </button>
            <button onClick={() => { setShowForm(false); setEditingId(null); }}
              className="px-4 py-2 border border-gray-200 text-sm text-gray-600 rounded-xl hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {items.length === 0 && !showForm && (
        <p className="text-sm text-gray-400">No entries yet. Add the first canonical answer.</p>
      )}
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex gap-2 mb-1">
                  {item.topic && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{item.topic}</span>}
                  {item.path_id && <span className="text-xs bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full">{item.path_id}</span>}
                  <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{item.source}</span>
                </div>
                <p className="text-sm font-medium text-gray-800 mb-1">{item.question}</p>
                <p className="text-sm text-gray-600 line-clamp-3">{item.canonical_answer}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => startEdit(item)} className="text-xs text-brand-600 hover:underline">Edit</button>
                <button onClick={() => handleDelete(item.id)} className="text-xs text-red-500 hover:underline">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
