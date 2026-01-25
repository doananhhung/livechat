import { useMemo } from "react";
import type { FormSubmissionMetadata } from "@live-chat/shared-types";

interface FormSubmissionMessageProps {
  metadata: FormSubmissionMetadata;
  theme: "light" | "dark";
  isFromVisitor: boolean;
  primaryColor?: string;
}

/**
 * Renders a submitted form as a read-only display in chat.
 */
export const FormSubmissionMessage = ({
  metadata,
  theme,
  isFromVisitor,
  primaryColor,
}: FormSubmissionMessageProps) => {
  // Dynamic styles based on theme and sender
  const containerStyle = useMemo(
    () => ({
      backgroundColor: isFromVisitor
        ? "var(--widget-primary-color, #2563eb)"
        : "var(--widget-bubble-agent-bg)",
      color: isFromVisitor ? "var(--widget-text-on-primary, #ffffff)" : "var(--widget-bubble-agent-text)",
      borderRadius: "12px",
      padding: "16px",
      maxWidth: "320px",
      width: "100%",
      margin: "4px 0",
      boxShadow: isFromVisitor ? "0 2px 4px rgba(0,0,0,0.1)" : "none",
      border: isFromVisitor ? "none" : "1px solid var(--widget-card-border)",
    }),
    [isFromVisitor],
  );

  const headerStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "12px",
    paddingBottom: "8px",
    borderBottom: `1px solid ${isFromVisitor ? "rgba(255,255,255,0.2)" : "var(--widget-card-border)"}`,
  };

  const titleStyle = {
    fontSize: "13px",
    fontWeight: 600,
    opacity: 0.95,
  };

  const gridStyle = {
    display: "grid",
    gap: "8px",
  };

  const itemStyle = {
    display: "flex",
    flexDirection: "column" as const,
    gap: "2px",
  };

  const labelStyle = {
    fontSize: "11px",
    fontWeight: 500,
    opacity: 0.75,
    textTransform: "uppercase" as const,
    letterSpacing: "0.02em",
  };

  const valueStyle = {
    fontSize: "14px",
    fontWeight: 400,
    wordBreak: "break-word" as const,
  };

  const entries = Object.entries(metadata.data);

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <span style={{ fontSize: "14px" }}>✓</span>
        <span style={titleStyle}>
          {metadata.templateName || "Form Submitted"}
        </span>
      </div>

      {/* Body */}
      <div style={gridStyle}>
        {entries.map(([key, value]) => (
          <div key={key} style={itemStyle}>
            <div style={labelStyle}>{key}</div>
            <div style={valueStyle}>
              {typeof value === "boolean"
                ? value
                  ? "Yes"
                  : "No"
                : value === null || value === undefined
                  ? "-"
                  : String(value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
