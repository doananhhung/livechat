import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Bot } from "lucide-react";
import { useTranslation } from "react-i18next";

type LlmNodeData = {
  prompt?: string;
};

export const LlmNode = memo(({ data }: NodeProps & { data: LlmNodeData }) => {
  const { t } = useTranslation();

  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-card border-2 border-purple-500 min-w-[150px] text-card-foreground">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-muted-foreground border-none"
      />
      <div className="flex items-center gap-2">
        <div className="rounded-full w-8 h-8 flex items-center justify-center bg-purple-100 dark:bg-purple-900/30 text-purple-500">
          <Bot size={16} />
        </div>
        <div className="flex flex-col">
          <div className="font-bold text-sm">{t("workflow.nodes.llm")}</div>
          <div className="text-xs text-muted-foreground truncate max-w-[120px]">
            {data.prompt
              ? t("workflow.configPanel.llmPromptLabel")
              : t("workflow.nodes.llmDescription")}
          </div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-purple-500 border-none"
      />
    </div>
  );
});
