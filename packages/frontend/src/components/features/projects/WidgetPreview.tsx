import {
  WidgetTheme,
  WidgetPosition,
  type WidgetMessageDto,
} from "@live-chat/shared-types";
import { type WidgetConfig } from "../../../widget/store/useChatStore";
import { Header } from "../../../widget/components/Header";
import { MessageList } from "../../../widget/components/MessageList";
import { Composer } from "../../../widget/components/Composer";
import "../../../widget/styles/_generated-preview-vars.css";
import "../../../widget/styles/widget-custom.css";
import { useMemo } from "react";
import { cn } from "../../../lib/utils";

interface WidgetPreviewProps {
  config: Partial<WidgetConfig>;
  viewMode?: "desktop" | "mobile";
}

export const WidgetPreview = ({
  config,
  viewMode = "desktop",
}: WidgetPreviewProps) => {
  const theme = config.theme || WidgetTheme.LIGHT;

  // Mock messages for preview
  const messages: WidgetMessageDto[] = useMemo(
    () => [
      {
        id: "preview-1",
        content: "Hi there! 👋 How can we help you today?",
        createdAt: new Date(Date.now() - 60000).toISOString(),
        conversationId: 1,
        projectId: 1,
        visitorId: 1,
        fromCustomer: false,
        status: "sent",
        type: "text",
      } as any, // Cast because we might miss some backend fields not used in UI
      {
        id: "preview-2",
        content: "I'd like to know more about your pricing plans.",
        createdAt: new Date().toISOString(),
        conversationId: 1,
        projectId: 1,
        visitorId: 1,
        fromCustomer: true,
        status: "sent",
        type: "text",
      } as any,
    ],
    [],
  );

  // Default config values if missing
  const fullConfig: WidgetConfig = {
    projectId: "preview",
    theme: theme,
    position: config.position || WidgetPosition.BOTTOM_RIGHT,
    headerText: config.headerText || "Live Chat",
    welcomeMessage: config.welcomeMessage || "Welcome!",
    offlineMessage: config.offlineMessage || "We are currently offline.",
    companyLogoUrl: config.companyLogoUrl,
    agentDisplayName: config.agentDisplayName || "Agent",
    ...config,
  } as WidgetConfig;

  // Simulate background for preview container
  const isBottomLeft = fullConfig.position === WidgetPosition.BOTTOM_LEFT;
  const isMobile = viewMode === "mobile";

  // We need to apply the theme class to the root to trigger CSS variables
  // and also standard utility classes for layout.
  // We use a predefined height/width to simulate the widget window.
  return (
    <div className="relative w-full h-[600px] bg-muted/10 border rounded-xl overflow-hidden flex items-center justify-center p-8">
      {/* 
        The Widget Container 
        This div mimics the ChatWindow's main container.
        We apply 'widget-preview-root' and 'theme-{name}' here.
        We also apply specific styles to match ChatWindow's dimensions/appearance.
      */}
      <div
        className={cn(
          "widget-preview-root",
          `theme-${theme}`,
          "flex flex-col shadow-2xl overflow-hidden bg-background transition-all duration-300 ease-in-out",
          // Mobile vs Desktop dimensions
          isMobile
            ? "w-full h-full rounded-none"
            : "w-full max-w-[380px] h-[600px] max-h-full",
          // Conditional rounding based on position (only for desktop)
          !isMobile &&
            (isBottomLeft
              ? "rounded-tr-xl rounded-tl-xl rounded-br-xl"
              : "rounded-tr-xl rounded-tl-xl rounded-bl-xl"),
        )}
        style={{
          // Apply background color from variable (which comes from widget-preview-root)
          backgroundColor: "var(--widget-card-background)",
          fontFamily: fullConfig.fontFamily || "sans-serif",
          // Handle background image if present
          backgroundImage: fullConfig.backgroundImageUrl
            ? `url(${fullConfig.backgroundImageUrl})`
            : undefined,
        }}
      >
        <Header
          onClose={() => {}}
          primaryColor={fullConfig.primaryColor} // Legacy prop, might be ignored by new theme logic but kept for interface
          headerText={fullConfig.headerText}
          companyLogoUrl={fullConfig.companyLogoUrl}
          agentDisplayName={fullConfig.agentDisplayName}
        />

        <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col">
          <MessageList
            messages={messages}
            welcomeMessage={fullConfig.welcomeMessage}
            isAgentTyping={false}
            primaryColor={fullConfig.primaryColor}
            theme={theme}
            onFormSubmit={async () => {}}
            submittedFormMessageIds={new Set()}
            disableAutoScroll={true}
          />
        </div>

        <Composer
          onSendMessage={() => {}}
          onTypingChange={() => {}}
          connectionStatus="connected"
          offlineMessage={fullConfig.offlineMessage}
          theme={theme}
          isPreview={true}
        />
      </div>
    </div>
  );
};
