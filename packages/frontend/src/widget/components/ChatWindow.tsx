// src/widget/components/ChatWindow.tsx
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
  if (!props.isOpen) {
    return null;
  }

  return (
    <div className="fixed bottom-24 right-5 w-96 h-[448px] bg-gray-50 rounded-xl shadow-2xl flex flex-col fade-in-up z-[9999]">
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
