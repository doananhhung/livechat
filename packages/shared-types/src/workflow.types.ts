export interface WorkflowNode {
    id: string;
    type: "start" | "trigger" | "action" | "condition" | "end" | "llm" | "switch";
    data: Record<string, unknown>;
    position: {
        x: number;
        y: number;
    };
}
export interface WorkflowEdge {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
    label?: string;
    type?: string;
}
export interface GlobalToolConfig {
    name: string;
    enabled: boolean;
    instruction: string;
}
export interface WorkflowDefinition {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    variables?: Record<string, unknown>;
    globalTools?: GlobalToolConfig[];
}
export interface AiConfig extends WorkflowDefinition {
    language?: "en" | "vi";
}
