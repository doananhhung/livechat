import React, { useState } from 'react';
import { useGetAuditLogs } from '../../../services/auditApi';
import type { AuditLogDto } from '@live-chat/shared-types';
import { AuditAction } from '@live-chat/shared-types';
import { Spinner } from '../../ui/Spinner';
import { Button } from '../../ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/Dialog';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

interface AuditLogTableProps {
  projectId: number;
}

/**
 * Returns Tailwind classes for action badge based on action type.
 */
const getActionBadgeColor = (action: AuditAction): string => {
  switch (action) {
    case AuditAction.DELETE:
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
    case AuditAction.CREATE:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
    case AuditAction.UPDATE:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
    case AuditAction.LOGIN:
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100';
    case AuditAction.LOGOUT:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
    default:
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
  }
};

export const AuditLogTable: React.FC<AuditLogTableProps> = ({ projectId }) => {
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLogDto | null>(null);
  const { t } = useTranslation();
  
  // Basic filtering state (could be expanded)
  const [actionFilter, setActionFilter] = useState<AuditAction | undefined>(undefined);

  const { data, isLoading } = useGetAuditLogs(projectId, {
    page,
    limit: 20,
    action: actionFilter,
  });

  const logs = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  if (isLoading) {
    return <div className="flex justify-center p-8"><Spinner /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-foreground">{t("auditLogs.title")}</h3>
        <select 
          className="border rounded p-1 text-sm bg-background text-foreground border-input"
          value={actionFilter || ''}
          onChange={(e) => {
            const val = e.target.value as AuditAction;
            setActionFilter(val || undefined);
            setPage(1);
          }}
        >
          <option value="">{t("auditLogs.table.allActions")}</option>
          {Object.values(AuditAction).map(action => (
            <option key={action} value={action}>{action}</option>
          ))}
        </select>
      </div>

      <div className="border rounded-md overflow-hidden">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("auditLogs.table.date")}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("auditLogs.table.actor")}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("auditLogs.table.action")}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("auditLogs.table.entity")}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("auditLogs.table.details")}</th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                  {log.actorId ? (
                    <span title={log.actorId}>{t("auditLogs.table.user")}</span>
                  ) : (
                    <span className="text-muted-foreground italic">{log.actorType}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionBadgeColor(log.action)}`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {log.entity} <span className="text-xs text-muted-foreground/70">({log.entityId.substring(0, 8)}...)</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>{t("common.view")}</Button>
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-muted-foreground">
                  {t("auditLogs.table.noLogs")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            {t("common.previous")}
          </Button>
          <span className="text-sm flex items-center text-muted-foreground">
            {t("common.pageOf", { page, total: totalPages })}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            {t("common.next")}
          </Button>
        </div>
      )}

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("auditLogs.dialog.title")}</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>{t("auditLogs.dialog.action")}:</strong> {selectedLog.action}</div>
                <div><strong>{t("auditLogs.dialog.actor")}:</strong> {selectedLog.actorType} ({selectedLog.actorId || 'N/A'})</div>
                <div><strong>{t("auditLogs.dialog.date")}:</strong> {new Date(selectedLog.createdAt).toLocaleString()}</div>
                <div><strong>{t("auditLogs.dialog.ipAddress")}:</strong> {selectedLog.ipAddress || 'N/A'}</div>
              </div>
              <div>
                <strong>{t("auditLogs.dialog.metadata")}:</strong>
                <pre className="bg-muted p-4 rounded-md text-xs overflow-auto mt-2 max-h-96 text-foreground">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
