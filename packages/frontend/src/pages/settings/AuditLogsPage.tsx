import React from 'react';
import { useParams } from 'react-router-dom';
import { AuditLogTable } from '../../components/features/audit/AuditLogTable';
import { useTranslation } from 'react-i18next';

export const AuditLogsPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const numericProjectId = projectId ? parseInt(projectId, 10) : undefined;
  const { t } = useTranslation();

  if (!numericProjectId) return null;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{t("auditLogs.title")}</h1>
        <p className="text-muted-foreground">
          {t("auditLogs.description")}
        </p>
      </div>
      <AuditLogTable projectId={numericProjectId} />
    </div>
  );
};
