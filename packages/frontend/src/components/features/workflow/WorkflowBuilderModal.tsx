import { useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { WorkflowEditor } from "./WorkflowEditor";
import { Button } from "../../ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/Dialog";
import type {
  WorkflowDefinition,
  WorkflowNode,
  WorkflowEdge,
} from "@live-chat/shared-types";

interface WorkflowBuilderModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialWorkflow: WorkflowDefinition | null;
  onSave: (workflow: WorkflowDefinition) => void;
}

export const WorkflowBuilderModal = ({
  isOpen,
  onOpenChange,
  initialWorkflow,
  onSave,
}: WorkflowBuilderModalProps) => {
  const { t } = useTranslation();
  const [nodes, setNodes] = useState<WorkflowNode[]>(initialWorkflow?.nodes || []);
  const [edges, setEdges] = useState<WorkflowEdge[]>(initialWorkflow?.edges || []);
  const [globalTools, setGlobalTools] = useState<string[]>(initialWorkflow?.globalTools || []);

  const handleChange = useCallback((newNodes: WorkflowNode[], newEdges: WorkflowEdge[], newGlobalTools: string[]) => {
    setNodes(newNodes);
    setEdges(newEdges);
    setGlobalTools(newGlobalTools);
  }, []);

  const handleSave = () => {
    const workflow: WorkflowDefinition = {
      nodes,
      edges,
      variables: initialWorkflow?.variables || {},
      globalTools,
    };
    onSave(workflow);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] w-[1200px] h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Workflow Editor</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 bg-gray-50 overflow-hidden relative">
          {isOpen && (
            <WorkflowEditor
              initialNodes={nodes}
              initialEdges={edges}
              initialGlobalTools={globalTools}
              onChange={handleChange}
            />
          )}
        </div>

        <div className="p-4 border-t flex justify-end gap-2 bg-white">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave}>{t("common.save")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
