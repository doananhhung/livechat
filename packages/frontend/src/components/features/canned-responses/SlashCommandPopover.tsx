import React, { useEffect, useState } from 'react';
import type { CannedResponse } from '@live-chat/shared-types';
import { useGetCannedResponses } from '../../../services/cannedResponsesApi';

interface SlashCommandPopoverProps {
  projectId: number;
  filter: string;
  onSelect: (content: string) => void;
  onClose: () => void;
}

export const SlashCommandPopover: React.FC<SlashCommandPopoverProps> = ({ projectId, filter, onSelect, onClose }) => {
  const { data: responses } = useGetCannedResponses(projectId);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filtered = responses?.filter(r => r.shortcut.toLowerCase().startsWith(filter.toLowerCase())) || [];

  useEffect(() => {
    setSelectedIndex(0);
  }, [filter]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (filtered.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        onSelect(filtered[selectedIndex].content);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filtered, selectedIndex, onSelect, onClose]);

  if (filtered.length === 0) return null;

  return (
    <div className="absolute bottom-full left-0 mb-2 w-64 bg-popover text-popover-foreground border rounded-md shadow-md overflow-hidden z-50">
      <div className="p-1 max-h-48 overflow-y-auto">
        {filtered.map((response, index) => (
          <button
            key={response.id}
            className={`w-full text-left px-2 py-1.5 text-sm rounded-sm flex items-center justify-between ${
              index === selectedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
            }`}
            onClick={() => onSelect(response.content)}
          >
            <span className="font-medium">/{response.shortcut}</span>
            <span className="text-xs text-muted-foreground truncate max-w-[100px] ml-2">{response.content}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
