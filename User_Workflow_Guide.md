# THE ORCHESTRATOR'S GUIDE (USER MANUAL)

You are the **Orchestrator**. You drive the File-Based State Machine. The Agents (Architect & Coder) are stateless workers that wait for your specific triggers.

### THE WORKFLOW LOOP

#### PHASE 1: INCEPTION (Architect)
**Goal:** Create the design for a new feature.
**Command:**
> "Architect, I need a design for the feature `<feature_name>`. Please start with the first slice `<slice_name>`. Read your instructions in `Architect_Persona_and_Workflow.md`."

#### PHASE 2: AUDIT (Coder)
**Goal:** Check if the design is solid before building.
**Command:**
> "Coder, review the design for `<feature_name>` / `<slice_name>`. Read your instructions in `Coder_Persona_and_Workflow.md`. If it passes, build it. If it fails, file a review."

#### PHASE 3: THE FORK (Decision Point)

**Scenario A: The Coder REJECTS the Design**
*   **Signal:** Coder says "Audit Failed. Rejection filed in `reviews/`."
*   **Your Action:**
    > "Architect, the Coder rejected your design. Read the review at `agent_workspace/<feature_name>/reviews/<slice_name>.md` and update the design."
*   *Repeat Phase 2.*

**Scenario B: The Coder ACCEPTS the Design**
*   **Signal:** Coder says "Implementation complete. Log updated in `actions/`."
*   **Your Action:**
    > "Great. Architect, let's move to the next slice: `<next_slice_name>`."

---

### DIRECTORY REFERENCE

All communication happens here:
`project_root/agent_workspace/<feature_name>/`

1.  **`designs/<slice>.md`**: The Single Source of Truth (Written by Architect).
2.  **`reviews/<slice>.md`**: The Reject Signal (Written by Coder).
3.  **`actions/<slice>.md`**: The Success Signal (Written by Coder).
