import React, { useState, useEffect } from 'react';
import type { Visitor } from '@live-chat/shared-types';
import { useTranslation } from 'react-i18next';
import { useUpdateVisitor } from '../../../features/inbox/hooks/useUpdateVisitor';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { PencilIcon, CheckIcon, XIcon } from 'lucide-react';
import { useToast } from '../../ui/use-toast';

interface VisitorNameEditorProps {
  visitor: Visitor;
  projectId: number;
}

export const VisitorNameEditor: React.FC<VisitorNameEditorProps> = ({ visitor, projectId }) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(visitor.displayName || '');
  const { toast } = useToast();

  const updateVisitorMutation = useUpdateVisitor();

  // Sync draftName when visitor changes (e.g., navigating between conversations)
  useEffect(() => {
    setDraftName(visitor.displayName || '');
    setIsEditing(false); // Also exit edit mode when visitor changes
  }, [visitor.id, visitor.displayName]);

  const handleSave = async () => {
    if (draftName.trim().length === 0 || draftName.length > 50) {
      toast({
        title: t('visitor.rename.validationError'),
        description: t('visitor.rename.validationDescription'),
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
        title: t('common.success'),
        description: t('visitor.rename.updateSuccess'),
      });
    } catch (error: any) {
      console.error('Failed to update visitor name:', error);
      toast({
        title: t('common.error'),
        description: error.message || t('visitor.rename.updateError'),
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
          aria-label={t('visitor.rename.saveAriaLabel')}
        >
          <CheckIcon className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleCancel} 
          disabled={updateVisitorMutation.isPending}
          aria-label={t('visitor.rename.cancelAriaLabel')}
        >
          <XIcon className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className="group flex items-center space-x-1 cursor-pointer"
      onMouseEnter={() => !isEditing && setIsEditing(false)}
      onMouseLeave={() => !isEditing && setIsEditing(false)}
    >
      <span className="font-semibold text-lg">{visitor.displayName || t('visitor.guest')}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => setIsEditing(true)}
        aria-label={t('visitor.rename.editAriaLabel')}
      >
        <PencilIcon className="h-3 w-3" />
      </Button>
    </div>
  );
};
