import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CannedResponseList } from '../../components/features/canned-responses/CannedResponseList';
import { PermissionGate } from '../../components/PermissionGate';
import { ProjectRole } from '@live-chat/shared-types';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { ArrowLeft } from 'lucide-react';

export const CannedResponsesPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const numericProjectId = projectId ? parseInt(projectId, 10) : undefined;
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!numericProjectId) return null;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t("cannedResponses.title")}</h1>
        <p className="text-muted-foreground">
          {t("cannedResponses.description")}
        </p>
      </div>
      <PermissionGate projectId={numericProjectId} requiredRole={ProjectRole.MANAGER} fallback={<p>{t("settings.managerOnlyBasic")}</p>}>
        <CannedResponseList projectId={numericProjectId} />
      </PermissionGate>
    </div>
  );
};
