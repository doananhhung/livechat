import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import { ActionFieldType, type ActionFieldDefinition } from "@live-chat/shared-types";

interface ActionFieldEditorProps {
  field: ActionFieldDefinition;
  onChange: (field: ActionFieldDefinition) => void;
  onRemove: () => void;
  canRemove: boolean;
  disabled?: boolean;
}

export const ActionFieldEditor = ({
  field,
  onChange,
  onRemove,
  canRemove,
  disabled,
}: ActionFieldEditorProps) => {
  const { t } = useTranslation();

  const handleChange = (key: keyof ActionFieldDefinition, value: any) => {
    onChange({ ...field, [key]: value });
  };

  // Auto-generate key from label
  const handleLabelChange = (label: string) => {
    const autoKey = label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
    
    // Only auto-update key if it was empty or matched the previous auto-generated key
    const prevAutoKey = field.label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
    
    if (!field.key || field.key === prevAutoKey) {
      onChange({ ...field, label, key: autoKey });
    } else {
      onChange({ ...field, label });
    }
  };

  return (
    <div className="bg-muted/30 p-4 rounded-lg border">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Label */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            {t("actionTemplates.form.fieldLabel")}
          </label>
          <Input
            value={field.label}
            onChange={(e) => handleLabelChange(e.target.value)}
            placeholder="e.g., Order ID"
            disabled={disabled}
          />
        </div>

        {/* Key */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            {t("actionTemplates.form.fieldKey")}
          </label>
          <Input
            value={field.key}
            onChange={(e) => handleChange("key", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
            placeholder="e.g., order_id"
            disabled={disabled}
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            {t("actionTemplates.form.fieldType")}
          </label>
          <select
            value={field.type}
            onChange={(e) => handleChange("type", e.target.value as ActionFieldType)}
            disabled={disabled}
            className="w-full h-9 px-3 py-1 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value={ActionFieldType.TEXT}>{t("actionTemplates.types.text")}</option>
            <option value={ActionFieldType.NUMBER}>{t("actionTemplates.types.number")}</option>
            <option value={ActionFieldType.DATE}>{t("actionTemplates.types.date")}</option>
            <option value={ActionFieldType.BOOLEAN}>{t("actionTemplates.types.boolean")}</option>
            <option value={ActionFieldType.SELECT}>{t("actionTemplates.types.select")}</option>
          </select>
        </div>

        {/* Required */}
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e) => handleChange("required", e.target.checked)}
              disabled={disabled}
              className="w-4 h-4 rounded border-input"
            />
            <span className="text-sm">{t("actionTemplates.form.fieldRequired")}</span>
          </label>
        </div>
      </div>

      {/* Options (for SELECT type) */}
      {field.type === ActionFieldType.SELECT && (
        <div className="mt-3">
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            {t("actionTemplates.form.fieldOptions")}
          </label>
          <div className="space-y-2">
            {[...(field.options || []), ""].map((option, index) => (
              <Input
                key={index}
                value={option}
                onChange={(e) => {
                  const newOptions = [...(field.options || [])];
                  if (index < newOptions.length) {
                    if (e.target.value) {
                      newOptions[index] = e.target.value;
                    } else {
                      newOptions.splice(index, 1);
                    }
                  } else if (e.target.value) {
                    newOptions.push(e.target.value);
                  }
                  handleChange("options", newOptions);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const nextInput = document.getElementById(`option-${field.key}-${index + 1}`);
                    nextInput?.focus();
                  }
                }}
                id={`option-${field.key}-${index}`}
                placeholder={index === 0 ? "e.g., Low" : "Add another option..."}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      )}

      {/* Remove button */}
      {canRemove && (
        <div className="mt-3 flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            disabled={disabled}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            {t("actionTemplates.form.removeField")}
          </Button>
        </div>
      )}
    </div>
  );
};
