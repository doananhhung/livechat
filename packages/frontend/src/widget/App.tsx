// src/widget/App.tsx
import { useChatStore } from "./store/useChatStore";
import { Launcher } from "./components/Launcher";
import { ChatWindow } from "./components/ChatWindow";
import { socketService } from "./services/socketService";
import { type Message } from "./types";
import { useEffect, useRef } from "preact/hooks";

const App = () => {
  // Task 1: Get state from store (simpler)
  const {
    widgetConfig,
    isWindowOpen,
    messages,
    unreadCount,
    connectionStatus,
    isAgentTyping,
    toggleWindow,
    addMessage, // Keep for optimistic UI
    resetUnreadCount,
  } = useChatStore();

  const lastUrl = useRef(window.location.href);
  const urlCheckIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Send context for the first time
    const initialContextTimeout = setTimeout(() => {
      socketService.emitUpdateContext(window.location.href);
    }, 1000);

    // --- Improved URL tracking with polling instead of monkey-patching ---
    // This is more reliable and doesn't interfere with other libraries
    urlCheckIntervalRef.current = window.setInterval(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl.current) {
        lastUrl.current = currentUrl;
        socketService.emitUpdateContext(currentUrl);
      }
    }, 1000); // Check every second

    // Listen for popstate (back/forward navigation)
    const handlePopState = () => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl.current) {
        lastUrl.current = currentUrl;
        socketService.emitUpdateContext(currentUrl);
      }
    };

    window.addEventListener("popstate", handlePopState);

    // Clean up when component unmounts
    return () => {
      clearTimeout(initialContextTimeout);
      if (urlCheckIntervalRef.current) {
        clearInterval(urlCheckIntervalRef.current);
      }
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Task 3: Simplify handling functions
  const handleToggleWindow = () => {
    toggleWindow();
    if (!isWindowOpen) {
      resetUnreadCount();
    }
  };

  const handleSendMessage = (content: string) => {
    const tempId = crypto.randomUUID();
    const optimisticMessage: Message = {
      id: tempId,
      content,
      sender: { type: "visitor" },
      status: "sending",
      timestamp: new Date().toISOString(),
    };

    addMessage(optimisticMessage); // Update UI immediately

    socketService.emitSendMessage(content, tempId); // Send message via service

    // You can add timeout/retry logic in socketService if desired
  };

  const handleTypingChange = (isTyping: boolean) => {
    socketService.emitVisitorIsTyping(isTyping); // Send typing status via service
  };

  if (!widgetConfig) {
    return null;
  }

  return (
    <>
      <div className="text-black bg-white">
        <ChatWindow
          isOpen={isWindowOpen}
          onClose={handleToggleWindow}
          config={widgetConfig}
          messages={messages}
          connectionStatus={connectionStatus}
          isAgentTyping={isAgentTyping}
          onSendMessage={handleSendMessage}
          onTypingChange={handleTypingChange}
        />
        <Launcher
          onClick={handleToggleWindow}
          unreadCount={unreadCount}
          primaryColor={widgetConfig.primaryColor}
        />
      </div>
    </>
  );
};

export default App;
