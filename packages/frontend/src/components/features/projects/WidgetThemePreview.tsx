import React from "react";
import { WidgetTheme } from "@live-chat/shared-types";
import { cn } from "../../../lib/utils";
import { useTranslation } from "react-i18next";

interface WidgetThemePreviewProps {
  theme: WidgetTheme;
}

/**
 * Reusable component to preview how message bubbles look in a specific theme.
 * Uses standard dashboard theme classes to reflect colors in real-time.
 */
export const WidgetThemePreview = ({ theme }: WidgetThemePreviewProps) => {
  const { t } = useTranslation();

  return (
    <div className={cn("p-4 border rounded-lg bg-card mt-2 theme-" + theme)}>
      <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
        {t("common.preview")}
      </p>
      
      <div className="space-y-3 bg-background p-4 rounded-md border shadow-inner max-w-sm mx-auto">
        {/* Visitor Message (Me - Primary) */}
        <div className="flex justify-end">
          <div className="flex flex-col items-end max-w-[80%]">
            <div className="bg-primary text-primary-foreground p-2 px-3 rounded-xl rounded-tr-none text-sm shadow-sm">
              {t("widget.previewVisitorMessage", "Hello! I have a question about your services.")}
            </div>
          </div>
        </div>

        {/* Agent Message (Them - Muted) */}
        <div className="flex justify-start">
          <div className="flex flex-col items-start max-w-[80%]">
            <div className="bg-muted text-muted-foreground p-2 px-3 rounded-xl rounded-tl-none text-sm border shadow-sm">
              {t("widget.previewAgentMessage", "Hi there! We'd be happy to help. What's on your mind?")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
