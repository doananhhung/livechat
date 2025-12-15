export type MessageStatus = "sending" | "sent" | "failed";

export type MessageSender = {
  type: "visitor" | "agent";
  name?: string;
};

export type Message = {
  id: string | number;
  content: string;
  sender: MessageSender;
  status: MessageStatus;
  timestamp: string;
};

export type WidgetConfig = {
  projectId: string;
  primaryColor: string;
  welcomeMessage: string;
};
export type ConnectionStatus = "connecting" | "connected" | "disconnected";
