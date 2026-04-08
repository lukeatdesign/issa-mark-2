import ReactMarkdown from "react-markdown";
import type { ChatMessage } from "@/types";
import FeedbackButtons from "./FeedbackButtons";
import SuggestedChips from "./SuggestedChips";

interface ChatBubbleProps {
  message: ChatMessage;
  onChipSelect: (text: string) => void;
}


function preprocessMarkdown(content: string): string {
  return content
    .replace(/^[ \t]*(?:[-*]|\d+\.)\s+(.+)$/gm, "$1")
    .replace(/\n/g, "  \n");
}

export default function ChatBubble({ message, onChipSelect }: ChatBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`max-w-[80%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        {/* Bubble */}
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed animate-fade-in-up ${
            isUser
              ? "bg-brand-600 text-white rounded-br-sm whitespace-pre-wrap"
              : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-strong:font-semibold prose-strong:text-gray-900"
          }`}
        >
          {isUser ? (
            message.content
          ) : (
            <ReactMarkdown>
              {preprocessMarkdown(message.content)}
            </ReactMarkdown>
          )}
        </div>

        {/* Correction attempt */}
        {message.correction_attempt && (
          <div className="mt-2 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200 text-sm text-amber-900 leading-relaxed max-w-full">
            <p className="text-xs font-semibold text-amber-600 mb-1">Correction attempt</p>
            {message.correction_attempt}
          </div>
        )}

        {/* Feedback + chips (assistant only) */}
        {!isUser && (
          <>
            <FeedbackButtons
              messageId={message.id}
              currentFeedback={message.feedback}
            />
            {message.suggested_followups && (
              <SuggestedChips
                suggestions={message.suggested_followups}
                onSelect={onChipSelect}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
