import { useState, useRef, useEffect } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { type ConnectionStatus } from "../types";

interface ComposerProps {
  onSendMessage: (content: string) => void;
  onTypingChange: (isTyping: boolean) => void;
  connectionStatus: ConnectionStatus;
  offlineMessage?: string;
  theme: "light" | "dark";
}

// Constants
const MAX_MESSAGE_LENGTH = 5000;
const TYPING_TIMEOUT = 1500; // ms
const RATE_LIMIT_COUNT = 10; // Max messages
const RATE_LIMIT_WINDOW = 60000; // Per 60 seconds

const getStyles = (theme: "light" | "dark") => ({
  form: {
    padding: "1rem",
    backgroundColor: "transparent",
    position: "relative" as const,
  },
  container: {
    display: "flex",
    alignItems: "flex-end",
    backgroundColor: "var(--widget-composer-background)", // Use CSS var
    borderRadius: "1.5rem",
    padding: "0.5rem",
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
    border: "1px solid var(--widget-card-border)",
    transition: "box-shadow 0.2s ease, border-color 0.2s ease",
  },
  textarea: {
    width: "100%",
    backgroundColor: "transparent",
    resize: "none" as const,
    border: "none",
    padding: "0.75rem 1rem",
    color: "var(--widget-text-primary)", // Use CSS var
    outline: "none",
    fontSize: "0.95rem",
    lineHeight: "1.4",
    maxHeight: "120px",
    minHeight: "24px",
  },
  button: {
    padding: "0.75rem",
    color: "#ffffff",
    backgroundColor: "var(--widget-primary-color)",
    background: "var(--widget-primary-gradient)",
    borderRadius: "50%",
    border: "none",
    cursor: "pointer",
    transition: "transform 0.1s ease, opacity 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "42px",
    minHeight: "42px",
    marginBottom: "2px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
  },
  buttonDisabled: {
    background: "#d1d5db",
    cursor: "not-allowed",
    boxShadow: "none",
  },
  charCount: {
    fontSize: "10px",
    color: "var(--widget-text-muted)",
    textAlign: "right" as const,
    marginTop: "6px",
    marginRight: "12px",
    opacity: 0.7,
  },
  offlineText: {
    textAlign: "center" as const,
    color: "var(--widget-text-muted)",
    padding: "1rem",
    background: "var(--widget-bubble-agent-bg)",
    borderRadius: "0.75rem",
    margin: "0 1rem 1rem 1rem",
  },
});

const SendIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

export const Composer = ({
  onSendMessage,
  onTypingChange,
  connectionStatus,
  offlineMessage,
  theme,
}: ComposerProps) => {
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const typingTimeoutRef = useRef<number | null>(null);
  const messageTimes = useRef<number[]>([]); // Track message timestamps for rate limiting
  const isDisabled = connectionStatus !== "connected";

  const styles = getStyles(theme);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current !== null) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      // Clear message times to prevent memory leak
      messageTimes.current = [];
    };
  }, []);

  // Check rate limit
  const isRateLimited = (): boolean => {
    const now = Date.now();
    // Remove timestamps older than the window
    messageTimes.current = messageTimes.current.filter(
      (time) => now - time < RATE_LIMIT_WINDOW,
    );
    return messageTimes.current.length >= RATE_LIMIT_COUNT;
  };

  // Auto-resize textarea
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTyping = (e: FormEvent<HTMLTextAreaElement>) => {
    const value = e.currentTarget.value;
    const target = e.currentTarget;

    // Enforce max length
    if (value.length > MAX_MESSAGE_LENGTH) {
      setError(`Message too long (max ${MAX_MESSAGE_LENGTH} characters)`);
      return;
    }

    setContent(value);
    setError("");

    // Auto-grow logic
    target.style.height = "auto";
    const newHeight = Math.min(target.scrollHeight, 120); // Max height 120px (~5-6 lines)
    target.style.height = `${newHeight}px`;

    if (typingTimeoutRef.current === null) {
      onTypingChange(true);
    } else {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      onTypingChange(false);
      typingTimeoutRef.current = null;
    }, TYPING_TIMEOUT);
  };

  // Reset height on send
  const sendMessage = () => {
    const trimmedContent = content.trim();

    if (!trimmedContent || isDisabled) {
      return;
    }

    if (isRateLimited()) {
      setError("Sending too fast. Please wait a moment.");
      return;
    }

    messageTimes.current.push(Date.now());

    onSendMessage(trimmedContent);
    setContent("");
    setError("");

    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    if (typingTimeoutRef.current !== null) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    onTypingChange(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendMessage();
  };

  const buttonStyle = {
    ...styles.button,
    ...((!content.trim() || isDisabled) && styles.buttonDisabled),
  };

  if (isDisabled) {
    return (
      <div style={{ ...styles.form, ...styles.offlineText }}>
        {offlineMessage || "The chat is currently offline."}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      {/* ... error display ... */}
      {error && (
        <div
          style={{
            color: "#dc2626",
            fontSize: "12px",
            marginBottom: "4px",
            padding: "4px 8px",
          }}
        >
          {error}
        </div>
      )}
      <div style={styles.container}>
        <textarea
          ref={textareaRef}
          value={content}
          onInput={handleTyping}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
          placeholder={isDisabled ? "Connecting..." : "Type a message..."}
          style={{
            ...styles.textarea,
            height: "auto",
            maxHeight: "120px",
            overflowY: "auto",
          }}
          rows={1}
          maxLength={MAX_MESSAGE_LENGTH}
          aria-label="Message input"
        />
        <button
          type="submit"
          disabled={!content.trim() || isDisabled}
          style={buttonStyle}
          aria-label="Send message"
        >
          <SendIcon />
        </button>
      </div>
      <div style={styles.charCount}>
        {content.length}/{MAX_MESSAGE_LENGTH}
      </div>
    </form>
  );
};
