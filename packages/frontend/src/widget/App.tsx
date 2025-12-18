// src/widget/App.tsx
import { useChatStore } from "./store/useChatStore";
import { Launcher } from "./components/Launcher";
import { ChatWindow } from "./components/ChatWindow";
import { socketService } from "./services/socketService";
import { type Message } from "./types";
import { useEffect, useRef, useMemo, useCallback } from "preact/hooks";

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
  const popStateHandlerRef = useRef<(() => void) | null>(null);
  const visibilityHandlerRef = useRef<(() => void) | null>(null);

  // MEMORY LEAK FIX: Pause interval when page is not visible
  useEffect(() => {
    logWithTime("App", "🔄 Setting up visibility change handler");

    const handleVisibilityChange = () => {
      if (document.hidden) {
        logWithTime("App", "👁️ Page HIDDEN - pausing URL check interval");
        // Page is hidden, pause interval to save memory
        if (urlCheckIntervalRef.current !== null) {
          clearInterval(urlCheckIntervalRef.current);
          urlCheckIntervalRef.current = null;
          logWithTime("App", "✅ URL check interval PAUSED");
        }
      } else {
        logWithTime("App", "👁️ Page VISIBLE - resuming URL check interval");
        // Page is visible again, resume interval
        if (urlCheckIntervalRef.current === null) {
          urlCheckIntervalRef.current = window.setInterval(() => {
            const currentUrl = window.location.href;
            if (currentUrl !== lastUrl.current) {
              logWithTime(
                "App",
                `🔗 URL CHANGED: ${lastUrl.current} → ${currentUrl}`
              );
              lastUrl.current = currentUrl;
              socketService.emitUpdateContext(currentUrl);
            }
          }, 5000);
          logWithTime("App", "✅ URL check interval RESUMED (every 5s)");
        }
      }
    };
    visibilityHandlerRef.current = handleVisibilityChange;

    document.addEventListener("visibilitychange", handleVisibilityChange);
    logWithTime("App", "✅ Visibility change listener ADDED");

    return () => {
      if (visibilityHandlerRef.current) {
        document.removeEventListener(
          "visibilitychange",
          visibilityHandlerRef.current
        );
        visibilityHandlerRef.current = null;
        logWithTime("App", "🧹 Visibility change listener REMOVED");
      }
    };
  }, []);

  useEffect(() => {
    logWithTime("App", "🚀 Setting up URL tracking and popstate listener");

    // Send context for the first time
    const initialContextTimeout = setTimeout(() => {
      logWithTime("App", `📍 Sending initial context: ${window.location.href}`);
      socketService.emitUpdateContext(window.location.href);
    }, 1000);

    // --- MEMORY LEAK FIX: Increase interval to 5 seconds instead of 1 second ---
    // Checking every second creates too many closures and string allocations
    // 5 seconds is sufficient for URL tracking without impacting UX
    urlCheckIntervalRef.current = window.setInterval(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl.current) {
        logWithTime(
          "App",
          `🔗 URL CHANGED (interval): ${lastUrl.current} → ${currentUrl}`
        );
        lastUrl.current = currentUrl;
        socketService.emitUpdateContext(currentUrl);
      }
    }, 5000); // Check every 5 seconds (reduced from 1s to prevent memory leak)
    logWithTime("App", "✅ URL check interval STARTED (every 5s)");

    // Listen for popstate (back/forward navigation)
    const handlePopState = () => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl.current) {
        logWithTime(
          "App",
          `🔗 URL CHANGED (popstate): ${lastUrl.current} → ${currentUrl}`
        );
        lastUrl.current = currentUrl;
        socketService.emitUpdateContext(currentUrl);
      }
    };
    popStateHandlerRef.current = handlePopState;

    window.addEventListener("popstate", handlePopState);
    logWithTime("App", "✅ Popstate listener ADDED");

    // Clean up when component unmounts
    return () => {
      logWithTime("App", "🧹 CLEANUP: Clearing URL tracking resources");
      clearTimeout(initialContextTimeout);
      if (urlCheckIntervalRef.current !== null) {
        clearInterval(urlCheckIntervalRef.current);
        urlCheckIntervalRef.current = null;
        logWithTime("App", "✅ URL check interval CLEARED");
      }
      if (popStateHandlerRef.current) {
        window.removeEventListener("popstate", popStateHandlerRef.current);
        popStateHandlerRef.current = null;
        logWithTime("App", "✅ Popstate listener REMOVED");
      }
    };
  }, []);

  // Task 3: Simplify handling functions with useCallback to prevent recreating on every render
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

      addMessage(optimisticMessage); // Update UI immediately
      socketService.emitSendMessage(content, tempId); // Send message via service
    },
    [addMessage]
  );

  const handleTypingChange = useCallback((isTyping: boolean) => {
    socketService.emitVisitorIsTyping(isTyping); // Send typing status via service
  }, []);

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
