/**
 * AI Tool Definitions
 *
 * Single Source of Truth for AI workflow tool names and metadata.
 * Both backend and frontend must import from here.
 */

/**
 * Enum of all available AI tool names.
 * Use these values instead of hardcoded strings.
 */
export enum AiToolName {
  /** Adds an internal note about the visitor for agents to see */
  ADD_VISITOR_NOTE = "add_visitor_note",
  /** Updates the status of the conversation */
  CHANGE_STATUS = "change_status",
  /** Sends a form request to the visitor */
  SEND_FORM = "send_form",
  /** Internal tool for workflow routing decisions */
  ROUTE_DECISION = "route_decision",
  /** Internal tool for switch node multi-case routing */
  SWITCH_DECISION = "switch_decision",
}

/**
 * Tools that can be selected as actions in the workflow UI.
 * Does NOT include ROUTE_DECISION which is internal-only.
 */
export const AVAILABLE_ACTION_TOOLS = [
  AiToolName.ADD_VISITOR_NOTE,
  AiToolName.CHANGE_STATUS,
  AiToolName.SEND_FORM,
] as const;

/**
 * Type for action tools that can be selected in the workflow UI.
 */
export type ActionToolName = (typeof AVAILABLE_ACTION_TOOLS)[number];

/**
 * i18n label keys for each AI tool.
 * Used by frontend components for translations.
 */
export const AI_TOOL_LABEL_KEYS: Record<AiToolName, string> = {
  [AiToolName.ADD_VISITOR_NOTE]: "workflow.globalTools.addVisitorNote",
  [AiToolName.CHANGE_STATUS]: "workflow.globalTools.changeStatus",
  [AiToolName.SEND_FORM]: "workflow.globalTools.sendForm",
  [AiToolName.ROUTE_DECISION]: "workflow.globalTools.routeDecision",
  [AiToolName.SWITCH_DECISION]: "workflow.globalTools.switchDecision",
};

/**
 * i18n label keys for tools in the config panel (different namespace).
 */
export const AI_TOOL_CONFIG_LABEL_KEYS: Record<ActionToolName, string> = {
  [AiToolName.ADD_VISITOR_NOTE]: "workflow.configPanel.toolAddNote",
  [AiToolName.CHANGE_STATUS]: "workflow.configPanel.toolChangeStatus",
  [AiToolName.SEND_FORM]: "workflow.configPanel.toolSendForm",
};
