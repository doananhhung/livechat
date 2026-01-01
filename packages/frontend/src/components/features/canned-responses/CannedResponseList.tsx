import React, { useState } from 'react';
import { useGetCannedResponses, useCreateCannedResponse, useUpdateCannedResponse, useDeleteCannedResponse } from '../../../services/cannedResponsesApi';
import type { CannedResponse } from '@live-chat/shared-types';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Spinner } from '../../ui/Spinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../ui/Dialog';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useToast } from '../../ui/use-toast';

interface CannedResponseListProps {
  projectId: number;
}

export const CannedResponseList: React.FC<CannedResponseListProps> = ({ projectId }) => {
  const { data: responses, isLoading } = useGetCannedResponses(projectId);
  const createMutation = useCreateCannedResponse();
  const updateMutation = useUpdateCannedResponse();
  const deleteMutation = useDeleteCannedResponse();
  const { toast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingResponse, setEditingResponse] = useState<CannedResponse | null>(null);
  const [formData, setFormData] = useState({ shortcut: '', content: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const filteredResponses = responses?.filter(r => 
    r.shortcut.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.content.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      projectId,
      data: formData,
    }, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setFormData({ shortcut: '', content: '' });
        toast({ title: 'Success', description: 'Canned response created' });
      },
      onError: (error: any) => {
        toast({ title: 'Error', description: error.response?.data?.message || 'Failed to create', variant: 'destructive' });
      }
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResponse) return;
    updateMutation.mutate({
      projectId,
      id: editingResponse.id,
      data: formData,
    }, {
      onSuccess: () => {
        setEditingResponse(null);
        setFormData({ shortcut: '', content: '' });
        toast({ title: 'Success', description: 'Canned response updated' });
      },
      onError: (error: any) => {
        toast({ title: 'Error', description: error.response?.data?.message || 'Failed to update', variant: 'destructive' });
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this response?')) return;
    deleteMutation.mutate({ projectId, id }, {
      onSuccess: () => toast({ title: 'Success', description: 'Deleted' }),
    });
  };

  if (isLoading) return <div className="flex justify-center p-8"><Spinner /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search shortcuts..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={() => { setIsCreateOpen(true); setFormData({ shortcut: '', content: '' }); }}>
          <Plus className="h-4 w-4 mr-2" /> Add Response
        </Button>
      </div>

      <div className="border rounded-md overflow-hidden bg-card">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Shortcut</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Content</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {filteredResponses.map((response) => (
              <tr key={response.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                  /{response.shortcut}
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground truncate max-w-md" title={response.content}>
                  {response.content}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Button variant="ghost" size="icon" onClick={() => {
                    setEditingResponse(response);
                    setFormData({ shortcut: response.shortcut, content: response.content });
                  }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(response.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {filteredResponses.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-sm text-muted-foreground">
                  No responses found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Canned Response</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Shortcut</label>
              <Input 
                value={formData.shortcut} 
                onChange={(e) => setFormData({...formData, shortcut: e.target.value.replace(/[^a-zA-Z0-9_-]/g, '')})} 
                placeholder="e.g. welcome"
                pattern="^[a-zA-Z0-9_-]+$"
                title="Letters, numbers, underscores, and dashes only"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">Trigger with /{formData.shortcut || 'shortcut'}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Content</label>
              <textarea 
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
                value={formData.content} 
                onChange={(e) => setFormData({...formData, content: e.target.value})} 
                placeholder="Hello! How can I help you?"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingResponse} onOpenChange={(open) => !open && setEditingResponse(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Canned Response</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Shortcut</label>
              <Input 
                value={formData.shortcut} 
                onChange={(e) => setFormData({...formData, shortcut: e.target.value.replace(/[^a-zA-Z0-9_-]/g, '')})} 
                pattern="^[a-zA-Z0-9_-]+$"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Content</label>
              <textarea 
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
                value={formData.content} 
                onChange={(e) => setFormData({...formData, content: e.target.value})} 
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingResponse(null)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>Update</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
