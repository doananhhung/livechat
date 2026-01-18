# Actions and Smart Forms

## Purpose
The **Actions and Smart Forms** feature enables project managers to create structured form templates that agents can use to capture data from visitors. It streamlines the data collection process during conversations, ensuring that information is captured accurately and consistently. By allowing forms to be sent directly into the chat, it reduces the need for manual data entry and allows visitors to participate directly in the data gathering process.

## Summary
This feature consists of two main parts:
1.  **Action Templates**: A management interface for defining reusable form schemas (fields, types, validation rules).
2.  **Smart Forms**: An extension that allows agents to send these forms as interactive messages in the chat widget. Visitors can fill out and submit these forms in real-time.

## Key Components
- **Action Templates**: Reusable form definitions created by Managers.
- **Action Submissions**: The resulting data records after a form is filled (by either an Agent or a Visitor).
- **Action Panel**: An inbox component where agents select templates, fill them, or send them to visitors.
- **Rich Message Display**: Custom chat bubbles (`FormRequestBubble`, `FormSubmissionBubble`) for rendering forms in the conversation history.
- **Widget Form Handlers**: Frontend components in the live chat widget that render forms for visitors and handle submissions via WebSockets.

## How It Works
1.  **Template Creation**: A Manager defines a template in the project settings, specifying fields (text, number, date, boolean, select).
2.  **Engagement**: During a conversation, an Agent opens the Action Panel and selects a template.
3.  **Form Delivery**: The Agent can either:
    - Fill the form themselves (internal action).
    - Send the form to the visitor (interactive action).
4.  **Visitor Submission**: If sent to the visitor, the form appears in the chat widget. The visitor fills it out, and the system provides real-time "filling" indicators to the agent.
5.  **Data Capture**: Upon submission, an `ActionSubmission` is created in the backend, and a confirmation message is posted to the chat.

## Related Documentation
- [Architecture](./architecture.md)
- [API Reference](./api.md)
- [Decision Log](./decisions.md)
- [Changelog](./changelog.md)
