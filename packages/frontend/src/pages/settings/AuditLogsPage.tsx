import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuditLogTable } from '../../components/features/audit/AuditLogTable';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { ArrowLeft } from 'lucide-react';

export const AuditLogsPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const numericProjectId = projectId ? parseInt(projectId, 10) : undefined;
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!numericProjectId) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("common.back")}
        </Button>
        <h1 className="text-2xl font-bold text-foreground">{t("auditLogs.title")}</h1>
        <p className="text-muted-foreground">
          {t("auditLogs.description")}
        </p>
      </div>
      <AuditLogTable projectId={numericProjectId} />
    </div>
  );
};
