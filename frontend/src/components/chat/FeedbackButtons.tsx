"use client";
import api from "@/lib/api";
import { useChatStore } from "@/store/chat";

interface FeedbackButtonsProps {
  messageId: string;
  currentFeedback: 1 | -1 | null;
}

export default function FeedbackButtons({ messageId, currentFeedback }: FeedbackButtonsProps) {
  const { updateMessageFeedback, appendCorrectionAttempt } = useChatStore();

  const handleFeedback = async (feedback: 1 | -1) => {
    if (currentFeedback === feedback) return;
    updateMessageFeedback(messageId, feedback);
    try {
      const res = await api.post("/chat/feedback", { message_id: messageId, feedback });
      if (feedback === -1 && res.data.correction_attempt) {
        appendCorrectionAttempt(messageId, res.data.correction_attempt);
      }
    } catch {
      // best-effort
    }
  };

  return (
    <div className="flex items-center gap-1 mt-1">
      <button
        onClick={() => handleFeedback(1)}
        title="Helpful"
        className={`p-1 rounded transition-colors text-sm ${
          currentFeedback === 1 ? "text-green-600" : "text-gray-300 hover:text-gray-500"
        }`}
      >
        👍
      </button>
      <button
        onClick={() => handleFeedback(-1)}
        title="Not helpful"
        className={`p-1 rounded transition-colors text-sm ${
          currentFeedback === -1 ? "text-red-500" : "text-gray-300 hover:text-gray-500"
        }`}
      >
        👎
      </button>
    </div>
  );
}
