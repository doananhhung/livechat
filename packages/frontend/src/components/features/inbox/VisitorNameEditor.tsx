import React, { useState } from 'react';
import type { Visitor } from '@live-chat/shared-types'; // Changed to type import
import { useUpdateVisitor } from '../../../features/inbox/hooks/useUpdateVisitor';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { PencilIcon, CheckIcon, XIcon } from 'lucide-react'; // Assuming lucide-react icons
import { useToast } from '../../ui/use-toast';

interface VisitorNameEditorProps {
  visitor: Visitor;
  projectId: number;
}

export const VisitorNameEditor: React.FC<VisitorNameEditorProps> = ({ visitor, projectId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(visitor.displayName || '');
  const { toast } = useToast();

  const updateVisitorMutation = useUpdateVisitor();

  const handleSave = async () => {
    if (draftName.trim().length === 0 || draftName.length > 50) {
      toast({
        title: 'Validation Error',
        description: 'Display name must be between 1 and 50 characters.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateVisitorMutation.mutateAsync({
        projectId,
        visitorId: visitor.id,
        displayName: draftName,
      });
      setIsEditing(false);
      toast({
        title: 'Success',
        description: 'Visitor name updated.',
      });
    } catch (error: any) {
      console.error('Failed to update visitor name:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update visitor name.',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    setDraftName(visitor.displayName || '');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center space-x-2">
        <Input
          value={draftName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraftName(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
          maxLength={50}
          className="h-8 flex-grow"
          autoFocus
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSave}
          disabled={updateVisitorMutation.isPending || draftName.trim().length === 0 || draftName.length > 50}
          aria-label="Save name"
        >
          <CheckIcon className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleCancel} 
          disabled={updateVisitorMutation.isPending}
          aria-label="Cancel editing"
        >
          <XIcon className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className="group flex items-center space-x-1 cursor-pointer"
      onMouseEnter={() => !isEditing && setIsEditing(false)} // No need to set isEditing to false on hover
      onMouseLeave={() => !isEditing && setIsEditing(false)} // No need to set isEditing to false on hover
    >
      <span className="font-semibold text-lg">{visitor.displayName || 'Visitor'}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => setIsEditing(true)}
        aria-label="Edit visitor name"
      >
        <PencilIcon className="h-3 w-3" />
      </Button>
    </div>
  );
};
