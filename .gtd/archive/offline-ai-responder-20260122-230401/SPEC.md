# Specification

**Status:** FINALIZED
**Created:** 2026-01-22

## Goal

Implement an AI auto-responder powered by Groq that handles visitor messages when no human agents are online. This provides immediate assistance to visitors during off-hours while allowing them to opt-out and wait for a human agent.

## Requirements

### Must Have

- [ ] **Agent Presence Logic:** Implement a reliable method to determine if any human agents are currently online/active in the project.
- [ ] **Groq/OpenAI Integration:** Integrate the Groq API (using OpenAI-compatible SDK) into the backend to generate responses.
- [ ] **Conversation Context:** Provide the AI with the current conversation history (messages within the same session) to maintain context.
- [ ] **PM Configuration:** Provide a configuration interface (API and UI) for Project Managers to enable/disable the feature and set system prompts.
- [ ] **Visitor Toggle UI:** A UI component in the chat widget that informs the visitor the AI is active and allows them to toggle it off (to wait for a human) or back on.
- [ ] **Trigger Mechanism:** Logic to automatically trigger an AI response only when (Agents are Offline) AND (Visitor AI Toggle is ON).
- [ ] **Visual Differentiation:** Ensure AI-generated messages are clearly labeled as such in both the dashboard and the widget.

### Nice to Have

- [ ] **Typing Indicators:** Show a "Typing..." indicator while the AI is generating a response.
- [ ] **Intent Detection:** Basic logic to detect if a visitor explicitly asks for a human and provide a tailored response about wait times.

### Won't Have

- [ ] **RAG / Knowledge Base:** The AI will not search external documents or uploaded FAQs in this phase.
- [ ] **Cross-Conversation Memory:** The AI will not have access to history from the visitor's previous separate conversations.

## Constraints

- **Provider:** Must use Groq (via OpenAI-compatible API).
- **Backend:** Implementation must reside within `packages/backend`.
- **Frontend:** Internationalization protocols in `packages/frontend/src/i18n` must be followed.

## Open Questions

- What is the specific definition of "Online" for a human agent? (WebSocket connection status, "Available" toggle, or last activity within X minutes?)
- Should the PM configuration be per-project or global? (Assumed per-project).
