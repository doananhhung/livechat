// src/components/features/inbox/FormFieldPreview.tsx
import { useTranslation } from "react-i18next";
import { type ActionFieldDefinition, ActionFieldType } from "@live-chat/shared-types";
import { cn } from "../../../lib/utils";

interface FormFieldPreviewProps {
  field: ActionFieldDefinition;
  value?: unknown;
}

/**
 * Reusable field display for form bubbles.
 * Shows placeholder when value is undefined, actual value otherwise.
 */
export const FormFieldPreview: React.FC<FormFieldPreviewProps> = ({ field, value }) => {
  const { t } = useTranslation();

  const renderValue = () => {
    // If no value provided, show placeholder based on type
    if (value === undefined || value === null) {
      return renderPlaceholder();
    }

    // Render actual value based on type
    switch (field.type) {
      case ActionFieldType.BOOLEAN:
        return value ? (
          <span className="text-green-600">✓ {t("actions.formDisplay.yes")}</span>
        ) : (
          <span className="text-red-600">✗ {t("actions.formDisplay.no")}</span>
        );
      case ActionFieldType.DATE:
        return <span>{String(value)}</span>;
      case ActionFieldType.SELECT:
        return <span>{String(value)}</span>;
      case ActionFieldType.NUMBER:
        return <span>{String(value)}</span>;
      case ActionFieldType.TEXT:
      default:
        return <span>{String(value)}</span>;
    }
  };

  const renderPlaceholder = () => {
    switch (field.type) {
      case ActionFieldType.BOOLEAN:
        return <span className="text-muted-foreground italic">[{t("actions.formDisplay.yesNo")}]</span>;
      case ActionFieldType.DATE:
        return <span className="text-muted-foreground italic">[{t("actions.formDisplay.dateField")}]</span>;
      case ActionFieldType.SELECT:
        return (
          <span className="text-muted-foreground italic">
            [{t("actions.formDisplay.options", { options: field.options?.join(", ") || "..." })}]
          </span>
        );
      case ActionFieldType.NUMBER:
        return <span className="text-muted-foreground italic">[{t("actions.formDisplay.numberField")}]</span>;
      case ActionFieldType.TEXT:
      default:
        return <span className="text-muted-foreground italic">[{t("actions.formDisplay.textField")}]</span>;
    }
  };

  return (
    <div className="flex items-center gap-2 text-sm py-0.5">
      <span className={cn("font-medium", field.required && "after:content-['*'] after:text-red-500 after:ml-0.5")}>
        {field.label}
      </span>
      <span className="text-muted-foreground">({field.type})</span>
      {value !== undefined && value !== null ? (
        <>
          <span className="text-muted-foreground">:</span>
          {renderValue()}
        </>
      ) : (
        renderPlaceholder()
      )}
    </div>
  );
};
