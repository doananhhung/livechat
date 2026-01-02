import React, { useState, useRef, useEffect } from 'react';
import { useGetVisitorNotes, useCreateVisitorNote, useUpdateVisitorNote, useDeleteVisitorNote } from '../../../services/visitorApi';
import type { VisitorNote } from '@live-chat/shared-types';
import { Button } from '../../ui/Button';
import { Avatar } from '../../ui/Avatar';
import { formatMessageTime } from '../../../lib/dateUtils';
import { Trash2, Edit2, Check, X, Send } from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';

interface VisitorNoteListProps {
  projectId: number;
  visitorId: number;
}

export const VisitorNoteList: React.FC<VisitorNoteListProps> = ({ projectId, visitorId }) => {
  const { data: notes, isLoading } = useGetVisitorNotes(projectId, visitorId);
  const createMutation = useCreateVisitorNote();
  const updateMutation = useUpdateVisitorNote();
  const deleteMutation = useDeleteVisitorNote();
  const { user } = useAuthStore();

  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  
  const newNoteRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize new note textarea
  useEffect(() => {
    if (newNoteRef.current) {
      newNoteRef.current.style.height = 'auto';
      newNoteRef.current.style.height = Math.min(newNoteRef.current.scrollHeight, 120) + 'px';
    }
  }, [newNoteContent]);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;
    createMutation.mutate({
      projectId,
      visitorId,
      data: { content: newNoteContent },
    }, {
      onSuccess: () => setNewNoteContent('')
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (newNoteContent.trim()) {
        createMutation.mutate({
          projectId,
          visitorId,
          data: { content: newNoteContent },
        }, {
          onSuccess: () => setNewNoteContent('')
        });
      }
    }
  };

  const handleUpdateNote = (id: string) => {
    if (!editContent.trim()) return;
    updateMutation.mutate({
      projectId,
      visitorId,
      noteId: id,
      data: { content: editContent },
    }, {
      onSuccess: () => setEditingId(null)
    });
  };

  const handleDeleteNote = (id: string) => {
    if (!confirm('Delete this note?')) return;
    deleteMutation.mutate({ projectId, visitorId, noteId: id });
  };

  if (isLoading) return <div className="p-4 text-center text-muted-foreground">Loading notes...</div>;

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-card border-t mt-4 pt-4">
      <h3 className="font-semibold px-4 mb-2 text-foreground">Internal Notes</h3>
      
      <div className="flex-1 overflow-y-auto px-4 space-y-4 max-h-64">
        {notes?.length === 0 && <p className="text-sm text-muted-foreground italic">No notes yet.</p>}
        {notes?.map((note) => (
          <div key={note.id} className="group text-sm border rounded-md p-3 bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <Avatar name={note.author?.fullName} size="xs" />
              <span className="font-medium text-xs text-foreground">{note.author?.fullName || 'Agent'}</span>
              <span className="text-xs text-muted-foreground ml-auto">{formatMessageTime(new Date(note.createdAt))}</span>
            </div>
            
            {editingId === note.id ? (
              <div className="mt-2">
                <textarea 
                  className="w-full text-sm p-2 border rounded bg-background min-h-[60px]"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => handleUpdateNote(note.id)} disabled={updateMutation.isPending}><Check className="h-4 w-4 text-green-500" /></Button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <p className="whitespace-pre-wrap text-foreground break-words">{note.content}</p>
                <div className="absolute top-0 right-0 hidden group-hover:flex bg-muted/80 rounded p-1">
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setEditingId(note.id); setEditContent(note.content); }}>
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => handleDeleteNote(note.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="px-4 py-2 border-t mt-auto">
        <form onSubmit={handleAddNote} className="flex items-end gap-2">
          <textarea 
            ref={newNoteRef}
            className="flex-1 text-sm border rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary min-w-0 resize-none overflow-hidden min-h-[38px] max-h-[120px]"
            placeholder="Add a note..."
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <Button type="submit" size="icon" disabled={!newNoteContent.trim() || createMutation.isPending} className="flex-shrink-0 mb-0.5">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};
