---
phase: 3
created: 2026-01-25
---

# Plan: Phase 3 - Frontend Node & Editor

## Objective

Create the visual SwitchNode component for React Flow, register it in WorkflowEditor, add configuration UI in NodeConfigPanel, and add i18n keys.

## Context

- ./.gtd/switch-node/SPEC.md
- ./.gtd/switch-node/ROADMAP.md
- packages/frontend/src/components/features/workflow/nodes/ConditionNode.tsx
- packages/frontend/src/components/features/workflow/WorkflowEditor.tsx
- packages/frontend/src/components/features/workflow/NodeToolbar.tsx
- packages/frontend/src/components/features/workflow/NodeConfigPanel.tsx
- packages/frontend/src/i18n/locales/en.json
- packages/frontend/src/i18n/locales/vi.json

## Architecture Constraints

- **Single Source:** Node data shape defined by backend SwitchDataSchema
- **Invariants:** Max 10 cases, each case has non-empty route and when
- **Resilience:** Empty cases array renders only default handle
- **Testability:** Pure React component, no side effects

## Tasks

<task id="1" type="auto">
  <name>Create SwitchNode.tsx component</name>
  <files>packages/frontend/src/components/features/workflow/nodes/SwitchNode.tsx</files>
  <action>
    Create new file following ConditionNode pattern:

    1. Import `memo`, `Handle`, `Position`, `NodeProps` from @xyflow/react
    2. Import `Waypoints` icon from lucide-react (switch/routing icon)
    3. Import `useTranslation` hook
    4. Create `SwitchNodeData` interface matching backend schema:
       ```typescript
       interface SwitchNodeData {
         cases?: { route: string; when: string }[];
         prompt?: string;
       }
       ```
    5. Render node with:
       - Target handle at top
       - Cyan/teal color scheme (to differentiate from orange condition)
       - Title: `t("workflow.nodes.switch")`
       - Description: `t("workflow.nodes.switchDescription")`
       - Dynamic source handles at bottom for each case + default
       - Use inline layout for handles (flex justify-between with wrapping)
    6. Handle display:
       - Each case: `{case.route}` label with unique handle id `${id}-${case.route}`
       - Default handle: always present, id `${id}-default`
       - Limit display to 5 cases + default (truncate with "..." if more)

  </action>
  <done>
    - SwitchNode.tsx file exists
    - Component renders with handles for cases + default
    - Uses teal/cyan color scheme
    - Frontend compiles
  </done>
</task>

<task id="2" type="auto">
  <name>Register switch node in WorkflowEditor and NodeToolbar</name>
  <files>
    - packages/frontend/src/components/features/workflow/WorkflowEditor.tsx
    - packages/frontend/src/components/features/workflow/NodeToolbar.tsx
  </files>
  <action>
    1. In WorkflowEditor.tsx:
       - Import `SwitchNode` from ./nodes/SwitchNode
       - Add to `NodeType` union: `"switch"`
       - Add to `nodeTypes` object: `switch: SwitchNode`

    2. In NodeToolbar.tsx:
       - Import `Waypoints` icon from lucide-react
       - Add to `NodeType` union: `"switch"`
       - Add to `NODE_BUTTONS` array:
         ```typescript
         {
           type: "switch",
           icon: <Waypoints size={16} />,
           labelKey: "workflow.toolbar.addSwitch",
           colorClass: "text-cyan-500 hover:bg-cyan-500/10",
         },
         ```

  </action>
  <done>
    - Switch node can be added via toolbar
    - Switch node renders in canvas
    - Frontend compiles
  </done>
</task>

