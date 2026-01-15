import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/Dialog';
import { Input } from '../../../components/ui/Input';
import type { Visitor } from '@live-chat/shared-types';
import { useUpdateVisitor } from '../../../features/inbox/hooks/useUpdateVisitor';
import { useToast } from '../../../components/ui/use-toast';

interface RenameVisitorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  visitor: Visitor;
  projectId: number;
}

export const RenameVisitorDialog: React.FC<RenameVisitorDialogProps> = ({
  isOpen,
  onClose,
  visitor,
  projectId,
}) => {
  const [draftName, setDraftName] = useState(visitor.displayName || '');
  const { toast } = useToast();
  const updateVisitorMutation = useUpdateVisitor();

  // Reset draftName when dialog opens or visitor changes
  useEffect(() => {
    setDraftName(visitor.displayName || '');
  }, [isOpen, visitor.displayName]);

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
      toast({
        title: 'Success',
        description: 'Visitor name updated.',
      });
      onClose();
    } catch (error: any) {
      console.error('Failed to update visitor name:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update visitor name.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rename Visitor</DialogTitle>
          <DialogDescription>
            Make changes to the visitor's display name here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="name" className="text-right">
              Name
            </label>
            <Input
              id="name"
              value={draftName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraftName(e.target.value)}
              maxLength={50}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={updateVisitorMutation.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSave}
            disabled={updateVisitorMutation.isPending || draftName.trim().length === 0 || draftName.length > 50}
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
