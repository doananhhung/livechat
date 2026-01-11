import { useChatStore } from "./store/useChatStore";
import { Launcher } from "./components/Launcher";
import { ChatWindow } from "./components/ChatWindow";
import { socketService } from "./services/socketService";
import { historyTracker } from "./services/historyTracker"; // Import historyTracker
import {
  MessageStatus,
  type WidgetMessageDto as Message,
} from "@live-chat/shared-types";
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

  // Initialize history tracker and handle URL changes
  useEffect(() => {
    historyTracker.init(); // Initialize on component mount

    const handleUrlChange = () => {
      const currentUrl = window.location.href;
      const currentTitle = document.title;

      if (currentUrl === lastUrl.current) {
        // If URL hasn't changed, but title might have, update it in history
        historyTracker.push(currentUrl, currentTitle);
        return; 
      }

      logWithTime("App", `🔗 URL CHANGED: ${lastUrl.current} → ${currentUrl}`);
      lastUrl.current = currentUrl;
      historyTracker.push(currentUrl, currentTitle); // Push new URL to tracker

      // Only send update to backend if the session is confirmed ready
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

    // Cleanup listeners and clear history tracker
    return () => {
      window.removeEventListener("popstate", handleUrlChange);
      window.removeEventListener("hashchange", handleUrlChange);
      window.removeEventListener("urlchange", handleUrlChange);
      historyTracker.clear(); // Clear history when component unmounts (widget removed)
    };
  }, []); // Empty dependency array, runs only on mount/unmount

  // Effect to send initial context only when the session is ready
  useEffect(() => {
    if (isSessionReady) {
      logWithTime(
        "App",
        `✅ Session is ready, sending initial context: ${window.location.href}`
      );
      // Ensure initial page view is recorded and then sent
      historyTracker.push(window.location.href, document.title);
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
        // Ensure the current URL is pushed and then sent as context
        historyTracker.push(window.location.href, document.title);
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
      const sessionMetadata = historyTracker.getMetadata(); // Get current metadata
      socketService.emitSendMessage(content, tempId, sessionMetadata); // Pass metadata
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
