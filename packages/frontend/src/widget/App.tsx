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

  useEffect(() => {
    // Send context for the first time (keep as is)
    const initialContextTimeout = setTimeout(() => {
      socketService.emitUpdateContext(window.location.href);
    }, 1000);

    // --- Instant URL tracking logic ---

    // General handler when URL changes
    const handleUrlChange = () => {
      // Use requestAnimationFrame to ensure URL is fully updated
      requestAnimationFrame(() => {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl.current) {
          lastUrl.current = currentUrl;
          socketService.emitUpdateContext(currentUrl);
        }
      });
    };

    // Override (monkey-patch) history.pushState to create a custom event
    const originalPushState = history.pushState;
    history.pushState = function (...args) {
      originalPushState.apply(this, args);
      // Emit 'pushstate' event so we can listen
      window.dispatchEvent(new Event("pushstate"));
    };

    // Listen for navigation events
    window.addEventListener("popstate", handleUrlChange); // Back/forward button
    window.addEventListener("pushstate", handleUrlChange); // SPA navigation

    // Clean up when component unmounts
    return () => {
      clearTimeout(initialContextTimeout);
      window.removeEventListener("popstate", handleUrlChange);
      window.removeEventListener("pushstate", handleUrlChange);
      // Restore original pushState function
      history.pushState = originalPushState;
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
