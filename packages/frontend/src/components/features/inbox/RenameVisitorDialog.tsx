import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/Dialog";
import { Input } from "../../../components/ui/Input";
import type { Visitor } from "@live-chat/shared-types";
import { useUpdateVisitor } from "../../../features/inbox/hooks/useUpdateVisitor";
import { useToast } from "../../../components/ui/use-toast";

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
  const { t } = useTranslation();
  const [draftName, setDraftName] = useState(visitor.displayName || "");
  const { toast } = useToast();
  const updateVisitorMutation = useUpdateVisitor();

  // Reset draftName when dialog opens or visitor changes
  useEffect(() => {
    setDraftName(visitor.displayName || "");
  }, [isOpen, visitor.displayName]);

  const handleSave = async () => {
    if (draftName.trim().length === 0 || draftName.length > 50) {
      toast({
        title: t("visitor.rename.validationError"),
        description: t("visitor.rename.validationDescription"),
        variant: "destructive",
      });
      return;
    }

    try {
      await updateVisitorMutation.mutateAsync({
        projectId,
        visitorId: visitor.id,
        dto: { displayName: draftName },
      });
      toast({
        title: t("common.success"),
        description: t("visitor.rename.updateSuccess"),
      });
      onClose();
    } catch (error: any) {
      console.error("Failed to update visitor name:", error);
      toast({
        title: t("common.error"),
        description: error.message || t("visitor.rename.updateError"),
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("visitor.rename.title")}</DialogTitle>
          <DialogDescription>
            {t("visitor.rename.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="name" className="text-right">
              {t("visitor.rename.nameLabel")}
            </label>
            <Input
              id="name"
              value={draftName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setDraftName(e.target.value)
              }
              maxLength={50}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={updateVisitorMutation.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            onClick={handleSave}
            disabled={
              updateVisitorMutation.isPending ||
              draftName.trim().length === 0 ||
              draftName.length > 50
            }
          >
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
