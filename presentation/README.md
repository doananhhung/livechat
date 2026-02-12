# Live Chat System - Presentation

Hướng dẫn chạy và tổng quan nội dung slide thuyết trình của nhóm.

## 🚀 How to Run

Yêu cầu: Node.js >= 18.x

```bash
# 1. Cài đặt dependencies (chạy tại thư mục chứa file README này)
npm install

# 2. Chạy chế độ Development (mở trình duyệt tương tác)
npm run dev

# 3. Build ra file PDF/SPA (nếu cần, nhưng có thể bị lỗi các diagram)
npm run build
```

Sau khi chạy `npm run dev`, mở trình duyệt tại `http://localhost:3030`.

## 📝 Slide Overview

Slide này trình bày bản Technical Deep-dive về hệ thống Live Chat, tập trung vào:

1.  **System Architecture (Hùng)**:
    *   Kiến trúc Event-Driven Microservices.
    *   Cơ chế Webhook Delivery (Reliability).
    *   System Boundary & Use Case Diagram.

2.  **Core & Security (Hiếu)**:
    *   Multi-tenancy isolation (Project-based).
    *   Authentication (JWT, OAuth, 2FA).
    *   Database Schema (ERD).

3.  **Real-time Engine & AI (Hoàng)**:
    *   Streaming Pipeline (Async Inbound vs Sync Outbound).
    *   AI Orchestrator (Recursive Decision Trees).
    *   Xử lý high-concurrency 10k users.

4.  **Product Features (Hiệp)**:
    *   Inbox & Workflow (Assignments, Canned Responses).
    *   Action Templates (Smart Forms).
    *   Testing Strategy & Traceability.

---
**Tech Stack**: [Slidev](https://sli.dev/) (Markdown-based presentation), Vue.js, Mermaid, PlantUML.
