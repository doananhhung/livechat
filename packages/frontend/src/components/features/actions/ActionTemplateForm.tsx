import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import { useToast } from "../../ui/use-toast";
import { actionsApi } from "../../../services/actionApi";
import { ActionFieldEditor } from "./ActionFieldEditor";
import type { ActionTemplate, ActionFieldDefinition, ActionFieldType } from "@live-chat/shared-types";

interface ActionTemplateFormProps {
  projectId: number;
  template: ActionTemplate | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const defaultField: ActionFieldDefinition = {
  key: "",
  label: "",
  type: "text" as ActionFieldType,
  required: false,
};

export const ActionTemplateForm = ({
  projectId,
  template,
  onSuccess,
  onCancel,
}: ActionTemplateFormProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<ActionFieldDefinition[]>([{ ...defaultField }]);

  // Initialize form when editing
  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || "");
      setFields(
        template.definition?.fields?.length
          ? template.definition.fields
          : [{ ...defaultField }]
      );
    } else {
      setName("");
      setDescription("");
      setFields([{ ...defaultField }]);
    }
  }, [template]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; definition: { fields: ActionFieldDefinition[] } }) =>
      actionsApi.createTemplate(projectId, data),
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("actionTemplates.toast.created"),
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("actionTemplates.toast.createError"),
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; definition: { fields: ActionFieldDefinition[] } }) =>
      actionsApi.updateTemplate(projectId, template!.id, data),
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("actionTemplates.toast.updated"),
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("actionTemplates.toast.updateError"),
        variant: "destructive",
      });
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleAddField = () => {
    setFields([...fields, { ...defaultField }]);
  };

  const handleRemoveField = (index: number) => {
    if (fields.length > 1) {
      setFields(fields.filter((_, i) => i !== index));
    }
  };

  const handleFieldChange = (index: number, updatedField: ActionFieldDefinition) => {
    const newFields = [...fields];
    newFields[index] = updatedField;
    setFields(newFields);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!name.trim()) {
      toast({
        title: t("common.error"),
        description: t("actionTemplates.form.name") + " is required",
        variant: "destructive",
      });
      return;
    }

    // Validate fields have key and label
    for (const field of fields) {
      if (!field.key.trim() || !field.label.trim()) {
        toast({
          title: t("common.error"),
          description: t("actionTemplates.form.noFields"),
          variant: "destructive",
        });
        return;
      }
    }

    const data = {
      name: name.trim(),
      description: description.trim() || undefined,
      definition: { fields },
    };

    if (template) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          {t("actionTemplates.form.name")} <span className="text-destructive">*</span>
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("actionTemplates.form.namePlaceholder")}
          disabled={isPending}
          maxLength={100}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          {t("actionTemplates.form.description")}
        </label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("actionTemplates.form.descriptionPlaceholder")}
          disabled={isPending}
        />
      </div>

      {/* Fields */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          {t("actionTemplates.form.fields")} <span className="text-destructive">*</span>
        </label>
        <div className="space-y-3">
          {fields.map((field, index) => (
            <ActionFieldEditor
              key={index}
              field={field}
              onChange={(updated: ActionFieldDefinition) => handleFieldChange(index, updated)}
              onRemove={() => handleRemoveField(index)}
              canRemove={fields.length > 1}
              disabled={isPending}
            />
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddField}
          disabled={isPending}
          className="mt-3"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("actionTemplates.form.addField")}
        </Button>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending
            ? t("common.saving")
            : template
            ? t("common.update")
            : t("common.create")}
        </Button>
      </div>
    </form>
  );
};
