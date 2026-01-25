import { useEffect, useRef } from "react";
import { Header } from "./Header";
import { MessageList } from "./MessageList";
import { Composer } from "./Composer";
import type { ConnectionStatus } from "../types";
import type { WidgetConfig } from "../store/useChatStore";
import {
  type WidgetMessageDto as Message,
  WidgetPosition,
  WidgetTheme,
} from "@live-chat/shared-types";

interface ChatWindowProps {
  isOpen: boolean;
  config: WidgetConfig;
  messages: Message[];
  connectionStatus: ConnectionStatus;
  isAgentTyping: boolean;
  onClose: () => void;
  onSendMessage: (content: string) => void;
  onTypingChange: (isTyping: boolean) => void;
  onFormSubmit?: (
    messageId: string,
    data: Record<string, unknown>,
  ) => Promise<void>;
  submittedFormMessageIds?: Set<string>;
}

const scrollbarStyles = `
  .theme-dark ::-webkit-scrollbar { width: 8px; }
  .theme-dark ::-webkit-scrollbar-track { background: #1f2937; }
  .theme-dark ::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 4px; }
  .theme-dark ::-webkit-scrollbar-thumb:hover { background: #6b7280; }
  .theme-dark { scrollbar-color: #4b5563 #1f2937; scrollbar-width: thin; }

  .theme-light ::-webkit-scrollbar { width: 8px; }
  .theme-light ::-webkit-scrollbar-track { background: #f1f5f9; }
  .theme-light ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
  .theme-light ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  .theme-light { scrollbar-color: #cbd5e1 #f1f5f9; scrollbar-width: thin; }
`;

export const ChatWindow = (props: ChatWindowProps) => {
  const windowRef = useRef<HTMLDivElement>(null);
  const previousOpenState = useRef(props.isOpen);
  const keydownHandlerRef = useRef<((e: KeyboardEvent) => void) | null>(null);

  const theme = props.config.theme || WidgetTheme.LIGHT;

  // Inject scrollbar styles
  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.innerHTML = scrollbarStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []); // Run only once on mount

  // Focus management for accessibility
  useEffect(() => {
    if (props.isOpen && !previousOpenState.current) {
      windowRef.current?.focus();
    }
    previousOpenState.current = props.isOpen;
  }, [props.isOpen]);

  // Keyboard handler for ESC key
  useEffect(() => {
    if (!props.isOpen) {
      if (keydownHandlerRef.current) {
        window.removeEventListener("keydown", keydownHandlerRef.current);
        keydownHandlerRef.current = null;
      }
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        props.onClose();
      }
    };
    keydownHandlerRef.current = handleKeyDown;

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      keydownHandlerRef.current = null;
    };
  }, [props.isOpen, props.onClose]);

  if (!props.isOpen) {
    return null;
  }

  const positionClasses =
    props.config.position === WidgetPosition.BOTTOM_LEFT
      ? "bottom-24 left-5"
      : "bottom-24 right-5";

  const borderRadiusClasses =
    props.config.position === WidgetPosition.BOTTOM_LEFT
      ? "rounded-tr-xl rounded-tl-xl rounded-br-xl"
      : "rounded-tr-xl rounded-tl-xl rounded-bl-xl";

  const windowStyles = (() => {
    // For background image overlay, we still need theme-specific rgba values
    // The CSS variables handle the solid background case
    let backgroundColor;
    if (props.config.backgroundImageUrl) {
      // When there's a background image, we need semi-transparent overlay
      // These values must match tokens.ts
      const lightRgb = "255, 255, 255";
      const darkRgb = "31, 41, 55";
      const baseRgb = theme === WidgetTheme.LIGHT ? lightRgb : darkRgb;
      backgroundColor = `rgba(${baseRgb}, ${
        props.config.backgroundOpacity || 0.8
      })`;
    } else {
      // Use CSS variable for solid background
      backgroundColor = "var(--widget-card-background)";
    }

    return {
      fontFamily: props.config.fontFamily || "sans-serif",
      backgroundImage: props.config.backgroundImageUrl
        ? `url(${props.config.backgroundImageUrl})`
        : undefined,
      backgroundColor,
    };
  })();

  return (
    <div
      ref={windowRef}
      className={`fixed flex flex-col fade-in-up z-[9999] shadow-2xl
        w-[calc(100%-40px)] sm:w-[380px] 
        h-[calc(100%-120px)] sm:h-[600px] max-h-[750px]
        ${positionClasses} ${borderRadiusClasses} theme-${theme}`}
      style={windowStyles}
      role="dialog"
      aria-modal="true"
      aria-label="Live chat window"
      tabIndex={-1}
    >
      <Header
        onClose={props.onClose}
        primaryColor={props.config.primaryColor}
        headerText={props.config.headerText}
        companyLogoUrl={props.config.companyLogoUrl}
        agentDisplayName={props.config.agentDisplayName}
      />
      <MessageList
        messages={props.messages}
        welcomeMessage={props.config.welcomeMessage}
        isAgentTyping={props.isAgentTyping}
        primaryColor={props.config.primaryColor}
        theme={theme}
        onFormSubmit={props.onFormSubmit}
        submittedFormMessageIds={props.submittedFormMessageIds}
      />
      <Composer
        onSendMessage={props.onSendMessage}
        onTypingChange={props.onTypingChange}
        connectionStatus={props.connectionStatus}
        offlineMessage={props.config.offlineMessage}
        theme={theme}
      />
    </div>
  );
};
