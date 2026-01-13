# Design Review: App Shell & Global Sidebar

**VIOLATION:** Completeness / Missing Requirement (Axiom 1)

**EVIDENCE:** 
The current design in `designs/app_shell_design.md` explicitly defines the sidebar as "Fixed `w-64`" (Section 3.1). There is no mention of a collapsible functionality or a toggle mechanism. The User has requested a "expand menu/collapse menu for the global sidebar" with "collapse as the default".

**DEMAND:**
1.  Update the design to include the **Collapsible Sidebar** functionality.
2.  Define the state management for the collapsed/expanded state.
3.  Specify the UI element (e.g., a toggle button) to trigger the collapse/expand action.
4.  Define the visual behavior of the sidebar content when collapsed (e.g., show only icons, hide text, tooltip on hover?).
5.  Set the default state to **collapsed**.