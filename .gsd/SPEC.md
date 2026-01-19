# SPEC.md — Project Specification

> **Status**: `FINALIZED`

## Vision

Live Chat SaaS is a multi-tenant real-time customer support platform with an embeddable widget. The current milestone focuses on ensuring widget form handling works correctly for all edge cases.

## Goals

1. **Widget Forms Audit** — Verify form rendering, validation, submission flow, and error handling work correctly
2. **Form Submission Flow** — Trace and validate socket → gateway → service → broadcast chain
3. **Backend Actions Integrity** — Verify `ActionsService.submitFormAsVisitor()` handles all edge cases
4. **Comprehensive Test Coverage** — Ensure all field types and edge cases have tests

## Non-Goals (Out of Scope)

- Dashboard form creation UI (agent-side)
- Form analytics or reporting
- New form field types
- Form styling customization by agents

## Users

- **Visitors**: Fill out forms sent by agents in the chat widget
- **Agents**: Send form requests and view submissions in the dashboard

## Constraints

- Widget uses **Preact 10** (not React) for minimal bundle size
- Dashboard uses **React 19**
- Test environment must handle React/Preact coexistence
- Socket.IO for real-time communication
- PostgreSQL + TypeORM for persistence

## Success Criteria

- [ ] All 5 field types render correctly (text, number, date, boolean, select)
- [ ] Validation errors display and clear properly
- [ ] Form submission flows from widget → backend → broadcast
- [ ] Expired/submitted states handled correctly
- [ ] 15+ tests covering form components (currently achieved)
- [ ] Backend form submission creates correct records

## Current Milestone

**Widget Forms Audit** — 4 phases

| Phase   | Status         | Description                  |
| ------- | -------------- | ---------------------------- |
| Phase 1 | ✅ Complete    | Form Component Audit         |
| Phase 2 | ⬜ Not Started | Form Submission Flow Audit   |
| Phase 3 | ⬜ Not Started | Backend Actions Deep Dive    |
| Phase 4 | ⬜ Not Started | Test Coverage & Verification |
