import { useEffect, useRef } from "preact/hooks";
import { type WidgetMessageDto as MessageType } from "@live-chat/shared-types";
import { Message } from "./Message";

interface MessageListProps {
  messages: MessageType[];
  welcomeMessage?: string;
  isAgentTyping: boolean;
  primaryColor?: string;
  theme: "light" | "dark";
  onFormSubmit?: (
    messageId: string,
    data: Record<string, unknown>,
  ) => Promise<void>;
  submittedFormMessageIds?: Set<string>;
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
  primaryColor,
  theme,
  onFormSubmit,
  submittedFormMessageIds,
}: MessageListProps) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const finalWelcomeMessage =
    welcomeMessage || "Welcome! How can we help you today?";

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAgentTyping]);

  const shouldShowTimestamp = (
    current: MessageType,
    previous: MessageType | undefined,
  ): boolean => {
    if (!previous) return true;
    const prevDate = new Date(previous.createdAt);
    const currDate = new Date(current.createdAt);
    return currDate.getTime() - prevDate.getTime() > 5 * 60 * 1000; // 5 minutes
  };

  const welcomeStyles = {
    color: "var(--widget-text-muted)",
  };

  const timestampStyles = {
    color: "var(--widget-text-muted)",
  };

  const typingIndicatorStyles = {
    backgroundColor: "var(--widget-bubble-agent-bg)",
    color: "var(--widget-bubble-agent-text)",
  };

  return (
    <div
      className="flex-grow p-4 overflow-y-auto"
      style={{ color: "var(--widget-text-primary)" }}
      role="log"
      aria-live="polite"
      aria-label="Chat messages"
    >
      {messages.length === 0 ? (
        <div
          className="h-full flex items-center justify-center"
          style={welcomeStyles}
          role="status"
        >
          {finalWelcomeMessage}
        </div>
      ) : (
        messages.map((msg, index) => (
          <div key={msg.id}>
            {shouldShowTimestamp(msg, messages[index - 1]) && (
              <div
                className="text-center text-xs my-2"
                style={timestampStyles}
                role="presentation"
              >
                {formatTimestamp(msg.createdAt)}
              </div>
            )}
            <Message
              message={msg}
              primaryColor={primaryColor}
              theme={theme}
              onFormSubmit={onFormSubmit}
              submittedFormMessageIds={submittedFormMessageIds}
            />
          </div>
        ))
      )}
      {isAgentTyping && (
        <div
          className="flex items-end my-1 gap-2 justify-start"
          role="status"
          aria-label="Agent is typing"
        >
          <div
            className="py-2 px-3 max-w-xs shadow-sm rounded-r-xl rounded-t-xl"
            style={typingIndicatorStyles}
          >
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
