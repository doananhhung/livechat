import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

export const StartNode = memo(() => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-card border-2 border-green-500 text-card-foreground">
      <div className="flex flex-col">
        <div className="font-bold text-sm">Start</div>
        <div className="text-xs text-muted-foreground">Entry Point</div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-green-500 border-none"
      />
    </div>
  );
});
