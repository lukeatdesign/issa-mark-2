"use client";
import { useEffect, useRef } from "react";
import { GlobeAltIcon } from "@heroicons/react/24/outline";
import type { ChatMessage } from "@/types";
import ChatBubble from "./ChatBubble";

interface ChatWindowProps {
  messages: ChatMessage[];
  loading: boolean;
  onChipSelect: (text: string) => void;
}

export default function ChatWindow({ messages, loading, onChipSelect }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4">
      {messages.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 gap-2">
          <GlobeAltIcon className="w-10 h-10 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">Ask me anything about working in Thailand</p>
          <p className="text-xs text-gray-400">Visa rules, work permits, taxes, timelines — I&apos;m here to help.</p>
        </div>
      )}

      {messages.map((msg) => (
        <ChatBubble key={msg.id} message={msg} onChipSelect={onChipSelect} />
      ))}

      {loading && (
        <div className="flex justify-start mb-4">
          <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
