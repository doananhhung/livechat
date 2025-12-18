// src/widget/components/ChatWindow.tsx
import { useEffect, useRef } from "preact/hooks";
import { Header } from "./Header";
import { MessageList } from "./MessageList";
import { Composer } from "./Composer";
import type { WidgetConfig, Message, ConnectionStatus } from "../types";

interface ChatWindowProps {
  isOpen: boolean;
  config: WidgetConfig;
  messages: Message[];
  connectionStatus: ConnectionStatus;
  isAgentTyping: boolean;
  onClose: () => void;
  onSendMessage: (content: string) => void;
  onTypingChange: (isTyping: boolean) => void;
}

export const ChatWindow = (props: ChatWindowProps) => {
  const windowRef = useRef<HTMLDivElement>(null);
  const previousOpenState = useRef(props.isOpen);

  // Focus management for accessibility
  useEffect(() => {
    if (props.isOpen && !previousOpenState.current) {
      // Focus the window when opened
      windowRef.current?.focus();
    }
    previousOpenState.current = props.isOpen;
  }, [props.isOpen]);

  // Keyboard handler for ESC key
  useEffect(() => {
    if (!props.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        props.onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [props.isOpen, props.onClose]);

  if (!props.isOpen) {
    return null;
  }

  return (
    <div
      ref={windowRef}
      className="fixed bottom-24 right-5 w-96 h-[448px] bg-gray-50 rounded-xl shadow-2xl flex flex-col fade-in-up z-[9999]"
      role="dialog"
      aria-modal="true"
      aria-label="Live chat window"
      tabIndex={-1}
    >
      <Header
        onClose={props.onClose}
        primaryColor={props.config.primaryColor}
      />
      <MessageList
        messages={props.messages}
        welcomeMessage={props.config.welcomeMessage}
        isAgentTyping={props.isAgentTyping}
      />
      <Composer
        onSendMessage={props.onSendMessage}
        onTypingChange={props.onTypingChange}
        connectionStatus={props.connectionStatus}
      />
    </div>
  );
};
