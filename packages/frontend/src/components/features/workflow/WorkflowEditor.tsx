import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  SelectionMode,
  type Connection,
  type NodeTypes,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { StartNode } from "./nodes/StartNode";
import { ActionNode } from "./nodes/ActionNode";
import { LlmNode } from "./nodes/LlmNode";
import { ConditionNode } from "./nodes/ConditionNode";
import { NodeConfigPanel } from "./NodeConfigPanel";
import { NodeToolbar } from "./NodeToolbar";
import type { WorkflowNode, WorkflowEdge } from "@live-chat/shared-types";
import { useThemeStore } from "../../../stores/themeStore";

type NodeType = "start" | "action" | "llm" | "condition";

const NODE_POSITION_OFFSET = 50;
const DEFAULT_POSITION = { x: 250, y: 150 };

interface WorkflowEditorProps {
  initialNodes?: WorkflowNode[];
  initialEdges?: WorkflowEdge[];
  initialGlobalTools?: string[];
  onChange?: (
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    globalTools: string[],
  ) => void;
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
  const { theme } = useThemeStore();

  const defaultNodes = useMemo(() => {
    if (initialNodes.length === 0) {
      return [
        {
          id: "start-1",
          type: "start",
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

  const handleGlobalToolsChange = useCallback(
    (tool: string, checked: boolean) => {
      setGlobalTools((prev) => {
        const newTools = checked
          ? [...prev, tool]
          : prev.filter((t) => t !== tool);
        return newTools;
      });
    },
    [],
  );

  // Propagate changes to parent
  useMemo(() => {
    if (onChange) {
      onChange(nodes as any, edges as any, globalTools);
    }
  }, [nodes, edges, globalTools, onChange]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const handleNodeUpdate = useCallback(
    (nodeId: string, newData: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return { ...node, data: newData };
          }
          return node;
        }),
      );
    },
    [setNodes],
  );

  const handleAddNode = useCallback(
    (type: NodeType) => {
      const newId = `${type}-${Date.now()}`;

      // Calculate position based on last node or default
      const lastNode = nodes[nodes.length - 1];
      const position = lastNode
        ? {
            x: lastNode.position.x + NODE_POSITION_OFFSET,
            y: lastNode.position.y + NODE_POSITION_OFFSET,
          }
        : DEFAULT_POSITION;

      const newNode = {
        id: newId,
        type,
        position,
        data: {},
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [nodes, setNodes],
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) =>
        eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
      );
      setSelectedNodeId(null);
    },
    [setNodes, setEdges],
  );

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId],
  );

  return (
    <div className="w-full h-full relative bg-background text-foreground">
      <div className="absolute top-4 left-4 z-10 bg-card text-card-foreground p-4 rounded-lg shadow-md border border-border max-w-xs">
        <h3 className="font-bold text-sm mb-2 uppercase tracking-wider text-muted-foreground">
          Global Tools
        </h3>
        <div className="space-y-2">
          <label className="flex items-center space-x-2 text-sm cursor-pointer hover:text-primary transition-colors">
            <input
              type="checkbox"
              checked={globalTools.includes("add_visitor_note")}
              onChange={(e) =>
                handleGlobalToolsChange("add_visitor_note", e.target.checked)
              }
              className="rounded border-input bg-background text-primary focus:ring-ring h-4 w-4"
            />
            <span>Add Visitor Note</span>
          </label>
          <label className="flex items-center space-x-2 text-sm cursor-pointer hover:text-primary transition-colors">
            <input
              type="checkbox"
              checked={globalTools.includes("change_status")}
              onChange={(e) =>
                handleGlobalToolsChange("change_status", e.target.checked)
              }
              className="rounded border-input bg-background text-primary focus:ring-ring h-4 w-4"
            />
            <span>Change Status</span>
          </label>
        </div>
      </div>

      <NodeToolbar onAddNode={handleAddNode} />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        colorMode={theme}
        deleteKeyCode="Delete"
        selectionOnDrag={true}
        selectionMode={SelectionMode.Partial}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>

      {selectedNode && (
        <NodeConfigPanel
          selectedNode={selectedNode}
          onChange={handleNodeUpdate}
          onDelete={handleDeleteNode}
          onClose={() => setSelectedNodeId(null)}
        />
      )}
    </div>
  );
};
