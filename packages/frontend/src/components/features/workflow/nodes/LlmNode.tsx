import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Bot } from 'lucide-react';

type LlmNodeData = {
  prompt?: string;
};

export const LlmNode = memo(({ data }: NodeProps & { data: LlmNodeData }) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-purple-500 min-w-[150px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-400" />
      <div className="flex items-center gap-2">
        <div className="rounded-full w-8 h-8 flex items-center justify-center bg-purple-100 text-purple-500">
          <Bot size={16} />
        </div>
        <div className="flex flex-col">
          <div className="font-bold text-sm">AI Responder</div>
          <div className="text-xs text-gray-500 truncate max-w-[120px]">
            {data.prompt ? 'Custom Prompt' : 'Default Prompt'}
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-purple-500" />
    </div>
  );
});
