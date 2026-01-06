# Design Review: Status Automation

## Verdict: APPROVE

The design for `status_automation` is accepted.

### Analysis against Axioms

1.  **Type Fidelity:** PASSED.
    *   Configuration fields (`autoResolveMinutes`) and Job data (`AutoPendingJob`) are strictly typed.
    *   Logic relies on explicit IDs and database fields.
    *   `last_message_id` is now explicitly defined as `BigInt`, matching `Message.id`.

2.  **Trust Boundary:** PASSED.
    *   Updates to `autoResolveMinutes` will pass through existing DTO validation (implied `UpdateProjectDto`).
    *   Worker logic treats the job execution as a state check, not a blind command.
    *   "Spam Immunity" invariant adds boundary protection for SPAM state.

3.  **Physics Check (Coupling/Cohesion):** PASSED.
    *   Decoupled execution via BullMQ.
    *   Atomic check logic (`WHERE last_message_id=:triggerId`) is now physically possible with the addition of `last_message_id` to `conversations`.

4.  **Failure Mode & Concurrency:** PASSED.
    *   Race conditions explicitly handled via atomic SQL update.
    *   "Clutter"/Debounce scenario handled gracefully.

### Next Steps
Awaiting User request to generate the **Implementation Plan**.