<task id="3" type="auto">
  <name>Add switch configuration in NodeConfigPanel and i18n keys</name>
  <files>
    - packages/frontend/src/components/features/workflow/NodeConfigPanel.tsx
    - packages/frontend/src/i18n/locales/en.json
    - packages/frontend/src/i18n/locales/vi.json
  </files>
  <action>
    1. In NodeConfigPanel.tsx, add switch node section after condition node section:
       ```tsx
       {selectedNode.type === "switch" && (
         <div className="space-y-4">
           <p className="text-sm text-muted-foreground leading-relaxed">
             {t("workflow.configPanel.switchDescription")}
           </p>
           
           {/* Cases Table */}
           <div>
             <label className="block text-xs font-semibold mb-1.5 uppercase text-muted-foreground">
               {t("workflow.configPanel.casesLabel")}
             </label>
             <div className="space-y-2">
               {((selectedNode.data.cases as { route: string; when: string }[]) || []).map((c, idx) => (
                 <div key={idx} className="flex gap-2 items-start">
                   <Input
                     placeholder={t("workflow.configPanel.routePlaceholder")}
                     value={c.route}
                     onChange={(e) => {
                       const cases = [...((selectedNode.data.cases as any[]) || [])];
                       cases[idx] = { ...cases[idx], route: e.target.value };
                       handleChange("cases", cases);
                     }}
                     className="w-24"
                   />
                   <Input
                     placeholder={t("workflow.configPanel.whenPlaceholder")}
                     value={c.when}
                     onChange={(e) => {
                       const cases = [...((selectedNode.data.cases as any[]) || [])];
                       cases[idx] = { ...cases[idx], when: e.target.value };
                       handleChange("cases", cases);
                     }}
                     className="flex-1"
                   />
                   <Button
                     variant="ghost"
                     size="sm"
                     onClick={() => {
                       const cases = ((selectedNode.data.cases as any[]) || []).filter((_, i) => i !== idx);
                       handleChange("cases", cases);
                     }}
                   >
                     ✕
                   </Button>
                 </div>
               ))}
             </div>
             
             {((selectedNode.data.cases as any[]) || []).length < 10 && (
               <Button
                 variant="outline"
                 size="sm"
                 className="mt-2"
                 onClick={() => {
                   const cases = [...((selectedNode.data.cases as any[]) || []), { route: "", when: "" }];
                   handleChange("cases", cases);
                 }}
               >
                 {t("workflow.configPanel.addCase")}
               </Button>
             )}
           </div>
           
           {/* Prompt */}
           <div>
             <label className="block text-xs font-semibold mb-1.5 uppercase text-muted-foreground">
               {t("workflow.configPanel.switchPromptLabel")}
             </label>
             <textarea
               className="w-full border border-input bg-background rounded-md p-2 text-sm h-24 focus:ring-2 focus:ring-ring transition-shadow resize-none"
               placeholder={t("workflow.configPanel.switchPromptPlaceholder")}
               value={(selectedNode.data.prompt as string) || ""}
               onChange={(e) => handleChange("prompt", e.target.value)}
             />
           </div>
         </div>
       )}
       ```

    2. In en.json, add to workflow.toolbar:
       ```json
       "addSwitch": "Switch"
       ```

    3. In en.json, add to workflow.nodes:
       ```json
       "switch": "Switch",
       "switchDescription": "Multi-Case Router",
       "handleDefault": "default"
       ```

    4. In en.json, add to workflow.configPanel:
       ```json
       "switchDescription": "Route to different paths based on multiple conditions. The AI will evaluate which case matches best.",
       "casesLabel": "Cases",
       "routePlaceholder": "Route name",
       "whenPlaceholder": "When this condition is met...",
       "addCase": "Add Case",
       "switchPromptLabel": "Routing Prompt (optional)",
       "switchPromptPlaceholder": "Additional instructions for how the AI should choose..."
       ```

    5. Add equivalent keys to vi.json with Vietnamese translations

  </action>
  <done>
    - Switch node config panel shows cases table UI
    - Can add/remove cases (up to 10)
    - Can edit route and when fields
    - Can edit optional prompt
    - All i18n keys exist in en.json and vi.json
    - Frontend compiles
  </done>
</task>

## Success Criteria

- [ ] SwitchNode.tsx renders with dynamic handles
- [ ] Switch node available in toolbar
- [ ] Switch node registered in nodeTypes
- [ ] NodeConfigPanel shows cases table for switch nodes
- [ ] i18n keys in en.json and vi.json
- [ ] Frontend compiles without TypeScript errors
