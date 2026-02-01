import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

type ActionNodeData = {
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  prompt?: string;
};

export const ActionNode = memo(
  ({ data }: NodeProps & { data: ActionNodeData }) => {
    const { t } = useTranslation();

    const args = data.toolArgs as any;
    const isStatic = args?.content && String(args.content).trim().length > 0;

    return (
      <div className="px-4 py-2 shadow-md rounded-md bg-card border-2 border-blue-500 min-w-[150px] text-card-foreground relative group">
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 bg-muted-foreground border-none"
        />
        
        {/* Execution Mode Badge */}
        <div
          className={`absolute -top-2 -right-2 px-1.5 py-0.5 rounded text-[10px] font-bold shadow-sm uppercase border z-10 ${
            isStatic
              ? "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
              : "bg-blue-500 text-white border-blue-600"
          }`}
        >
          {isStatic ? t("workflow.nodes.badgeStatic") : t("workflow.nodes.badgeAi")}
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-full w-8 h-8 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-500">
            <Zap size={16} />
          </div>
          <div className="flex flex-col">
            <div className="font-bold text-sm">
              {t("workflow.nodes.action")}
            </div>
            <div className="text-xs text-muted-foreground truncate max-w-[120px]">
              {data.toolName || t("workflow.nodes.actionDescription")}
            </div>
          </div>
        </div>
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 bg-blue-500 border-none"
        />
      </div>
    );
  },
);
