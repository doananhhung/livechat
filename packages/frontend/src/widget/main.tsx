import { render } from "preact";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { getWidgetSettings } from "./services/widgetApi";
import { useChatStore } from "./store/useChatStore";
import { socketService } from "./services/socketService";
import widgetStyles from "./styles/widget.css?inline";
import type { WidgetSettingsDto } from "@live-chat/shared";

const WIDGET_SCRIPT_ID = "live-chat-widget";
const INIT_TIMEOUT = 500; // ms - Configurable constant instead of magic number
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 2000; // ms

let isInitialized = false;
let cleanupFunctions: (() => void)[] = [];
let initializationCount = 0;
let cleanupCount = 0;

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

const errorWithTime = (component: string, message: string, ...args: any[]) => {
  const timestamp = new Date().toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  });
  console.error(`[${timestamp}] [${component}] ${message}`, ...args);
};

/** * Create the host element and attach shadow DOM
 */
function createHostElement(): ShadowRoot {
  const hostElement = document.createElement("div");
  hostElement.id = "live-chat-widget-host";
  document.body.appendChild(hostElement);

  const shadowRoot = hostElement.attachShadow({ mode: "open" });

  const styleElement = document.createElement("style");
  styleElement.textContent = widgetStyles;
  shadowRoot.appendChild(styleElement);

  return shadowRoot;
}

/**
 * Sanitize user input to prevent XSS attacks
 */
function sanitizeInput(input: string): string {
  const div = document.createElement("div");
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Retry helper function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRY_ATTEMPTS,
  delay = RETRY_DELAY
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
}

/**
 * The core initialization function for the widget.
 * @param config Configuration object containing the projectId and optional visitor data.
 */
async function initializeWidget(config: {
  projectId: string;
  visitor?: { name?: string; email?: string };
}) {
  initializationCount++;
  logWithTime(
    "Widget",
    `🚀 initializeWidget() called | Attempt #${initializationCount} | isInitialized: ${isInitialized}`
  );

  if (isInitialized || !config.projectId) {
    logWithTime(
      "Widget",
      `⚠️ Initialization SKIPPED | isInitialized: ${isInitialized}, hasProjectId: ${!!config.projectId}`
    );
    return;
  }
  isInitialized = true;
  logWithTime("Widget", `✅ Setting isInitialized = true`);

  try {
    logWithTime(
      "Widget",
      `📡 Fetching widget settings for projectId: ${config.projectId}`
    );

    // 1. Store the original functions
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    // 2. Create a new custom event we can listen for
    const createUrlChangeEvent = () => new Event("urlchange");

    // 3. Monkey-patch pushState
    history.pushState = function (
      ...args: [
        data: any,
        unused: string,
        url?: string | URL | null | undefined
      ]
    ) {
      // Call the original function
      originalPushState.apply(this, args);

      // Dispatch our custom event
      window.dispatchEvent(createUrlChangeEvent());
    };

    // 4. Monkey-patch replaceState
    history.replaceState = function (
      ...args: [
        data: any,
        unused: string,
        url?: string | URL | null | undefined
      ]
    ) {
      // Call the original function
      originalReplaceState.apply(this, args);

      // Dispatch our custom event
      window.dispatchEvent(createUrlChangeEvent());
    };

    // 1. Fetch settings from the backend with retry logic
    const settings: WidgetSettingsDto = await retryWithBackoff(() =>
      getWidgetSettings(config.projectId)
    );
    logWithTime("Widget", `✅ Widget settings received:`, settings);

    // 2. Identify the visitor
    let visitorUid = localStorage.getItem("visitor_uid");
    if (!visitorUid) {
      visitorUid = crypto.randomUUID();
      localStorage.setItem("visitor_uid", visitorUid);
      logWithTime("Widget", `🆕 Generated NEW visitor UID: ${visitorUid}`);
    } else {
      logWithTime("Widget", `♻️ Using EXISTING visitor UID: ${visitorUid}`);
    }

    // 3. Update the central state store
    const fullConfig = { ...settings, projectId: config.projectId };
    useChatStore.getState().setWidgetConfig(fullConfig);
    logWithTime("Widget", `✅ Widget config set in store`);

    logWithTime(
      "Widget",
      `🔌 Calling socketService.connect() with visitorUid: ${visitorUid}`
    );
    socketService.connect(config.projectId, visitorUid);

    // 4. Create the DOM host and render the app
    logWithTime("Widget", `🎨 Creating shadow DOM and rendering app`);
    const shadowRoot = createHostElement();
    const appContainer = document.createElement("div");
    shadowRoot.appendChild(appContainer);

    render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>,
      appContainer
    );
    logWithTime(
      "Widget",
      `✅ Widget initialized successfully | Total initializations: ${initializationCount}`
    );

    // 5. Handle auto-open delay
    if (fullConfig.autoOpenDelay && fullConfig.autoOpenDelay > 0) {
      logWithTime("Widget", `⏳ Scheduling auto-open in ${fullConfig.autoOpenDelay}ms`);
      const autoOpenTimeout = setTimeout(() => {
        if (!useChatStore.getState().isWindowOpen) {
          useChatStore.getState().toggleWindow();
          logWithTime("Widget", `⏰ Auto-opening widget`);
        }
      }, fullConfig.autoOpenDelay);
      cleanupFunctions.push(() => clearTimeout(autoOpenTimeout));
    }

  } catch (error) {
    errorWithTime("Widget", `❌ Widget initialization FAILED:`, error);
    isInitialized = false; // Reset flag on failure to allow re-initialization
    logWithTime("Widget", `⚠️ Reset isInitialized = false due to error`);

    // Show user-friendly error message
    showErrorFallback();
  }
}

