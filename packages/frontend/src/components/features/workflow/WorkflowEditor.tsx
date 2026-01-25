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
  type Edge,
  type ColorMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { StartNode } from "./nodes/StartNode";
import { ActionNode } from "./nodes/ActionNode";
import { LlmNode } from "./nodes/LlmNode";
import { ConditionNode } from "./nodes/ConditionNode";
import { SwitchNode } from "./nodes/SwitchNode";
import { NodeConfigPanel } from "./NodeConfigPanel";
import { NodeToolbar } from "./NodeToolbar";
import { GlobalToolsPanel } from "./GlobalToolsPanel";
import type {
  WorkflowNode,
  WorkflowEdge,
  GlobalToolConfig,
} from "@live-chat/shared-types";
import { useThemeStore, type Theme } from "../../../stores/themeStore";

type NodeType = "start" | "action" | "llm" | "condition" | "switch";

const NODE_POSITION_OFFSET = 50;
const DEFAULT_POSITION = { x: 250, y: 150 };

interface WorkflowEditorProps {
  initialNodes?: WorkflowNode[];
  initialEdges?: WorkflowEdge[];
  initialGlobalTools?: GlobalToolConfig[];
  onChange?: (
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    globalTools: GlobalToolConfig[],
  ) => void;
}

const nodeTypes: NodeTypes = {
  start: StartNode,
  action: ActionNode,
  llm: LlmNode,
  condition: ConditionNode,
  switch: SwitchNode,
};

export const WorkflowEditor = ({
  initialNodes = [],
  initialEdges = [],
  initialGlobalTools = [],
  onChange,
}: WorkflowEditorProps) => {
  const { theme } = useThemeStore();

  const colorMode = useMemo((): ColorMode => {
    if (theme === "light" || theme === "dark" || theme === "system") {
      return theme;
    }

    const darkThemes: Theme[] = [
      "oled-void",
      "nordic-frost",
      "cyberpunk",
      "terminal",
      "dracula",
      "solarized-dark",
    ];

    return darkThemes.includes(theme) ? "dark" : "light";
  }, [theme]);

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

  const [nodes, setNodes, onNodesChange] = useNodesState(
    defaultNodes as Node[],
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    initialEdges as Edge[],
  );
  const [globalTools, setGlobalTools] =
    useState<GlobalToolConfig[]>(initialGlobalTools);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Propagate changes to parent
  useMemo(() => {
    if (onChange) {
      onChange(nodes as WorkflowNode[], edges as WorkflowEdge[], globalTools);
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
      <GlobalToolsPanel tools={globalTools} onChange={setGlobalTools} />

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
        colorMode={colorMode}
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