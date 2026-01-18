import React, { useEffect, useState } from "react";
import { type ActionSubmission } from "@live-chat/shared-types";
import { actionsApi } from "../../../services/actionApi";
import { Spinner } from "../../ui/Spinner";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import { vi, enUS } from "date-fns/locale";

interface ActionHistoryProps {
  conversationId: string;
}

export const ActionHistory: React.FC<ActionHistoryProps> = ({ conversationId }) => {
  const { t, i18n } = useTranslation();
  const [submissions, setSubmissions] = useState<ActionSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get date-fns locale based on current i18n language
  const dateLocale = i18n.language === "vi" ? vi : enUS;

  useEffect(() => {
    loadHistory();
  }, [conversationId]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await actionsApi.getSubmissions(conversationId);
      setSubmissions(data);
    } catch (error) {
      console.error("Failed to load action history", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Translate status
  const getStatusText = (status: string): string => {
    const statusKey = `actions.historyStatus.${status.toLowerCase()}`;
    return t(statusKey, status);
  };

  if (isLoading) return <Spinner />;

  if (submissions.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4 text-sm">
        {t("actions.noHistory")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {submissions.map((submission) => (
        <div key={submission.id} className="border rounded-md p-3 text-sm bg-muted/50">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="font-semibold block">{submission.template?.name || t("actions.unknownTemplate")}</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(submission.createdAt), { addSuffix: true, locale: dateLocale })}
                {" • "}
                {getStatusText(submission.status)}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {Object.entries(submission.data).map(([key, value]) => {
                // Try to find the label from the template definition
                const fieldDef = submission.template?.definition?.fields.find(f => f.key === key);
                const label = fieldDef ? fieldDef.label : key;

                return (
                  <React.Fragment key={key}>
                    <div className="text-muted-foreground font-medium truncate" title={label}>
                        {label}:
                    </div>
                    <div className="truncate" title={String(value)}>
                      {String(value)}
                    </div>
                  </React.Fragment>
                );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
