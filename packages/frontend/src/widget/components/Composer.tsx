// src/widget/components/Composer.tsx
import { useState, useRef, useEffect } from "preact/hooks";
import type { FormEvent, KeyboardEvent } from "react";
import { type ConnectionStatus } from "../types";

interface ComposerProps {
  onSendMessage: (content: string) => void;
  onTypingChange: (isTyping: boolean) => void;
  connectionStatus: ConnectionStatus;
}

// Constants
const MAX_MESSAGE_LENGTH = 5000;
const TYPING_TIMEOUT = 1500; // ms
const RATE_LIMIT_COUNT = 10; // Max messages
const RATE_LIMIT_WINDOW = 60000; // Per 60 seconds

// Styles are written directly to avoid dependency on parent page's classes
const styles = {
  form: {
    padding: "0.75rem",
    borderTop: "1px solid #e5e7eb",
    backgroundColor: "#ffffff",
  },
  container: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: "9999px",
    padding: "0.25rem",
  },
  textarea: {
    width: "100%",
    backgroundColor: "transparent",
    resize: "none" as const,
    border: "none",
    padding: "0.5rem 0.75rem",
    color: "#111827",
    outline: "none",
  },
  button: {
    padding: "0.5rem",
    color: "#ffffff",
    backgroundColor: "#2563eb",
    borderRadius: "9999px",
    border: "none",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  buttonDisabled: {
    backgroundColor: "#d1d5db",
    cursor: "not-allowed",
  },
};

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
}: ComposerProps) => {
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const typingTimeoutRef = useRef<number | null>(null);
  const messageTimes = useRef<number[]>([]); // Track message timestamps for rate limiting
  const isDisabled = connectionStatus !== "connected";

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, []);

  // Check rate limit
  const isRateLimited = (): boolean => {
    const now = Date.now();
    // Remove timestamps older than the window
    messageTimes.current = messageTimes.current.filter(
      (time) => now - time < RATE_LIMIT_WINDOW
    );
    return messageTimes.current.length >= RATE_LIMIT_COUNT;
  };

  const handleTyping = (e: FormEvent<HTMLTextAreaElement>) => {
    const value = e.currentTarget.value;

    // Enforce max length
    if (value.length > MAX_MESSAGE_LENGTH) {
      setError(`Message too long (max ${MAX_MESSAGE_LENGTH} characters)`);
      return;
    }

    setContent(value);
    setError("");

    if (!typingTimeoutRef.current) {
      onTypingChange(true);
    } else {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      onTypingChange(false);
      typingTimeoutRef.current = null;
    }, TYPING_TIMEOUT);
  };

  const sendMessage = () => {
    const trimmedContent = content.trim();

    if (!trimmedContent || isDisabled) {
      return;
    }

    // Rate limiting check
    if (isRateLimited()) {
      setError("Sending too fast. Please wait a moment.");
      return;
    }

    // Record timestamp
    messageTimes.current.push(Date.now());

    onSendMessage(trimmedContent);
    setContent("");
    setError("");

    // Clear typing indicator
    if (typingTimeoutRef.current) {
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

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
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
          value={content}
          onInput={handleTyping}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
          placeholder={isDisabled ? "Đang kết nối..." : "Nhập tin nhắn..."}
          style={styles.textarea}
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
      <div
        style={{
          fontSize: "11px",
          color: "#9ca3af",
          textAlign: "right",
          marginTop: "4px",
        }}
      >
        {content.length}/{MAX_MESSAGE_LENGTH}
      </div>
    </form>
  );
};
