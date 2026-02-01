import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/Spinner";
import { useToast } from "../../components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/Dialog";
import { actionsApi } from "../../services/actionApi";
import { ActionTemplateForm } from "../../components/features/actions/ActionTemplateForm";
import type { ActionTemplate } from "@live-chat/shared-types";

export const ActionTemplatesPage = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { projectId } = useParams<{ projectId: string }>();
  const projectIdNum = Number(projectId);

  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ActionTemplate | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ActionTemplate | null>(null);

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["actionTemplates", projectIdNum],
    queryFn: () => actionsApi.getTemplates(projectIdNum),
    enabled: !!projectIdNum,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (templateId: number) =>
      actionsApi.deleteTemplate(projectIdNum, templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actionTemplates", projectIdNum] });
      toast({
        title: t("common.success"),
        description: t("actionTemplates.toast.deleted"),
      });
      setDeleteConfirm(null);
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("actionTemplates.toast.deleteError"),
        variant: "destructive",
      });
    },
  });

  // Toggle mutation
  const toggleMutation = useMutation({
    mutationFn: (templateId: number) =>
      actionsApi.toggleTemplate(projectIdNum, templateId),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["actionTemplates", projectIdNum] });
      toast({
        title: t("common.success"),
        description: updated.isEnabled
          ? t("actionTemplates.toast.enabled")
          : t("actionTemplates.toast.disabled"),
      });
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("actionTemplates.toast.updateError"),
        variant: "destructive",
      });
    },
  });

  const handleAdd = () => {
    setEditingTemplate(null);
    setShowForm(true);
  };

  const handleEdit = (template: ActionTemplate) => {
    setEditingTemplate(template);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingTemplate(null);
  };

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["actionTemplates", projectIdNum] });
    setShowForm(false);
    setEditingTemplate(null);
  };

  if (isLoading) {
    return (
      <div className="flex w-full h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t("actionTemplates.title")}
            </h1>
            <p className="text-muted-foreground">
              {t("actionTemplates.description")}
            </p>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            {t("actionTemplates.addTemplate")}
          </Button>
        </div>
      </div>

      {/* Templates Table */}
      {templates.length === 0 ? (
        <div className="bg-card border rounded-lg p-8 text-center">
          <p className="text-muted-foreground mb-4">
            {t("actionTemplates.noTemplates")}
          </p>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            {t("actionTemplates.addTemplate")}
          </Button>
        </div>
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("actionTemplates.table.name")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("actionTemplates.table.description")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("actionTemplates.table.fields")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("actionTemplates.table.status")}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("actionTemplates.table.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {templates.map((template) => (
                <tr key={template.id} className="hover:bg-muted/30">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-foreground">
                      {template.name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-muted-foreground text-sm truncate max-w-xs block">
                      {template.description || "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-muted-foreground">
                      {template.definition?.fields?.length || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        template.isEnabled
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                      }`}
                    >
                      {template.isEnabled
                        ? t("actionTemplates.table.enabled")
                        : t("actionTemplates.table.disabled")}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleMutation.mutate(template.id)}
                        disabled={toggleMutation.isPending}
                        title={
                          template.isEnabled
                            ? t("actionTemplates.table.disabled")
                            : t("actionTemplates.table.enabled")
                        }
                      >
                        {template.isEnabled ? (
                          <ToggleRight className="h-4 w-4 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(template)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirm(template)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate
                ? t("actionTemplates.editTemplate")
                : t("actionTemplates.addTemplate")}
            </DialogTitle>
          </DialogHeader>
          <ActionTemplateForm
            projectId={projectIdNum}
            template={editingTemplate}
            onSuccess={handleFormSuccess}
            onCancel={handleFormClose}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("actionTemplates.deleteTemplate")}</DialogTitle>
            <DialogDescription>
              {t("actionTemplates.deleteConfirm")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t("common.deleting") : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
