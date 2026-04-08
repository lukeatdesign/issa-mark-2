"use client";
import { useState } from "react";
import { BookmarkIcon } from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolidIcon } from "@heroicons/react/24/solid";
import { useChatStore, GENERAL_THREAD_ID } from "@/store/chat";

interface Props {
  onSelectThread: (threadId: string) => void;
}

interface NameTooltip {
  text: string;
  top: number;
  left: number;
  height: number;
  active: boolean;
  hovered: boolean;
}

function timeAgo(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)  return "Just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function ChatThreadSidebar({ onSelectThread }: Props) {
  const threads        = useChatStore((s) => s.threads);
  const threadMeta     = useChatStore((s) => s.threadMeta);
  const activeThreadId = useChatStore((s) => s.activeThreadId);
  const togglePin      = useChatStore((s) => s.toggleThreadPin);

  const [nameTooltip, setNameTooltip] = useState<NameTooltip | null>(null);

  const items = Object.keys(threads).map((id) => {
    const meta    = threadMeta[id];
    const msgs    = threads[id] ?? [];
    const lastMsg = msgs.findLast((m) => m.role === "assistant" || m.role === "user");
    const lastAt  = lastMsg?.created_at ?? meta?.createdAt ?? new Date().toISOString();
    return {
      id,
      name:    meta?.name   ?? (id === GENERAL_THREAD_ID ? "General" : "Task"),
      preview: lastMsg?.content?.replace(/\*\*/g, "").slice(0, 60) ?? "",
      pinned:  meta?.pinned ?? false,
      lastAt,
    };
  });

  const pinned   = items.filter((t) => t.pinned);
  const unpinned = items
    .filter((t) => !t.pinned)
    .sort((a, b) => b.lastAt.localeCompare(a.lastAt));

  const handleNameEnter = (
    e: React.MouseEvent<HTMLParagraphElement>,
    name: string,
    active: boolean
  ) => {
    const el = e.currentTarget;
    if (el.scrollWidth <= el.clientWidth) return; // not truncated — skip
    const rect = el.getBoundingClientRect();
    setNameTooltip({
      text: name,
      top: rect.top,
      left: rect.left,
      height: rect.height,
      active,
      hovered: !active,
    });
  };

  const renderItem = (item: (typeof items)[0]) => {
    const active = item.id === activeThreadId;

    return (
      <div
        key={item.id}
        onClick={() => onSelectThread(item.id)}
        onMouseLeave={() => setNameTooltip(null)}
        className={`group relative flex flex-col px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
          active
            ? "bg-brand-50 border-2 border-brand-200"
            : "hover:bg-gray-50 border-2 border-transparent"
        }`}
      >
        {/* Name row */}
        <div className="flex items-center gap-1 min-w-0">
          <p
            className={`text-xs truncate flex-1 ${
              active ? "font-semibold text-brand-700" : "font-medium text-gray-700"
            }`}
            onMouseEnter={(e) => handleNameEnter(e, item.name, active)}
          >
            {item.name}
          </p>

          {/* Shared timestamp / pin slot */}
          <div className="relative shrink-0 h-4 flex items-center">
            <span className={`text-[10px] text-gray-400 transition-opacity duration-150 ${
              item.pinned ? "opacity-0" : "group-hover:opacity-0"
            }`}>
              {timeAgo(item.lastAt)}
            </span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); togglePin(item.id); }}
              title={item.pinned ? "Unpin" : "Pin"}
              className={`absolute inset-0 flex items-center justify-center rounded transition-all duration-150 ${
                item.pinned
                  ? "opacity-100 text-brand-400"
                  : "opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 backdrop-blur-sm bg-white/70"
              }`}
            >
              {item.pinned
                ? <BookmarkSolidIcon className="w-3 h-3" />
                : <BookmarkIcon className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Preview */}
        {item.preview && (
          <p className="text-[11px] text-gray-400 truncate mt-0.5 leading-snug">
            {item.preview}
          </p>
        )}
      </div>
    );
  };

  // Colours that match the Tailwind classes on the item
  const tooltipBg    = nameTooltip?.active  ? "#f0f7ff"  // brand-50
                     : nameTooltip?.hovered ? "#f9fafb"  // gray-50
                     : "#ffffff";
  const tooltipColor = nameTooltip?.active  ? "#1d4ed8"  // brand-700
                     : "#374151";                         // gray-700
  const tooltipFw    = nameTooltip?.active  ? "600" : "500";

  return (
    <>
      <div className="w-52 flex-shrink-0 border-r border-gray-100 bg-white flex flex-col h-full min-h-0">
        {/* Header */}
        <div className="px-4 py-4 border-b border-gray-100 flex-shrink-0">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Chats</span>
        </div>

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 min-h-0">
          {pinned.length > 0 && (
            <>
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide px-2 pb-1">
                Pinned
              </p>
              {pinned.map(renderItem)}
              <div className="h-px bg-gray-100 mx-2 mt-3 mb-1" />
            </>
          )}
          {unpinned.length > 0 && (
            <>
              {pinned.length > 0 && (
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide px-2 pt-2 pb-1">
                  Recent
                </p>
              )}
              {unpinned.map(renderItem)}
            </>
          )}
        </div>
      </div>

      {/* Fixed name tooltip — escapes overflow clipping entirely */}
      {nameTooltip && (
        <div
          className="fixed z-[200] pointer-events-none whitespace-nowrap text-xs rounded-md"
          style={{
            top:        nameTooltip.top  - 3,
            left:       nameTooltip.left - 8,
            height:     nameTooltip.height + 6,
            display:    "flex",
            alignItems: "center",
            padding:    "0 8px",
            backgroundColor: tooltipBg,
            color:           tooltipColor,
            fontWeight:      tooltipFw,
            boxShadow: "0 2px 8px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.05)",
          }}
        >
          {nameTooltip.text}
        </div>
      )}
    </>
  );
}
