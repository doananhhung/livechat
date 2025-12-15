// src/widget/components/Composer.tsx
import { useState, useRef } from "preact/hooks";
import type { FormEvent, KeyboardEvent } from "react";
import { type ConnectionStatus } from "../types";

interface ComposerProps {
  onSendMessage: (content: string) => void;
  onTypingChange: (isTyping: boolean) => void;
  connectionStatus: ConnectionStatus;
}

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
  const typingTimeoutRef = useRef<number | null>(null);
  const isDisabled = connectionStatus !== "connected";

  const handleTyping = (e: FormEvent<HTMLTextAreaElement>) => {
    setContent(e.currentTarget.value);

    if (!typingTimeoutRef.current) {
      onTypingChange(true);
    } else {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      onTypingChange(false);
      typingTimeoutRef.current = null;
    }, 1500);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (content.trim() && !isDisabled) {
        onSendMessage(content.trim());
        setContent("");
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
        onTypingChange(false);
      }
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (content.trim()) {
      onSendMessage(content.trim());
      setContent("");
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      onTypingChange(false);
    }
  };

  const buttonStyle = {
    ...styles.button,
    ...((!content.trim() || isDisabled) && styles.buttonDisabled),
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.container}>
        <textarea
          value={content}
          onInput={handleTyping}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
          placeholder={isDisabled ? "Đang kết nối..." : "Nhập tin nhắn..."}
          style={styles.textarea}
          rows={1}
        />
        <button
          type="submit"
          disabled={!content.trim() || isDisabled}
          style={buttonStyle}
        >
          <SendIcon />
        </button>
      </div>
    </form>
  );
};
