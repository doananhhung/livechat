export interface WorkflowNode {
  id: string;
  type: 'start' | 'trigger' | 'action' | 'condition' | 'end' | 'llm';
  data: Record<string, any>;
  position: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables?: Record<string, any>;
  globalTools?: string[];
}
