import { render } from "preact";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { getWidgetSettings } from "./services/widgetApi";
import { useChatStore } from "./store/useChatStore";
import { socketService } from "./services/socketService";
import widgetStyles from "./styles/widget.css?inline";

const WIDGET_SCRIPT_ID = "your-app-widget-script";
const INIT_TIMEOUT = 500; // ms - Configurable constant instead of magic number
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 2000; // ms

let isInitialized = false;
let cleanupFunctions: (() => void)[] = [];

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
  if (isInitialized || !config.projectId) {
    return;
  }
  isInitialized = true;

  try {
    // 1. Fetch settings from the backend with retry logic
    const settings = await retryWithBackoff(() =>
      getWidgetSettings(config.projectId)
    );

    // 2. Identify the visitor
    let visitorUid = localStorage.getItem("visitor_uid");
    if (!visitorUid) {
      visitorUid = crypto.randomUUID();
      localStorage.setItem("visitor_uid", visitorUid);
    }

    // 3. Update the central state store
    useChatStore
      .getState()
      .setWidgetConfig({ ...settings, projectId: config.projectId });

    socketService.connect(config.projectId, visitorUid);

    // 4. Create the DOM host and render the app
    const shadowRoot = createHostElement();
    const appContainer = document.createElement("div");
    shadowRoot.appendChild(appContainer);

    render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>,
      appContainer
    );
  } catch (error) {
    console.error("Live Chat Widget initialization failed:", error);
    isInitialized = false; // Reset flag on failure to allow re-initialization

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
  cleanupFunctions.forEach((fn) => fn());
  cleanupFunctions = [];
  socketService.disconnect();

  // Remove widget host element
  const hostElement = document.getElementById("live-chat-widget-host");
  if (hostElement) {
    hostElement.remove();
  }

  isInitialized = false;
}

// Expose the global API for programmatic initialization
window.LiveChatWidget = {
  init: initializeWidget,
  destroy: cleanup,
};

// Fallback logic for data-attribute based initialization
setTimeout(() => {
  if (isInitialized) {
    return;
  }

  const scriptTag = document.getElementById(WIDGET_SCRIPT_ID);
  if (scriptTag) {
    const projectId = scriptTag.getAttribute("data-project-id");
    if (projectId) {
      initializeWidget({ projectId });
    } else {
      console.error(
        "Live Chat Widget: data-project-id not found on script tag."
      );
    }
  }
}, INIT_TIMEOUT);
