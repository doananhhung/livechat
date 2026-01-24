import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { GitFork } from 'lucide-react';

export const ConditionNode = memo(() => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-card border-2 border-orange-500 min-w-[150px] text-card-foreground">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-muted-foreground border-none" />
      <div className="flex items-center gap-2">
        <div className="rounded-full w-8 h-8 flex items-center justify-center bg-orange-100 dark:bg-orange-900/30 text-orange-500">
          <GitFork size={16} />
        </div>
        <div className="flex flex-col">
          <div className="font-bold text-sm">Router</div>
          <div className="text-xs text-muted-foreground">AI Decides Path</div>
        </div>
      </div>
      {/* 
        Condition node might have multiple source handles. 
        For React Flow, dynamic handles are possible. 
        For MVP, we'll start with one generic output, and maybe allow user to add more via UI later.
        Or standard "Next". 
      */}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-orange-500 border-none" />
    </div>
  );
});
