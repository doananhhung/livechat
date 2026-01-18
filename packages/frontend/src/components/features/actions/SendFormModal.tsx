import { useState, useEffect } from 'react';
import { X, FileText, Send, Loader2 } from 'lucide-react';
import type { ActionTemplate } from '@live-chat/shared-types';
import { actionsApi } from '../../../services/actionApi';

interface SendFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  conversationId: string;
  onFormSent: () => void;
}

/**
 * Modal for agents to select and send a form to a visitor.
 */
export const SendFormModal = ({
  isOpen,
  onClose,
  projectId,
  conversationId,
  onFormSent,
}: SendFormModalProps) => {
  const [templates, setTemplates] = useState<ActionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen, projectId]);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await actionsApi.getTemplates(projectId);
      // Only show enabled templates
      setTemplates(data.filter(t => t.isEnabled));
    } catch {
      setError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!selectedTemplateId) return;
    
    setSending(true);
    setError(null);
    try {
      await actionsApi.sendFormRequest(conversationId, {
        templateId: selectedTemplateId,
      });
      onFormSent();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send form';
      setError(message);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Send Form to Visitor
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-4">{error}</div>
          ) : templates.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No enabled forms available</p>
              <p className="text-sm mt-1">Create and enable forms in project settings</p>
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplateId(template.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedTemplateId === template.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {template.name}
                  </div>
                  {template.description && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {template.description}
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mt-1">
                    {template.definition.fields.length} field(s)
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!selectedTemplateId || sending}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Form
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
