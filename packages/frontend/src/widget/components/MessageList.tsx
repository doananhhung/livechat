// src/widget/components/MessageList.tsx
import { useEffect, useRef } from "preact/hooks";
import { type Message as MessageType } from "../types";
import { Message } from "./Message";

interface MessageListProps {
  messages: MessageType[];
  welcomeMessage: string;
  isAgentTyping: boolean;
}

// A simple utility to format time
const formatTimestamp = (dateString: string) =>
  new Date(dateString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

export const MessageList = ({
  messages,
  welcomeMessage,
  isAgentTyping,
}: MessageListProps) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAgentTyping]);

  const shouldShowTimestamp = (
    current: MessageType,
    previous: MessageType | undefined
  ): boolean => {
    if (!previous) return true;
    const prevDate = new Date(previous.timestamp);
    const currDate = new Date(current.timestamp);
    return currDate.getTime() - prevDate.getTime() > 5 * 60 * 1000; // 5 minutes
  };

  return (
    <div
      className="flex-grow p-4 overflow-y-auto"
      role="log"
      aria-live="polite"
      aria-label="Chat messages"
    >
      {messages.length === 0 ? (
        <div
          className="h-full flex items-center justify-center text-gray-500"
          role="status"
        >
          {welcomeMessage}
        </div>
      ) : (
        messages.map((msg, index) => (
          <div key={msg.id}>
            {shouldShowTimestamp(msg, messages[index - 1]) && (
              <div
                className="text-center text-xs text-gray-400 my-2"
                role="presentation"
              >
                {formatTimestamp(msg.timestamp)}
              </div>
            )}
            <Message message={msg} />
          </div>
        ))
      )}
      {isAgentTyping && (
        <div
          className="flex items-end my-1 gap-2 justify-start"
          role="status"
          aria-label="Agent is typing"
        >
          <div className="py-2 px-3 max-w-xs shadow-sm bg-gray-200 text-gray-800 rounded-r-xl rounded-t-xl">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}
      <div ref={endOfMessagesRef} />
    </div>
  );
};
