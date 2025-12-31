import React, { useState } from 'react';
import { useGetAuditLogs } from '../../../services/auditApi';
import type { AuditLogDto } from '@live-chat/shared-types';
import { AuditAction } from '@live-chat/shared-types';
import { Spinner } from '../../ui/Spinner';
import { Button } from '../../ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/Dialog';
import { format } from 'date-fns';

interface AuditLogTableProps {
  projectId: number;
}

export const AuditLogTable: React.FC<AuditLogTableProps> = ({ projectId }) => {
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLogDto | null>(null);
  
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
        <h3 className="text-lg font-medium text-foreground">Audit Logs</h3>
        <select 
          className="border rounded p-1 text-sm bg-background text-foreground border-input"
          value={actionFilter || ''}
          onChange={(e) => {
            const val = e.target.value as AuditAction;
            setActionFilter(val || undefined);
            setPage(1);
          }}
        >
          <option value="">All Actions</option>
          {Object.values(AuditAction).map(action => (
            <option key={action} value={action}>{action}</option>
          ))}
        </select>
      </div>

      <div className="border rounded-md overflow-hidden">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Entity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Details</th>
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
                    <span title={log.actorId}>User</span>
                  ) : (
                    <span className="text-muted-foreground italic">{log.actorType}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {log.entity} <span className="text-xs text-muted-foreground/70">({log.entityId.substring(0, 8)}...)</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>View</Button>
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-muted-foreground">
                  No logs found.
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
            Previous
          </Button>
          <span className="text-sm flex items-center text-muted-foreground">Page {page} of {totalPages}</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Action:</strong> {selectedLog.action}</div>
                <div><strong>Actor:</strong> {selectedLog.actorType} ({selectedLog.actorId || 'N/A'})</div>
                <div><strong>Date:</strong> {new Date(selectedLog.createdAt).toLocaleString()}</div>
                <div><strong>IP Address:</strong> {selectedLog.ipAddress || 'N/A'}</div>
              </div>
              <div>
                <strong>Metadata:</strong>
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
