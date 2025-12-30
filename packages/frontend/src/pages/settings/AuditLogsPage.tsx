import React from 'react';
import { useParams } from 'react-router-dom';
import { AuditLogTable } from '../../components/features/audit/AuditLogTable';

export const AuditLogsPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const numericProjectId = projectId ? parseInt(projectId, 10) : undefined;

  if (!numericProjectId) return null;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground">
          View security events and critical actions for this project.
        </p>
      </div>
      <AuditLogTable projectId={numericProjectId} />
    </div>
  );
};
