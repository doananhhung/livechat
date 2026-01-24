import { type Node } from "@xyflow/react";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import { useTranslation } from "react-i18next";

interface NodeConfigPanelProps {
  selectedNode: Node | null;
  onChange: (nodeId: string, data: any) => void;
  onClose: () => void;
}

export const NodeConfigPanel = ({
  selectedNode,
  onChange,
  onClose,
}: NodeConfigPanelProps) => {
  const { t } = useTranslation();

  if (!selectedNode) return null;

  const handleChange = (key: string, value: any) => {
    onChange(selectedNode.id, {
      ...selectedNode.data,
      [key]: value,
    });
  };

  return (
    <div className="absolute top-4 right-4 bottom-4 w-80 bg-white shadow-xl rounded-lg border flex flex-col z-10">
      <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
        <h3 className="font-bold text-sm uppercase text-gray-700">
          {selectedNode.type} Configuration
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ✕
        </Button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        <div className="text-xs text-gray-400 mb-2">ID: {selectedNode.id}</div>

        {/* Start Node */}
        {selectedNode.type === "start" && (
          <p className="text-sm text-gray-600">
            This is the entry point of your workflow. It triggers when a visitor
            starts a conversation.
          </p>
        )}

        {/* Action Node */}
        {selectedNode.type === "action" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1">Tool</label>
              <select
                className="w-full border rounded p-2 text-sm"
                value={(selectedNode.data.toolName as string) || ""}
                onChange={(e) => handleChange("toolName", e.target.value)}
              >
                <option value="">Select a tool...</option>
                <option value="send_form">Send Form</option>
                <option value="change_status">Change Status</option>
                <option value="add_visitor_note">Add Note</option>
              </select>
            </div>

            {selectedNode.data.toolName === 'send_form' && (
              <div>
                <label className="block text-xs font-medium mb-1">Template ID</label>
                <Input
                  type="number"
                  placeholder="e.g. 1"
                  value={(selectedNode.data.toolArgs as any)?.templateId || ''}
                  onChange={(e) => handleChange('toolArgs', { ...(selectedNode.data.toolArgs as any), templateId: parseInt(e.target.value) })}
                />
              </div>
            )}

            {selectedNode.data.toolName === 'change_status' && (
              <div>
                <label className="block text-xs font-medium mb-1">New Status</label>
                <select
                  className="w-full border rounded p-2 text-sm"
                  value={(selectedNode.data.toolArgs as any)?.status || ''}
                  onChange={(e) => handleChange('toolArgs', { ...(selectedNode.data.toolArgs as any), status: e.target.value })}
                >
                  <option value="open">Open</option>
                  <option value="pending">Pending</option>
                  <option value="solved">Solved</option>
                </select>
              </div>
            )}

            {selectedNode.data.toolName === 'add_visitor_note' && (
              <div>
                <label className="block text-xs font-medium mb-1">Note Content</label>
                <Input
                  type="text"
                  placeholder="Note text..."
                  value={(selectedNode.data.toolArgs as any)?.content || ''}
                  onChange={(e) => handleChange('toolArgs', { ...(selectedNode.data.toolArgs as any), content: e.target.value })}
                />
              </div>
            )}
          </div>
        )}

        {/* LLM Node */}
        {selectedNode.type === "llm" && (
          <div>
            <label className="block text-xs font-medium mb-1">
              System Prompt
            </label>
            <textarea
              className="w-full border rounded p-2 text-sm h-32"
              placeholder="Instructions for the AI at this step..."
              value={(selectedNode.data.prompt as string) || ""}
              onChange={(e) => handleChange("prompt", e.target.value)}
            />
          </div>
        )}

        {/* Condition Node */}
        {selectedNode.type === "condition" && (
          <p className="text-sm text-gray-600">
            The AI will evaluate the visitor's intent and route to the
            appropriate path. (Branching configuration coming soon)
          </p>
        )}
      </div>
    </div>
  );
};
