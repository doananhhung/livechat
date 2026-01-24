import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type NodeTypes,
  type Node,
  type OnNodesChange,
  applyNodeChanges,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { StartNode } from "./nodes/StartNode";
import { ActionNode } from "./nodes/ActionNode";
import { LlmNode } from "./nodes/LlmNode";
import { ConditionNode } from "./nodes/ConditionNode";
import { NodeConfigPanel } from "./NodeConfigPanel";
import type { WorkflowNode, WorkflowEdge } from "@live-chat/shared-types";

interface WorkflowEditorProps {
  initialNodes?: WorkflowNode[];
  initialEdges?: WorkflowEdge[];
  initialGlobalTools?: string[];
  onChange?: (nodes: WorkflowNode[], edges: WorkflowEdge[], globalTools: string[]) => void;
}

const nodeTypes: NodeTypes = {
  start: StartNode,
  action: ActionNode,
  llm: LlmNode,
  condition: ConditionNode,
};

export const WorkflowEditor = ({
  initialNodes = [],
  initialEdges = [],
  initialGlobalTools = [],
  onChange,
}: WorkflowEditorProps) => {
  const defaultNodes = useMemo(() => {
    if (initialNodes.length === 0) {
      return [
        {
          id: 'start-1',
          type: 'start',
          position: { x: 250, y: 50 },
          data: {},
        },
      ];
    }
    return initialNodes;
  }, [initialNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(defaultNodes as any);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges as any);
  const [globalTools, setGlobalTools] = useState<string[]>(initialGlobalTools);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const handleGlobalToolsChange = useCallback((tool: string, checked: boolean) => {
    setGlobalTools(prev => {
      const newTools = checked 
        ? [...prev, tool]
        : prev.filter(t => t !== tool);
      return newTools;
    });
  }, []);

  // Propagate changes to parent
  useMemo(() => {
    if (onChange) {
      onChange(nodes as any, edges as any, globalTools);
    }
  }, [nodes, edges, globalTools, onChange]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const handleNodeUpdate = useCallback((nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: newData };
        }
        return node;
      })
    );
  }, [setNodes]);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div className="absolute top-4 left-4 z-10 bg-white p-4 rounded-lg shadow-md border max-w-xs">
        <h3 className="font-bold text-sm mb-2">Global Tools</h3>
        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-sm">
            <input 
              type="checkbox" 
              checked={globalTools.includes('add_visitor_note')}
              onChange={(e) => handleGlobalToolsChange('add_visitor_note', e.target.checked)}
              className="rounded border-gray-300"
            />
            <span>Add Visitor Note</span>
          </label>
          <label className="flex items-center space-x-2 text-sm">
            <input 
              type="checkbox" 
              checked={globalTools.includes('change_status')}
              onChange={(e) => handleGlobalToolsChange('change_status', e.target.checked)}
              className="rounded border-gray-300"
            />
            <span>Change Status</span>
          </label>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
      
      {selectedNode && (
        <NodeConfigPanel 
          selectedNode={selectedNode} 
          onChange={handleNodeUpdate} 
          onClose={() => setSelectedNodeId(null)} 
        />
      )}
    </div>
  );
};
