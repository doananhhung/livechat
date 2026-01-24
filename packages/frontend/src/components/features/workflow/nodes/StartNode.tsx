import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

export const StartNode = memo(() => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-green-500">
      <div className="flex flex-col">
        <div className="font-bold text-sm">Start</div>
        <div className="text-xs text-gray-500">Entry Point</div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-green-500"
      />
    </div>
  );
});