/**
 * Show error fallback UI when initialization fails
 */
function showErrorFallback() {
  const errorElement = document.createElement("div");
  errorElement.id = "live-chat-widget-error";
  errorElement.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #fee;
    color: #c33;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    z-index: 9999;
  `;
  errorElement.textContent =
    "Chat widget failed to load. Please refresh the page.";
  document.body.appendChild(errorElement);

  // Auto remove after 5 seconds
  setTimeout(() => {
    errorElement.remove();
  }, 5000);
}

// Cleanup function for widget teardown
function cleanup() {
  cleanupCount++;
  logWithTime(
    "Widget",
    `🧹 cleanup() called | Cleanup #${cleanupCount} | cleanupFunctions: ${cleanupFunctions.length}`
  );

  // Execute all registered cleanup functions
  cleanupFunctions.forEach((fn, index) => {
    try {
      logWithTime("Widget", `🧹 Executing cleanup function #${index + 1}`);
      fn();
    } catch (error) {
      errorWithTime(
        "Widget",
        `❌ Error during cleanup function #${index + 1}:`,
        error
      );
    }
  });
  cleanupFunctions = [];
  logWithTime("Widget", `✅ All cleanup functions executed`);

  // Disconnect socket and cleanup all listeners
  logWithTime("Widget", `🔌 Calling socketService.disconnect()`);
  socketService.disconnect();

  // Remove widget host element and all its event listeners
  const hostElement = document.getElementById("live-chat-widget-host");
  if (hostElement) {
    logWithTime("Widget", `🗑️ Removing shadow root and host element`);
    // Remove shadow root content first
    if (hostElement.shadowRoot) {
      // Clear all content from shadow root
      while (hostElement.shadowRoot.firstChild) {
        hostElement.shadowRoot.removeChild(hostElement.shadowRoot.firstChild);
      }
      logWithTime("Widget", `✅ Shadow root content cleared`);
    }
    // Remove the host element itself
    hostElement.remove();
    logWithTime("Widget", `✅ Host element removed`);
  } else {
    logWithTime("Widget", `⚠️ Host element not found (already removed?)`);
  }

  // Remove error fallback if exists
  const errorElement = document.getElementById("live-chat-widget-error");
  if (errorElement) {
    errorElement.remove();
    logWithTime("Widget", `✅ Error fallback element removed`);
  }

  // Reset zustand store to initial state
  useChatStore.setState({
    widgetConfig: null,
    isWindowOpen: false,
    messages: [],
    connectionStatus: "disconnected",
    unreadCount: 0,
    isAgentTyping: false,
  });
  logWithTime("Widget", `✅ Zustand store reset to initial state`);

  isInitialized = false;
  logWithTime(
    "Widget",
    `✅ Cleanup complete | isInitialized = false | Total cleanups: ${cleanupCount}, Total inits: ${initializationCount}`
  );
}

// Expose the global API for programmatic initialization
window.LiveChatWidget = {
  init: initializeWidget,
  destroy: cleanup,
};

logWithTime("Widget", `🌐 Global API exposed: window.LiveChatWidget`);

// Fallback logic for data-attribute based initialization
setTimeout(() => {
  if (isInitialized) {
    logWithTime(
      "Widget",
      `⏭️ Fallback init SKIPPED - widget already initialized`
    );
    return;
  }

  logWithTime("Widget", `🔍 Checking for data-attribute initialization...`);
  const scriptTag = document.getElementById(WIDGET_SCRIPT_ID);
  if (scriptTag) {
    const projectId = scriptTag.getAttribute("data-project-id");
    if (projectId) {
      logWithTime(
        "Widget",
        `✅ Found data-project-id: ${projectId} - initializing widget`
      );
      initializeWidget({ projectId });
    } else {
      errorWithTime(
        "Widget",
        `❌ Script tag found but data-project-id attribute is missing`
      );
    }
  } else {
    logWithTime(
      "Widget",
      `⚠️ Script tag with id '${WIDGET_SCRIPT_ID}' not found - waiting for manual init`
    );
  }
}, INIT_TIMEOUT);
