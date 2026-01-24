import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { GitFork } from "lucide-react";

export const ConditionNode = memo(({ id }: NodeProps) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-card border-2 border-orange-500 min-w-[150px] text-card-foreground">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-muted-foreground border-none"
      />
      <div className="flex items-center gap-2">
        <div className="rounded-full w-8 h-8 flex items-center justify-center bg-orange-100 dark:bg-orange-900/30 text-orange-500">
          <GitFork size={16} />
        </div>
        <div className="flex flex-col">
          <div className="font-bold text-sm">Router</div>
          <div className="text-xs text-muted-foreground">AI Decides Path</div>
        </div>
      </div>

      {/* Branch handles with labels */}
      <div className="flex justify-between mt-3 -mb-1 px-2">
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-green-600 dark:text-green-400 font-medium mb-1">
            Yes
          </span>
          <Handle
            type="source"
            position={Position.Bottom}
            id={`${id}-yes`}
            className="!relative !transform-none !left-0 !bottom-0 w-3 h-3 bg-green-500 border-none"
          />
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-red-600 dark:text-red-400 font-medium mb-1">
            No
          </span>
          <Handle
            type="source"
            position={Position.Bottom}
            id={`${id}-no`}
            className="!relative !transform-none !left-0 !bottom-0 w-3 h-3 bg-red-500 border-none"
          />
        </div>
      </div>
    </div>
  );
});
