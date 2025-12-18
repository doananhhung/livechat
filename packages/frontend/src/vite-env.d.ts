/// <reference types="vite/client" />
interface LiveChatWidgetApi {
  init: (config: {
    projectId: string;
    visitor?: { name?: string; email?: string };
  }) => void;
  destroy: () => void;
}

interface Window {
  LiveChatWidget: LiveChatWidgetApi;
}
