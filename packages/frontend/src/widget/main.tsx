import { render } from "preact";
import App from "./App";
import { getWidgetSettings } from "./services/widgetApi";
import { useChatStore } from "./store/useChatStore";
import { socketService } from "./services/socketService";
import widgetStyles from "./styles/widget.css?inline";

const WIDGET_SCRIPT_ID = "your-app-widget-script";
let isInitialized = false;

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
    // 1. Fetch settings from the backend
    const settings = await getWidgetSettings(config.projectId);

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

    render(<App />, appContainer);
  } catch (error) {
    console.error("Live Chat Widget initialization failed:", error);
    isInitialized = false; // Reset flag on failure to allow re-initialization
  }
}

// Expose the global API for programmatic initialization
window.LiveChatWidget = {
  init: initializeWidget,
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
}, 500);
