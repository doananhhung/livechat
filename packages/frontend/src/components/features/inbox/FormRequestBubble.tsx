// src/components/features/inbox/FormRequestBubble.tsx
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight, ChevronDown, ClipboardList } from "lucide-react";
import { cn } from "../../../lib/utils";
import { FormFieldPreview } from "./FormFieldPreview";
import { useTypingStore } from "../../../stores/typingStore";
import type { Message, FormRequestMetadata } from "@live-chat/shared-types";

interface FormRequestBubbleProps {
  message: Message;
  conversationId: number;
}

type FormStatus = "pending" | "filling" | "submitted" | "expired";

/**
 * Agent dashboard view of a form request sent to visitor.
 * Shows read-only preview with expand/collapse and status indicator.
 */
export const FormRequestBubble: React.FC<FormRequestBubbleProps> = ({
  message,
  conversationId,
}) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const metadata = message.metadata as FormRequestMetadata | undefined;
  const { fillingStatus } = useTypingStore();

  // Determine form status
  const status = useMemo((): FormStatus => {
    if (!metadata) return "pending";

    // Check if expired
    if (metadata.expiresAt) {
      const expiresAt = new Date(metadata.expiresAt);
      if (expiresAt < new Date()) {
        return "expired";
      }
    }

    // Check if submitted (via metadata)
    // The backend now syncs this, and SocketContext updates it in real-time
    if (metadata.submissionId) {
      return "submitted";
    }
    // Check if visitor is filling
    const isFilling = fillingStatus?.[conversationId];
    if (isFilling) {
      return "filling";
    }

    // TODO: Check if submitted by looking for form_submission message
    // For now, default to pending
    return "pending";
  }, [metadata, conversationId, fillingStatus]);

  if (!metadata) {
    return <span className="text-muted-foreground">{message.content}</span>;
  }

  const fields = metadata.definition?.fields || [];
  const isExpired = status === "expired";

  return (
    <div
      className={cn(
        "border-2 rounded-xl p-6 max-w-lg w-full shadow-lg transition-all",
        isExpired
          ? "bg-muted/50 border-dashed border-muted-foreground/30"
          : "bg-card border-border",
      )}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <ClipboardList className="h-4 w-4 text-primary flex-shrink-0" />
        <span
          className={cn(
            "font-medium flex-1",
            isExpired && "line-through text-muted-foreground",
          )}
        >
          {metadata.templateName}
        </span>
        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          {t("actions.formDisplay.fields", { count: fields.length })}
        </span>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {/* Description (if any) */}
      {metadata.templateDescription && !isExpired && (
        <p className="text-sm text-muted-foreground mt-1 ml-6">
          {metadata.templateDescription}
        </p>
      )}

      {/* Field list (collapsible) */}
      {isExpanded && !isExpired && (
        <div className="mt-3 pt-3 border-t border-border space-y-1 ml-6">
          {fields.map((field) => (
            <FormFieldPreview key={field.key} field={field} />
          ))}
        </div>
      )}

      {/* Status indicator */}
      <div className="mt-2 ml-6">
        <StatusIndicator status={status} />
      </div>
    </div>
  );
};

const StatusIndicator: React.FC<{ status: FormStatus }> = ({ status }) => {
  const { t } = useTranslation();

  switch (status) {
    case "filling":
      return (
        <span className="text-xs text-blue-600 animate-pulse flex items-center gap-1">
          ✏️ {t("actions.formDisplay.visitorFilling")}
        </span>
      );
    case "submitted":
      return (
        <span className="text-xs text-green-600 flex items-center gap-1">
          ✓ {t("actions.formDisplay.submitted")}
        </span>
      );
    case "expired":
      return (
        <span className="text-xs text-red-500 flex items-center gap-1">
          ⏱️ {t("actions.formDisplay.expired")}
        </span>
      );
    case "pending":
    default:
      return (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          ⏳ {t("actions.formDisplay.awaitingResponse")}
        </span>
      );
  }
};
