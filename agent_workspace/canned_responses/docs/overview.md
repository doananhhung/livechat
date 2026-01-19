# Canned Responses System

## Purpose

The Canned Responses system improves agent efficiency by allowing them to use pre-defined text snippets (macros) for common questions and greetings. Instead of typing the same "Hello, how can I help you?" message fifty times a day, an agent can simply type `/hello`.

## Summary

The system consists of two parts:

1.  **Management:** Project Managers create, update, and delete shortcuts (e.g., `/reset_pass`) and their corresponding content.
2.  **Usage:** Agents type a `/` in the chat composer to see a filtered list of available macros. Selecting one replaces the shortcut with the full text.

## Key Components

- **CannedResponse Entity:** A database record storing the `shortcut`, `content`, and `projectId`.
- **Slash Command Popover:** A frontend UI component that appears when an agent types `/` in the message composer.
- **Management UI:** A settings page for Project Managers to maintain the library of responses.
- **API:** REST endpoints for CRUD operations, secured by RBAC (Manager Write, Agent Read).

## How It Works

1.  **Configuration:** A Manager goes to "Project Settings -> Canned Responses" and adds a response with shortcut `welcome` and content `Hi there! How can I help?`.
2.  **Storage:** The backend saves this to the `canned_responses` table, enforcing that `welcome` is unique within the project.
3.  **Usage:** An Agent in the Inbox types `/wel`.
4.  **Detection:** The frontend `MessageComposer` detects the `/`, fetches the list of responses (cached), and filters for matches.
5.  **Expansion:** The Agent presses Enter. The text `/wel` is replaced with `Hi there! How can I help?`.

## Related Documentation

- [Architecture](./architecture.md)
- [API Reference](./api.md)
- [Decision Log](./decisions.md)
- [Changelog](./changelog.md)
