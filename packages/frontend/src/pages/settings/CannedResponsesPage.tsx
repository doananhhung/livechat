import React from 'react';
import { useParams } from 'react-router-dom';
import { CannedResponseList } from '../../components/features/canned-responses/CannedResponseList';
import { PermissionGate } from '../../components/PermissionGate';
import { ProjectRole } from '@live-chat/shared-types';
import { useTranslation } from 'react-i18next';

export const CannedResponsesPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const numericProjectId = projectId ? parseInt(projectId, 10) : undefined;
  const { t } = useTranslation();

  if (!numericProjectId) return null;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{t("cannedResponses.title")}</h1>
        <p className="text-muted-foreground">
          {t("cannedResponses.description")}
        </p>
      </div>
      <PermissionGate projectId={numericProjectId} requiredRole={ProjectRole.MANAGER} fallback={<p>Only managers can access this page.</p>}>
        <CannedResponseList projectId={numericProjectId} />
      </PermissionGate>
    </div>
  );
};
