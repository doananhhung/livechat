// src/widget/App.tsx
import { useChatStore } from "./store/useChatStore";
import { Launcher } from "./components/Launcher";
import { ChatWindow } from "./components/ChatWindow";
import { socketService } from "./services/socketService";
import { type Message } from "./types";
import { useEffect, useRef, useCallback } from "preact/hooks";

// Utility function for timestamped logging
const logWithTime = (component: string, message: string, ...args: any[]) => {
  const timestamp = new Date().toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  });
  console.log(`[${timestamp}] [${component}] ${message}`, ...args);
};

const App = () => {
  const {
    widgetConfig,
    isWindowOpen,
    messages,
    unreadCount,
    connectionStatus,
    isAgentTyping,
    toggleWindow,
    addMessage,
    resetUnreadCount,
  } = useChatStore();

  const lastUrl = useRef(window.location.href);
  useEffect(() => {
    // This is the function that will run on ANY url change
    const handleUrlChange = () => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl.current) {
        logWithTime(
          "App",
          `🔗 URL CHANGED lmao: ${lastUrl.current} → ${currentUrl}`
        );
        lastUrl.current = currentUrl;
        socketService.emitUpdateContext(currentUrl);
      } else {
        console.log("URL did not change");
      }
    };

    // Send initial context
    const initialContextTimeout = setTimeout(() => {
      logWithTime("App", `📍 Sending initial context: ${window.location.href}`);
      socketService.emitUpdateContext(window.location.href);
    }, 1000);

    // Listen to ALL navigation events
    window.addEventListener("popstate", handleUrlChange);
    window.addEventListener("hashchange", handleUrlChange);
    window.addEventListener("urlchange", handleUrlChange); // Our custom event

    // Cleanup
    return () => {
      clearTimeout(initialContextTimeout);
      window.removeEventListener("popstate", handleUrlChange);
      window.removeEventListener("hashchange", handleUrlChange);
      window.removeEventListener("urlchange", handleUrlChange);
    };
  }, []); // Empty array, runs only on mount and unmount

  useEffect(() => {
    if (isWindowOpen && widgetConfig) {
      const visitorUid = localStorage.getItem("visitor_uid");
      if (visitorUid) {
        socketService.emitIdentify(widgetConfig.projectId, visitorUid);
      }
    }
  }, [isWindowOpen, widgetConfig]);

  const handleToggleWindow = useCallback(() => {
    toggleWindow();
    if (!isWindowOpen) {
      resetUnreadCount();
    }
  }, [toggleWindow, isWindowOpen, resetUnreadCount]);

  const handleSendMessage = useCallback(
    (content: string) => {
      const tempId = crypto.randomUUID();
      const optimisticMessage: Message = {
        id: tempId,
        content,
        sender: { type: "visitor" },
        status: "sending",
        timestamp: new Date().toISOString(),
      };

      addMessage(optimisticMessage);
      socketService.emitSendMessage(content, tempId);
    },
    [addMessage]
  );

  const handleTypingChange = useCallback((isTyping: boolean) => {
    socketService.emitVisitorIsTyping(isTyping);
  }, []);

  if (!widgetConfig) {
    return null;
  }

  return (
    <>
      <div className="text-black bg-white">
        <ChatWindow
          isOpen={isWindowOpen}
          config={widgetConfig}
          messages={messages}
          connectionStatus={connectionStatus}
          isAgentTyping={isAgentTyping}
          onClose={handleToggleWindow}
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
