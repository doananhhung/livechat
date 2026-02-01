import { type Node } from "@xyflow/react";
import { useState, useEffect } from "react";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import { useTranslation } from "react-i18next";
import {
  AiToolName,
  AVAILABLE_ACTION_TOOLS,
  AI_TOOL_CONFIG_LABEL_KEYS,
} from "@live-chat/shared-types";

interface NodeConfigPanelProps {
  selectedNode: Node | null;
  onChange: (nodeId: string, data: Record<string, unknown>) => void;
  onDelete: (nodeId: string) => void;
  onClose: () => void;
}

export const NodeConfigPanel = ({
  selectedNode,
  onChange,
  onDelete,
  onClose,
}: NodeConfigPanelProps) => {
  const { t } = useTranslation();
  const [executionMode, setExecutionMode] = useState<"llm" | "static">("llm");

  useEffect(() => {
    if (
      selectedNode?.type === "action" &&
      selectedNode.data.toolName === AiToolName.ADD_VISITOR_NOTE
    ) {
      const args = selectedNode.data.toolArgs as any;
      if (args?.content && String(args.content).length > 0) {
        setExecutionMode("static");
      } else {
        setExecutionMode("llm");
      }
    }
  }, [selectedNode?.id, (selectedNode?.data as any)?.toolName]);

  if (!selectedNode) return null;

  const handleChange = (key: string, value: any) => {
    onChange(selectedNode.id, {
      ...selectedNode.data,
      [key]: value,
    });
  };

  return (
    <div className="absolute top-4 right-4 bottom-4 w-80 bg-card text-card-foreground shadow-xl rounded-lg border border-border flex flex-col z-10 animate-in slide-in-from-right duration-200">
      <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30 rounded-t-lg">
        <h3 className="font-bold text-sm uppercase tracking-tight text-foreground">
          {t("workflow.configPanel.title", { type: selectedNode.type })}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          ✕
        </Button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        <div className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-1 rounded inline-block">
          ID: {selectedNode.id}
        </div>

        {/* Start Node */}
        {selectedNode.type === "start" && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("workflow.configPanel.startDescription")}
          </p>
        )}

        {/* Action Node */}
        {selectedNode.type === "action" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase text-muted-foreground">
                {t("workflow.configPanel.actionToolLabel")}
              </label>
              <select
                className="w-full border border-input bg-background rounded-md p-2 text-sm focus:ring-2 focus:ring-ring transition-shadow"
                value={(selectedNode.data.toolName as string) || ""}
                onChange={(e) => handleChange("toolName", e.target.value)}
              >
                <option value="">
                  {t("workflow.configPanel.actionToolPlaceholder")}
                </option>
                {AVAILABLE_ACTION_TOOLS.map((toolName) => (
                  <option key={toolName} value={toolName}>
                    {t(AI_TOOL_CONFIG_LABEL_KEYS[toolName])}
                  </option>
                ))}
              </select>
            </div>

            {selectedNode.data.toolName === AiToolName.SEND_FORM && (
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase text-muted-foreground">
                  {t("workflow.configPanel.templateIdLabel")}
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 1"
                  value={(selectedNode.data.toolArgs as any)?.templateId || ""}
                  onChange={(e) =>
                    handleChange("toolArgs", {
                      ...(selectedNode.data.toolArgs as any),
                      templateId: parseInt(e.target.value),
                    })
                  }
                />
              </div>
            )}

            {selectedNode.data.toolName === AiToolName.CHANGE_STATUS && (
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase text-muted-foreground">
                  {t("workflow.configPanel.statusLabel")}
                </label>
                <select
                  className="w-full border border-input bg-background rounded-md p-2 text-sm"
                  value={(selectedNode.data.toolArgs as any)?.status || ""}
                  onChange={(e) =>
                    handleChange("toolArgs", {
                      ...(selectedNode.data.toolArgs as any),
                      status: e.target.value,
                    })
                  }
                >
                  <option value="open">{t("conversations.status.open")}</option>
                  <option value="pending">
                    {t("conversations.status.pending")}
                  </option>
                  <option value="solved">
                    {t("conversations.status.solved")}
                  </option>
                </select>
              </div>
            )}

            {selectedNode.data.toolName === AiToolName.ADD_VISITOR_NOTE && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase text-muted-foreground">
                    {t("workflow.configPanel.executionModeLabel")}
                  </label>
                  <select
                    className="w-full border border-input bg-background rounded-md p-2 text-sm focus:ring-2 focus:ring-ring transition-shadow"
                    value={executionMode}
                    onChange={(e) => {
                      const newMode = e.target.value as "llm" | "static";
                      setExecutionMode(newMode);
                      if (newMode === "llm") {
                        // Clear content to fallback to LLM logic
                        handleChange("toolArgs", {
                          ...(selectedNode.data.toolArgs as any),
                          content: "",
                        });
                      }
                    }}
                  >
                    <option value="llm">
                      {t("workflow.configPanel.modeLlm")}
                    </option>
                    <option value="static">
                      {t("workflow.configPanel.modeStatic")}
                    </option>
                  </select>
                </div>

                {executionMode === "static" ? (
                  <div className="animate-in fade-in duration-200">
                    <label className="block text-xs font-semibold mb-1.5 uppercase text-muted-foreground">
                      {t("workflow.configPanel.noteContentLabel")}
                    </label>
                    <Input
                      type="text"
                      placeholder="Note text..."
                      value={
                        (selectedNode.data.toolArgs as any)?.content || ""
                      }
                      onChange={(e) =>
                        handleChange("toolArgs", {
                          ...(selectedNode.data.toolArgs as any),
                          content: e.target.value,
                        })
                      }
                    />
                  </div>
                ) : (
                  <div className="animate-in fade-in duration-200">
                    <label className="block text-xs font-semibold mb-1.5 uppercase text-muted-foreground">
                      {t("workflow.configPanel.llmPromptLabel")}
                    </label>
                    <textarea
                      className="w-full border border-input bg-background rounded-md p-2 text-sm h-32 focus:ring-2 focus:ring-ring transition-shadow resize-none"
                      placeholder={t("workflow.configPanel.llmPromptPlaceholder2")}
                      value={(selectedNode.data.prompt as string) || ""}
                      onChange={(e) => handleChange("prompt", e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* LLM Node */}
        {selectedNode.type === "llm" && (
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase text-muted-foreground">
              {t("workflow.configPanel.llmPromptLabel")}
            </label>
            <textarea
              className="w-full border border-input bg-background rounded-md p-2 text-sm h-48 focus:ring-2 focus:ring-ring transition-shadow resize-none"
              placeholder={t("workflow.configPanel.llmPromptPlaceholder")}
              value={(selectedNode.data.prompt as string) || ""}
              onChange={(e) => handleChange("prompt", e.target.value)}
            />
          </div>
        )}

        {/* Condition Node */}
        {selectedNode.type === "condition" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("workflow.configPanel.conditionDescription")}
            </p>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase text-muted-foreground">
                {t("workflow.configPanel.routingPromptLabel")}
              </label>
              <textarea
                className="w-full border border-input bg-background rounded-md p-2 text-sm h-32 focus:ring-2 focus:ring-ring transition-shadow resize-none"
                placeholder={t("workflow.configPanel.routingPromptPlaceholder")}
                value={(selectedNode.data.prompt as string) || ""}
                onChange={(e) => handleChange("prompt", e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Switch Node */}
        {selectedNode.type === "switch" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("workflow.configPanel.switchDescription")}
            </p>

            {/* Cases Table */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase text-muted-foreground">
                {t("workflow.configPanel.casesLabel")}
              </label>
              <div className="space-y-2">
                {(
                  (selectedNode.data.cases as {
                    route: string;
                    when: string;
                  }[]) || []
                ).map((c, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col gap-3 p-3 border rounded-md bg-muted/20 relative group"
                  >
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          const cases = (
                            (selectedNode.data.cases as {
                              route: string;
                              when: string;
                            }[]) || []
                          ).filter((_, i) => i !== idx);
                          handleChange("cases", cases);
                        }}
                      >
                        ✕
                      </Button>
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-muted-foreground uppercase mb-1">
                        {t("workflow.configPanel.routeLabel")}
                      </label>
                      <Input
                        placeholder={t("workflow.configPanel.routeExample")}
                        value={c.route}
                        onChange={(e) => {
                          const cases = [
                            ...((selectedNode.data.cases as {
                              route: string;
                              when: string;
                            }[]) || []),
                          ];
                          cases[idx] = { ...cases[idx], route: e.target.value };
                          handleChange("cases", cases);
                        }}
                        className="bg-background"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {t("workflow.configPanel.routeHelp")}
                      </p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-muted-foreground uppercase mb-1">
                        {t("workflow.configPanel.whenLabel")}
                      </label>
                      <textarea
                        className="w-full border border-input bg-background rounded-md p-2 text-sm h-20 focus:ring-2 focus:ring-ring transition-shadow resize-none"
                        placeholder={t("workflow.configPanel.whenExample")}
                        value={c.when}
                        onChange={(e) => {
                          const cases = [
                            ...((selectedNode.data.cases as {
                              route: string;
                              when: string;
                            }[]) || []),
                          ];
                          cases[idx] = { ...cases[idx], when: e.target.value };
                          handleChange("cases", cases);
                        }}
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {t("workflow.configPanel.whenHelp")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {(
                (selectedNode.data.cases as {
                  route: string;
                  when: string;
                }[]) || []
              ).length < 10 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    const cases = [
                      ...((selectedNode.data.cases as {
                        route: string;
                        when: string;
                      }[]) || []),
                      { route: "", when: "" },
                    ];
                    handleChange("cases", cases);
                  }}
                >
                  {t("workflow.configPanel.addCase")}
                </Button>
              )}
            </div>

            {/* Prompt */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase text-muted-foreground">
                {t("workflow.configPanel.switchPromptLabel")}
              </label>
              <textarea
                className="w-full border border-input bg-background rounded-md p-2 text-sm h-24 focus:ring-2 focus:ring-ring transition-shadow resize-none"
                placeholder={t("workflow.configPanel.switchPromptPlaceholder")}
                value={(selectedNode.data.prompt as string) || ""}
                onChange={(e) => handleChange("prompt", e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border">
        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={() => {
            onDelete(selectedNode.id);
            onClose();
          }}
        >
          {t("workflow.configPanel.deleteNode")}
        </Button>
      </div>
    </div>
  );
};
