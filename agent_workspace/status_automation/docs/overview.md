# Status Automation (Auto-Pending)

## Purpose
The Status Automation feature automates the workflow by automatically moving conversations to `PENDING` if an agent has replied and the customer has not responded after a configurable amount of time. This helps agents keep their inbox clean and focus on active conversations, reducing the need for manual status updates.

## Summary
When an agent sends a reply, a delayed job is scheduled. If the customer does not reply within the configured time (e.g., 10 minutes), the conversation status is automatically updated to `PENDING`. This automation is configurable per project and can be disabled.

## Key Components
- **Project Settings UI**: Adds an "Auto-Resolve Timer" field to Project Settings, allowing managers to configure the delay in minutes.
- **Workflow Scheduler (BullMQ)**: Schedules delayed jobs when an agent sends a message.
- **Workflow Consumer**: Processes the delayed jobs. It performs an atomic check to ensure the conversation is still `OPEN` and the last message is still the one that triggered the timer.
- **Spam Immunity**: Conversations marked as `SPAM` are immune to this automation and will not be auto-opened or auto-pending.
- **Notifications**: Agents receive a Toast notification when a conversation is automatically moved to `PENDING`.

## How It Works
1.  **Configuration**: A Project Manager sets "Auto-Resolve Timer" to `M` minutes in Project Settings.
2.  **Trigger**: An Agent sends a reply to a conversation.
3.  **Scheduling**: The system schedules a background job to run in `M` minutes.
4.  **Execution**: After `M` minutes, the worker processes the job.
5.  **Check**:
    -   Is the conversation still `OPEN`?
    -   Is the last message still the Agent's reply (i.e., customer hasn't replied)?
6.  **Action**: If checks pass, the status is updated to `PENDING`.
7.  **Notification**: The system emits an event, and the Agent sees a "Conversation moved to Pending automatically" toast.

## Related Documentation
- [Architecture](./architecture.md)
- [API Reference](./api.md)
- [Decision Log](./decisions.md)
- [Changelog](./changelog.md)
