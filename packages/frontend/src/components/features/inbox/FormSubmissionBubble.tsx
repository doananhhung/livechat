// src/components/features/inbox/FormSubmissionBubble.tsx
import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { Button } from "../../ui/Button";
import type {
  Message,
  FormSubmissionMetadata,
  ActionFieldDefinition,
} from "@live-chat/shared-types";
import { formatMessageTime } from "../../../lib/dateUtils";
import { useTranslation } from "react-i18next";

interface FormSubmissionBubbleProps {
  message: Message;
  onEdit?: (submissionId: string) => void;
  onDelete?: (submissionId: string) => void;
}

/**
 * Agent dashboard view of a filled form submission from visitor.
 * Shows key-value pairs of submitted data.
 */
export const FormSubmissionBubble: React.FC<FormSubmissionBubbleProps> = ({
  message,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true); // Default expanded
  const metadata = message.metadata as FormSubmissionMetadata | undefined;

  if (!metadata) {
    return <span className="text-muted-foreground">{message.content}</span>;
  }

  const data = metadata.data || {};
  const entries = Object.entries(data);

  /**
   * Format field value for display with i18n support.
   */
  const formatValue = (value: unknown): React.ReactNode => {
    if (value === null || value === undefined) {
      return "—";
    }
    if (typeof value === "boolean") {
      return value ? t("actions.formDisplay.yes") : t("actions.formDisplay.no");
    }

    const stringValue = String(value);

    // Date check (simple ISO check)
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(stringValue)) {
      try {
        const date = new Date(stringValue);
        if (!isNaN(date.getTime())) {
          return date.toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          });
        }
      } catch (e) {
        // ignore
      }
    }

    // URL check
    if (/^https?:\/\//i.test(stringValue)) {
      return (
        <a
          href={stringValue}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline break-all"
        >
          {stringValue.length > 50
            ? stringValue.substring(0, 47) + "..."
            : stringValue}
        </a>
      );
    }

    // Email check
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stringValue)) {
      return (
        <a
          href={`mailto:${stringValue}`}
          className="text-primary hover:underline"
        >
          {stringValue}
        </a>
      );
    }

    return stringValue;
  };

  return (
    <div className="border-2 rounded-xl p-6 max-w-lg w-full shadow-lg bg-success/10 border-success/30 relative">
      {/* Header */}
      <div
        className="flex items-center gap-2 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
        <span className="font-medium flex-1 text-foreground">
          {t("actions.formDisplay.templateSubmitted", {
            templateName: metadata.templateName,
          })}
        </span>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {/* Data entries (collapsible) */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-success/20 space-y-1.5 ml-6">
          {entries.length === 0 && (
            <div className="text-sm text-muted-foreground italic px-1">
              {t("actions.formDisplay.noDataSubmitted", "No data submitted")}
            </div>
          )}
          {entries.map(([key, value]) => (
            <div key={key} className="flex gap-2 text-sm">
              <span className="font-medium text-foreground">
                {formatFieldLabel(key)}:
              </span>
              <span className="text-muted-foreground break-all">
                {formatValue(value)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Footer with timestamp and actions */}
      {isExpanded && (
        <div className="mt-3 pt-2 border-t border-success/20 flex items-center justify-between ml-6">
          <span className="text-xs text-muted-foreground">
            {t("actions.formDisplay.submittedTime", {
              time: message.createdAt && formatMessageTime(message.createdAt),
            })}
          </span>
          <div className="flex gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(metadata.submissionId);
                }}
                className="h-7 px-2"
              >
                <Pencil className="h-3 w-3 mr-1" />
                {t("actions.formDisplay.edit")}
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(metadata.submissionId);
                }}
                className="h-7 px-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                {t("actions.formDisplay.delete")}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Convert camelCase or snake_case key to readable label.
 */
function formatFieldLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}
