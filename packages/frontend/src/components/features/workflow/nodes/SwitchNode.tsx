import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Waypoints } from "lucide-react";
import { useTranslation } from "react-i18next";

interface SwitchNodeData {
  cases?: { route: string; when: string }[];
  prompt?: string;
}

const MAX_VISIBLE_CASES = 5;

export const SwitchNode = memo(({ id, data }: NodeProps) => {
  const { t } = useTranslation();
  const nodeData = data as SwitchNodeData;
  const cases = nodeData.cases || [];
  const visibleCases = cases.slice(0, MAX_VISIBLE_CASES);
  const hasMoreCases = cases.length > MAX_VISIBLE_CASES;

  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-card border-2 border-cyan-500 min-w-[180px] text-card-foreground">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-muted-foreground border-none"
      />
      <div className="flex items-center gap-2">
        <div className="rounded-full w-8 h-8 flex items-center justify-center bg-cyan-100 dark:bg-cyan-900/30 text-cyan-500">
          <Waypoints size={16} />
        </div>
        <div className="flex flex-col">
          <div className="font-bold text-sm">{t("workflow.nodes.switch")}</div>
          <div className="text-xs text-muted-foreground">
            {t("workflow.nodes.switchDescription")}
          </div>
        </div>
      </div>

      {/* Case handles with labels */}
      <div className="flex flex-wrap justify-center gap-3 mt-3 -mb-1 px-1">
        {visibleCases.map((c) => (
          <div key={c.route} className="flex flex-col items-center">
            <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-medium mb-1 max-w-[60px] truncate">
              {c.route || "?"}
            </span>
            <Handle
              type="source"
              position={Position.Bottom}
              id={`${id}-${c.route}`}
              className="!relative !transform-none !left-0 !bottom-0 w-3 h-3 bg-cyan-500 border-none"
            />
          </div>
        ))}
        {hasMoreCases && (
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-muted-foreground font-medium mb-1">
              ...
            </span>
          </div>
        )}
        {/* Default handle - always present */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mb-1">
            {t("workflow.nodes.handleDefault")}
          </span>
          <Handle
            type="source"
            position={Position.Bottom}
            id={`${id}-default`}
            className="!relative !transform-none !left-0 !bottom-0 w-3 h-3 bg-gray-400 border-none"
          />
        </div>
      </div>
    </div>
  );
});
