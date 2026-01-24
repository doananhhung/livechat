import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Zap } from 'lucide-react';

type ActionNodeData = {
  toolName?: string;
  toolArgs?: Record<string, any>;
};

export const ActionNode = memo(({ data }: NodeProps & { data: ActionNodeData }) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-blue-500 min-w-[150px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-400" />
      <div className="flex items-center gap-2">
        <div className="rounded-full w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-500">
          <Zap size={16} />
        </div>
        <div className="flex flex-col">
          <div className="font-bold text-sm">Action</div>
          <div className="text-xs text-gray-500 truncate max-w-[120px]">
            {data.toolName || 'Select Tool'}
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500" />
    </div>
  );
});
