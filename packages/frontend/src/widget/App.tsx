import { useChatStore } from "./store/useChatStore";
import { Launcher } from "./components/Launcher";
import { ChatWindow } from "./components/ChatWindow";
import { socketService } from "./services/socketService";
import {
  MessageStatus,
  type WidgetMessageDto as Message,
} from "@live-chat/shared";
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
    isSessionReady,
    toggleWindow,
    addMessage,
    resetUnreadCount,
  } = useChatStore();

  const lastUrl = useRef(window.location.href);

  // Effect to handle URL changes for live context updates
  useEffect(() => {
    const handleUrlChange = () => {
      const currentUrl = window.location.href;
      if (currentUrl === lastUrl.current) {
        return; // URL hasn't changed
      }

      logWithTime("App", `🔗 URL CHANGED: ${lastUrl.current} → ${currentUrl}`);
      lastUrl.current = currentUrl;

      // Only send update if the session is confirmed ready by the backend
      if (useChatStore.getState().isSessionReady) {
        socketService.emitUpdateContext(currentUrl);
      } else {
        logWithTime(
          "App",
          "Skipping context update because session is not ready."
        );
      }
    };

    // Listen to navigation events
    window.addEventListener("popstate", handleUrlChange);
    window.addEventListener("hashchange", handleUrlChange);
    window.addEventListener("urlchange", handleUrlChange); // Custom event

    // Cleanup listeners
    return () => {
      window.removeEventListener("popstate", handleUrlChange);
      window.removeEventListener("hashchange", handleUrlChange);
      window.removeEventListener("urlchange", handleUrlChange);
    };
  }, []); // Empty dependency array, runs only on mount

  // Effect to send initial context only when the session is ready
  useEffect(() => {
    if (isSessionReady) {
      logWithTime(
        "App",
        `✅ Session is ready, sending initial context: ${window.location.href}`
      );
      socketService.emitUpdateContext(window.location.href);
    }
  }, [isSessionReady]);

  useEffect(() => {
    if (isWindowOpen && widgetConfig && connectionStatus === 'connected') {
      logWithTime(
        "App",
        `🟢 Widget opened and socket connected, identifying visitor for projectId: ${widgetConfig.projectId}`
      );
      const visitorUid = localStorage.getItem("visitor_uid");
      if (visitorUid) {
        socketService.emitIdentify(widgetConfig.projectId, visitorUid);
        socketService.emitUpdateContext(window.location.href);
      }
    }
  }, [isWindowOpen, widgetConfig, connectionStatus]);

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
        status: MessageStatus.SENDING,
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
          position={widgetConfig.position}
        />
      </div>
    </>
  );
};

export default App;
