# THE ORCHESTRATOR'S GUIDE (USER MANUAL)

You are the **Orchestrator**. You drive the File-Based State Machine. The Agents (Architect, Coder, & Reviewer) are stateless workers that wait for your specific triggers.

---

## THE THREE PERSONAS

| Persona | Role | Writes To | Reads From |
|---------|------|-----------|------------|
| **Architect** | Designs constraints, schemas, invariants | `designs/` | `reviews/`, `actions/` |
| **Coder** | Implements designs, writes tests | `reviews/`, `actions/`, source code | `designs/`, `code_reviews/` |
| **Reviewer** | Reviews code quality, security, performance | `code_reviews/` | `designs/`, `actions/`, source code |

---

## THE WORKFLOW LOOP

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│   PHASE 1          PHASE 2          PHASE 3          PHASE 4             │
│   ────────         ────────         ────────         ────────            │
│   INCEPTION   ──►  AUDIT       ──►  BUILD       ──►  REVIEW              │
│   (Architect)      (Coder)          (Coder)          (Reviewer)          │
│       │                │                │                │               │
│       │                │                │                │               │
│       ▼                ▼                ▼                ▼               │
│   designs/         reviews/         actions/        code_reviews/        │
│                    (if rejected)    (if accepted)   (findings)           │
│                         │                                │               │
│                         ▼                                ▼               │
│                    Back to           ┌───────────────────┘               │
│                    Architect         │                                   │
│                                      ▼                                   │
│                              PHASE 5: FIX (Coder) ──► Re-review          │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### PHASE 1: INCEPTION (Architect)
**Goal:** Create the design for a new feature.
**Command:**
> "Architect, I need a design for the feature `<feature_name>`. Please start with the first slice `<slice_name>`. Read your instructions in `Architect_Persona_and_Workflow.md`."

**Expected Output:** Architect writes to `agent_workspace/<feature_name>/designs/<slice_name>.md`

---

### PHASE 2: AUDIT (Coder)
**Goal:** Check if the design is solid before building.
**Command:**
> "Coder, review the design for `<feature_name>` / `<slice_name>`. Read your instructions in `Coder_Persona_and_Workflow.md`. If it passes, build it. If it fails, file a review."

**Fork Point:**

| Scenario | Signal | Your Action |
|----------|--------|-------------|
| **REJECT** | "Audit Failed. Rejection filed in `reviews/`." | Go to **PHASE 2A** |
| **ACCEPT** | "Implementation complete. Log updated in `actions/`." | Go to **PHASE 3** |

---

### PHASE 2A: REFINE (Architect)
**Goal:** Address the Coder's rejection and update the design.
**Command:**
> "Architect, the Coder rejected your design. Read the review at `agent_workspace/<feature_name>/reviews/<slice_name>.md` and update the design."

**Expected Output:** Architect updates `designs/<slice_name>.md`
**Next Step:** Return to **PHASE 2** (Coder re-audits)

---

### PHASE 3: REVIEW (Reviewer)
**Goal:** Quality gate before merge. Find defects the Coder missed.
**Command:**
> "Reviewer, review the implementation for `<feature_name>` / `<slice_name>`. Read your instructions in `Reviewer_Persona_and_Workflow.md`."

**Fork Point:**

| Scenario | Signal | Your Action |
|----------|--------|-------------|
| **ISSUES FOUND** | "Review complete. [X] issues found. See `code_reviews/`." | Go to **PHASE 4** |
| **APPROVED** | "Review complete. No blocking issues. Approved for merge." | Go to **PHASE 5** |

---

### PHASE 4: FIX (Coder)
**Goal:** Address the Reviewer's findings.
**Command:**
> "Coder, the Reviewer found issues. Read `agent_workspace/<feature_name>/code_reviews/<slice_name>.md` and fix them."

**Expected Output:** Coder fixes code and updates `actions/<slice_name>.md`
**Next Step:** Return to **PHASE 3** (Reviewer re-reviews)

---

### PHASE 5: COMPLETE
**Goal:** Confirm the slice is done and move to the next.
**Options:**
> "Great. Architect, let's move to the next slice: `<next_slice_name>`."

OR

> "This feature is complete. Architect, verify alignment and document any technical debt."

---

## DIRECTORY REFERENCE

All communication happens here:
`project_root/agent_workspace/<feature_name>/`

| Folder | Purpose | Written By | Read By |
|--------|---------|------------|---------|
| `designs/<slice>.md` | The Single Source of Truth | Architect | Coder, Reviewer |
| `reviews/<slice>.md` | Design Rejection Signal | Coder | Architect |
| `actions/<slice>.md` | Implementation Log | Coder | Architect, Reviewer |
| `code_reviews/<slice>.md` | Code Review Feedback | Reviewer | Coder |

---

## QUICK REFERENCE COMMANDS

### Starting a New Feature
```
"Architect, I need a design for the feature `user_authentication`. 
Please start with the first slice `login_flow`. 
Read your instructions in `Architect_Persona_and_Workflow.md`."
```

### Triggering Implementation
```
"Coder, implement `user_authentication` / `login_flow`. 
Read your instructions in `Coder_Persona_and_Workflow.md`."
```

### Triggering Code Review
```
"Reviewer, review `user_authentication` / `login_flow`.
Read your instructions in `Reviewer_Persona_and_Workflow.md`."
```

### Handling Design Rejection
```
"Architect, the Coder rejected your design.
Read `agent_workspace/user_authentication/reviews/login_flow.md` and update."
```

### Handling Code Review Feedback
```
"Coder, the Reviewer found issues.
Read `agent_workspace/user_authentication/code_reviews/login_flow.md` and fix."
```

---

## ANTI-PATTERNS (What NOT to Do)

| ❌ Don't | ✅ Do Instead |
|----------|---------------|
| Ask Coder to design | Ask Architect to design, then Coder to implement |
| Ask Architect to review code | Ask Reviewer to review code |
| Ask Reviewer to fix bugs | Ask Coder to fix bugs |
| Skip the review phase | Always run Reviewer before merge |
| Let personas write to each other's folders | Enforce folder ownership strictly |
