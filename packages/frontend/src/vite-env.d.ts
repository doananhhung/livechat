/// <reference types="vite/client" />
interface LiveChatWidgetApi {
  init: (config: {
    projectId: string;
    visitor?: { name?: string; email?: string };
  }) => void;
}

interface Window {
  LiveChatWidget: LiveChatWidgetApi;
}
