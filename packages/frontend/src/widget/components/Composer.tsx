import { useState, useRef, useEffect } from "preact/hooks";
import type { FormEvent, KeyboardEvent } from "react";
import { type ConnectionStatus } from "../types";

interface ComposerProps {
  onSendMessage: (content: string) => void;
  onTypingChange: (isTyping: boolean) => void;
  connectionStatus: ConnectionStatus;
  offlineMessage?: string;
  theme: 'light' | 'dark';
}

// Constants
const MAX_MESSAGE_LENGTH = 5000;
const TYPING_TIMEOUT = 1500; // ms
const RATE_LIMIT_COUNT = 10; // Max messages
const RATE_LIMIT_WINDOW = 60000; // Per 60 seconds

// Dynamic styles based on theme
const getStyles = (theme: 'light' | 'dark') => ({
  form: {
    padding: "0.75rem",
    borderTop: `1px solid ${theme === 'light' ? '#e5e7eb' : '#374151'}`,
    backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
  },
  container: {
    display: "flex",
    alignItems: "center",
    backgroundColor: theme === 'light' ? '#f3f4f6' : '#374151',
    borderRadius: "9999px",
    padding: "0.25rem",
  },
  textarea: {
    width: "100%",
    backgroundColor: "transparent",
    resize: "none" as const,
    border: "none",
    padding: "0.5rem 0.75rem",
    color: theme === 'light' ? '#111827' : '#f9fafb',
    outline: "none",
  },
  button: {
    padding: "0.5rem",
    color: "#ffffff",
    backgroundColor: "#2563eb", // Primary color, remains the same
    borderRadius: "9999px",
    border: "none",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  buttonDisabled: {
    backgroundColor: "#d1d5db",
    cursor: "not-allowed",
  },
  charCount: {
    fontSize: "11px",
    color: theme === 'light' ? '#9ca3af' : '#6b7280',
    textAlign: "right" as const,
    marginTop: "4px",
  },
  offlineText: {
    textAlign: 'center' as const,
    color: theme === 'light' ? '#6b7280' : '#9ca3af',
  }
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
      <div style={{...styles.form, ...styles.offlineText}}>
        {offlineMessage || "The chat is currently offline."}
      </div>
    )
  }

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
          placeholder={isDisabled ? "Connecting..." : "Type a message..."}
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
        style={styles.charCount}
      >
        {content.length}/{MAX_MESSAGE_LENGTH}
      </div>
    </form>
  );
};
