import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { GlobalToolConfig } from "@live-chat/shared-types";
import {
  AVAILABLE_ACTION_TOOLS,
  AI_TOOL_LABEL_KEYS,
} from "@live-chat/shared-types";

interface GlobalToolsPanelProps {
  tools: GlobalToolConfig[];
  onChange: (tools: GlobalToolConfig[]) => void;
}

export const GlobalToolsPanel = ({
  tools,
  onChange,
}: GlobalToolsPanelProps) => {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const enabledCount = tools.filter((tool) => tool.enabled).length;

  const getToolConfig = (toolName: string): GlobalToolConfig => {
    return (
      tools.find((t) => t.name === toolName) || {
        name: toolName,
        enabled: false,
        instruction: "",
      }
    );
  };

  const handleToggle = (toolName: string, enabled: boolean) => {
    const existing = tools.find((t) => t.name === toolName);
    if (existing) {
      onChange(tools.map((t) => (t.name === toolName ? { ...t, enabled } : t)));
    } else {
      onChange([...tools, { name: toolName, enabled, instruction: "" }]);
    }
  };

  const handleInstructionChange = (toolName: string, instruction: string) => {
    const existing = tools.find((t) => t.name === toolName);
    if (existing) {
      onChange(
        tools.map((t) => (t.name === toolName ? { ...t, instruction } : t)),
      );
    } else {
      onChange([...tools, { name: toolName, enabled: false, instruction }]);
    }
  };

  return (
    <div className="absolute top-4 left-4 z-10 bg-card text-card-foreground p-4 rounded-lg shadow-md border border-border w-72">
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between mb-2 hover:text-primary transition-colors"
      >
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
            {t("workflow.globalTools.title")}
          </h3>
          {isCollapsed && enabledCount > 0 && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {t("workflow.globalTools.enabledCount", { count: enabledCount })}
            </span>
          )}
        </div>
        {isCollapsed ? (
          <ChevronDown size={16} className="text-muted-foreground" />
        ) : (
          <ChevronUp size={16} className="text-muted-foreground" />
        )}
      </button>

      {!isCollapsed && (
        <>
          <p className="text-xs text-muted-foreground mb-3">
            {t("workflow.globalTools.description")}
          </p>
          <div className="space-y-3">
            {AVAILABLE_ACTION_TOOLS.map((toolName) => {
              const config = getToolConfig(toolName);
              return (
                <div
                  key={toolName}
                  className="border border-border rounded-md p-2 bg-background"
                >
                  <label className="flex items-center space-x-2 text-sm cursor-pointer hover:text-primary transition-colors">
                    <input
                      type="checkbox"
                      checked={config.enabled}
                      onChange={(e) => handleToggle(toolName, e.target.checked)}
                      className="rounded border-input bg-background text-primary focus:ring-ring h-4 w-4"
                    />
                    <span className="font-medium">
                      {t(AI_TOOL_LABEL_KEYS[toolName])}
                    </span>
                  </label>
                  {config.enabled && (
                    <textarea
                      className="mt-2 w-full border border-input bg-background rounded-md p-2 text-xs h-16 focus:ring-2 focus:ring-ring transition-shadow resize-none"
                      placeholder={t(
                        "workflow.globalTools.instructionPlaceholder",
                      )}
                      value={config.instruction}
                      onChange={(e) =>
                        handleInstructionChange(toolName, e.target.value)
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
