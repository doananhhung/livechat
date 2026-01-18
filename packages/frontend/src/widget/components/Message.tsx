import { type WidgetMessageDto as MessageType, MessageContentType } from "@live-chat/shared-types";
import type { FormRequestMetadata, FormSubmissionMetadata } from "@live-chat/shared-types";
import { useMemo } from "preact/hooks";
import { isColorLight } from "../utils/color";
import { FormRequestMessage } from "./FormRequestMessage";
import { FormSubmissionMessage } from "./FormSubmissionMessage";

interface MessageProps {
  message: MessageType;
  primaryColor?: string;
  theme: 'light' | 'dark';
  onFormSubmit?: (messageId: string, data: Record<string, unknown>) => Promise<void>;
  submittedFormMessageIds?: Set<string>;
}

/**
 * Sanitize message content to prevent XSS attacks
 * Converts plain text to HTML-safe text while preserving line breaks
 */
function sanitizeContent(content: string): string {
  const div = document.createElement("div");
  div.textContent = content;
  // Preserve line breaks
  return div.innerHTML.replace(/\n/g, "<br>");
}

const SpinnerIcon = () => (
  <svg
    className="animate-spin h-4 w-4 text-gray-400"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      stroke-width="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

const ErrorIcon = () => (
  <svg
    className="h-4 w-4 text-red-500"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fill-rule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 13a1 1 0 112 0v-5a1 1 0 11-2 0v5zm2-8a1 1 0 10-2 0 1 1 0 002 0z"
      clip-rule="evenodd"
    />
  </svg>
);

export const Message = ({ 
  message, 
  primaryColor, 
  theme,
  onFormSubmit,
  submittedFormMessageIds,
}: MessageProps) => {
  const isVisitor = message.sender.type === "visitor";
  const contentType = (message as any).contentType as MessageContentType | undefined;
  const metadata = (message as any).metadata;

  // Handle form_request content type
  if (contentType === MessageContentType.FORM_REQUEST && metadata) {
    const formMetadata = metadata as FormRequestMetadata;
    const isExpired = formMetadata.expiresAt 
      ? new Date(formMetadata.expiresAt) < new Date() 
      : false;
    const isSubmitted = submittedFormMessageIds?.has(String(message.id)) ?? false;

    return (
      <div className="flex items-end my-1 gap-2 justify-start">
        <FormRequestMessage
          metadata={formMetadata}
          messageId={String(message.id)}
          onSubmit={onFormSubmit || (async () => {})}
          primaryColor={primaryColor}
          theme={theme}
          isExpired={isExpired}
          isSubmitted={isSubmitted}
        />
      </div>
    );
  }

  // Handle form_submission content type
  if (contentType === MessageContentType.FORM_SUBMISSION && metadata) {
    const submissionMetadata = metadata as FormSubmissionMetadata;
    return (
      <div className={`flex items-end my-1 gap-2 ${isVisitor ? "justify-end" : "justify-start"}`}>
        <FormSubmissionMessage
          metadata={submissionMetadata}
          theme={theme}
          isFromVisitor={isVisitor}
          primaryColor={primaryColor}
        />
      </div>
    );
  }

  // Default: text message
  // Memoize sanitized content to avoid recalculating on every render
  const sanitizedContent = useMemo(
    () => sanitizeContent(message.content || ''),
    [message.content]
  );

  const bubbleClass = isVisitor
    ? "rounded-l-xl rounded-t-xl"
    : "rounded-r-xl rounded-t-xl";

  const bubbleStyle = useMemo(() => {
    if (isVisitor) {
      return {
        // Use gradient if defined in CSS, fallback to primaryColor
        background: 'var(--widget-primary-gradient, var(--widget-primary-color))',
        backgroundColor: primaryColor || '#2563eb', // Fallback
        color: '#ffffff', // Always white on primary gradient
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)", // Subtle shadow
      };
    } else {
      return {
        backgroundColor: theme === 'light' ? '#f3f4f6' : '#374151',
        color: theme === 'light' ? '#1f2937' : '#e5e7eb',
        // Slight border for contrast in light mode
        border: theme === 'light' ? '1px solid #e5e7eb' : 'none',
      };
    }
  }, [isVisitor, primaryColor, theme]);

  return (
    <div
      className={`flex items-end my-1 gap-2 ${isVisitor ? "justify-end" : "justify-start"}`}
      role="article"
      aria-label={`${isVisitor ? "Your" : "Agent"} message`}
    >
      <div
        className={`py-2 px-3 max-w-xs shadow-sm ${bubbleClass}`}
        style={bubbleStyle}
      >
        <p
          className="break-words"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
      </div>
      <div className="flex-shrink-0" role="status" aria-live="polite">
        {message.status === "sending" && (
          <span aria-label="Sending message">
            <SpinnerIcon />
          </span>
        )}
        {message.status === "failed" && (
          <span aria-label="Failed to send message">
            <ErrorIcon />
          </span>
        )}
      </div>
    </div>
  );
};