  # Member 1 Presentation Script - System Architecture

  > **Thời lượng dự kiến**: 15-18 phút  
  > **Số slides**: 17 slides  
  > **Vai trò**: System Architect

  ---

  ## Slide 1: Title Slide - System Architecture

  **Layout**: LayoutSection

  **Nội dung slide**:
  - Title: "System Architecture"
  - Subtitle: "Member 1: System Architect"
  - Mô tả: "Kiến trúc tổng thể, triển khai, Event-Driven Core, Webhooks, và Audit Logs"

  **Script:**

  "Xin chào thầy/cô và các bạn. Em là [Tên] - System Architect của dự án Live Chat.

  Trong phần trình bày của em, em sẽ giới thiệu về **Kiến trúc tổng thể** của hệ thống, bao gồm:
  - Tổng quan hệ thống và các thành phần
  - Deployment và Technology Stack
  - Event-Driven Core - trái tim của hệ thống real-time
  - Webhooks - tích hợp với hệ thống bên ngoài
  - Audit Logs - đảm bảo security compliance"

  ⏱️ **Thời gian**: ~30 giây

  ---

  ## Slide 2: System Overview

  **Layout**: LayoutTwoCol

  **Nội dung slide**:
  - **Cột trái - Application Type**: Customer Support Chat Platform
    - Real-time messaging giữa Visitor và Agent
    - Widget nhúng vào website khách hàng
    - Dashboard quản lý cho nhân viên hỗ trợ
  - **Cột phải - Architecture Style**: Event-Driven Microservices
    - Real-time: WebSocket (Socket.IO)
    - Multi-tenant: Cô lập dữ liệu theo Project
    - Decoupled: EventEmitter2 Bus

  **Script:**

  "Trước tiên, để thầy/cô có cái nhìn tổng quan về hệ thống chúng em đang xây dựng.

  **Về Application Type**: Đây là một nền tảng **Customer Support Chat Platform**, cho phép real-time messaging giữa **Visitor** - người truy cập website - và **Agent** - nhân viên hỗ trợ. 

  Hệ thống bao gồm:
  - Một **chat widget** có thể nhúng vào bất kỳ website nào của khách hàng
  - Một **dashboard quản lý** dành cho các nhân viên hỗ trợ

  **Về Architecture Style**: Chúng em chọn kiến trúc **Event-Driven Microservices**. Các điểm đặc biệt là:

  1. **Real-time**: Sử dụng WebSocket thông qua Socket.IO để đảm bảo tin nhắn được truyền trong thời gian thực
  2. **Multi-tenant**: Hỗ trợ nhiều công ty khác nhau sử dụng cùng hệ thống, với dữ liệu được cô lập hoàn toàn theo từng Project
  3. **Decoupled**: Các thành phần giao tiếp thông qua EventEmitter2 Bus, giúp hệ thống linh hoạt và dễ mở rộng"

  ⏱️ **Thời gian**: ~60 giây

  ---

  ## Slide 3: Use Case Diagram

  **Layout**: LayoutDiagram

  **Nội dung slide**: Mermaid flowchart hiển thị 3 actors và các use cases:
  - Visitor: Send/Receive Messages, View Chat History, Fill Smart Forms
  - Agent: Chat with Visitors, Manage Conversations, Use Canned Responses, Add Visitor Notes
  - Manager: Manage Team Members, Configure Project, Create Canned Responses, Create Action Templates, Configure Webhooks, View Audit Logs + inherits từ Agent

  **Script:**

  "Đây là Use Case Diagram của hệ thống Live Chat.

  Hệ thống có **3 loại người dùng chính**:

  **1. Visitor** - Người truy cập website:
  - Có thể gửi và nhận tin nhắn real-time
  - Xem lịch sử chat của mình
  - Điền các Smart Forms mà Agent gửi

  **2. Agent** - Nhân viên hỗ trợ:
  - Chat trực tiếp với Visitor
  - Quản lý conversations: assign, đổi status (Open, Resolved, Pending)
  - Sử dụng Canned Responses để trả lời nhanh
  - Thêm ghi chú riêng về Visitor

  **3. Manager** - Quản lý:
  - Có toàn bộ quyền của Agent (inherits - thể hiện bằng đường nét đứt)
  - Quản lý team: thêm/xóa Agent
  - Cấu hình Project: domain whitelist, settings
  - Tạo Canned Responses và Action Templates
  - Cấu hình Webhooks cho external integration
  - Xem Audit Logs để theo dõi hoạt động"

  ⏱️ **Thời gian**: ~75 giây

  ---

  ## Slide 4: System Components Overview

  **Layout**: LayoutDiagram

  **Nội dung slide**: Mermaid flowchart hiển thị các tầng chính của hệ thống:
  - Clients (Agent Dashboard, Chat Widget)
  - Application Server (API & Gateway)
  - Workers (Visitor Msg Worker, Webhook Worker)
  - Data Layer (PostgreSQL, Redis)
  - External App

  Và các luồng: Agent Flow (Direct), Visitor Flow (Queued), Realtime Broadcast (Outbox Pattern), Webhooks

  **Script:**

  "Bây giờ chúng ta sẽ đi sâu vào các thành phần chính của hệ thống.

  Hệ thống được chia thành **4 tầng chính**:

  **Tầng Clients** gồm hai phần:
  - **Agent Dashboard**: Giao diện làm việc của nhân viên hỗ trợ
  - **Chat Widget**: Widget nhẹ nhúng vào website khách hàng

  **Application Server**: API & Gateway xử lý tất cả requests

  **Workers**: Xử lý background tasks:
  - **Visitor Msg Worker**: Xử lý tin nhắn từ visitor
  - **Webhook Worker**: Gửi webhooks đến external systems

  **Data Layer**: PostgreSQL và Redis

  **Điểm quan trọng về Message Flow**:

  1. **Agent Flow (Sync)**: Dashboard gọi API, API ghi **trực tiếp** vào Database
  2. **Visitor Flow (Async)**: Widget gọi API, API **enqueue** job, Worker xử lý và ghi Database
  3. **Realtime Broadcast**: Sau khi ghi DB, PostgreSQL **pg_notify** trigger Redis, Redis broadcast đến API để gửi real-time cho clients
  4. **Webhooks**: Redis trigger Webhook Worker, Worker gửi HTTP POST đến External App

  Cơ chế này sử dụng **Outbox Pattern** để đảm bảo tin nhắn không bao giờ bị mất."

  ⏱️ **Thời gian**: ~90 giây

  ---

  ## Slide 5: Deployment & Tech Stack (Section)

  **Layout**: LayoutSection

  **Nội dung slide**:
  - Title: "Deployment & Tech Stack"
  - Subtitle: "Công nghệ và cấu trúc Monorepo"

  **Script:**

  "Tiếp theo, chúng ta sẽ tìm hiểu về **công nghệ** và **cấu trúc Monorepo** của dự án."

  ⏱️ **Thời gian**: ~10 giây

  ---

  ## Slide 6: Technology Stack

  **Layout**: LayoutTwoCol

  **Nội dung slide**:
  - **Cột trái - Backend**:
    - Runtime: Node.js ≥18.x
    - Framework: NestJS
    - Database: PostgreSQL
    - Cache/Queue: Redis + BullMQ
    - Real-time: Socket.IO
  - **Cột phải - Frontend & DevOps**:
    - Dashboard: React
    - Widget: Preact (nhẹ hơn)
    - State: Zustand
    - Styling: TailwindCSS
    - Container: Docker Compose ≥2.x
    - Monorepo: npm workspaces
    - CI/CD: GitHub Actions (Auto Testing & Linting)

  **Script:**

  "**Backend Stack**:
  - **Runtime**: Node.js phiên bản 18 trở lên
  - **Framework**: NestJS - TypeScript first, dependency injection, modular architecture
  - **Database**: PostgreSQL cho ACID transactions
  - **Cache/Queue**: Redis kết hợp BullMQ cho background jobs
  - **Real-time**: Socket.IO cho WebSocket connections

  **Frontend Stack**:
  - **Dashboard**: React cho complex UI và rich interactions
  - **Widget**: Preact - chỉ khoảng 3KB, phù hợp cho embedded scenarios
  - **State Management**: Zustand - nhẹ hơn Redux rất nhiều
  - **Styling**: TailwindCSS cho rapid development

  **DevOps**:
  - **Container**: Docker Compose phiên bản 2.x
  - **Monorepo**: npm workspaces để quản lý multiple packages
  - **CI/CD**: GitHub Actions tự động chạy Testing và Linting

  Công nghệ được chọn với tiêu chí balance giữa **performance**, **developer experience**, và **maintainability**."

  ⏱️ **Thời gian**: ~60 giây

  ---

  ## Slide 7: Development Process

  **Layout**: LayoutTwoCol

  **Nội dung slide**:
  - **Cột trái - Agile & Iterative**:
    - Philosophy: "Build Small, Scale Fast"
    - Phase 1 (Core): Chat text-only (Agent ↔ Visitor)
    - Phase 2 (Real-time): WebSocket + Optimistic UI
    - Phase 3 (Enterprise): Multi-tenancy + Security
    - Final: AI Orchestration
  - **Cột phải - Why NestJS?**:
    - Modular: Dễ chia tách features (Auth, Inbox, Gateway)
    - Opinionated: Chuẩn hóa cách viết code cho Team 4 người
    - Ecosystem: Support Native cho WebSocket & Microservices

  **Script:**

  "**Về quy trình phát triển**:

  Chúng em áp dụng **Agile & Iterative** với philosophy **'Build Small, Scale Fast'**:

  - **Phase 1 (Core)**: Xây dựng chat text-only cơ bản giữa Agent và Visitor
  - **Phase 2 (Real-time)**: Thêm WebSocket và Optimistic UI để cải thiện trải nghiệm
  - **Phase 3 (Enterprise)**: Implement Multi-tenancy và Security features
  - **Final**: Tích hợp AI Orchestration

  **Tại sao chọn NestJS?**:

  - **Modular**: Dễ chia tách features thành các modules độc lập như Auth, Inbox, Gateway
  - **Opinionated**: Chuẩn hóa cách viết code cho Team 4 người - ai cũng viết theo cùng một pattern
  - **Ecosystem**: Support native cho WebSocket và Microservices - không cần thêm nhiều thư viện bên ngoài"

  ⏱️ **Thời gian**: ~60 giây

  ---

  ## Slide 8: Monorepo Structure

  **Layout**: LayoutTitleContent

  **Nội dung slide**: File tree structure của project

  **Script:**

  "Cấu trúc **Monorepo** của dự án:

  **Folder `packages`** chứa toàn bộ source code:
  - **backend**: NestJS API với các modules:
    - `auth` - Authentication
    - `inbox` - Messages và Conversations
    - `gateway` - WebSocket handling
    - `webhooks` - External integration
  - **frontend**: React Dashboard và Preact Widget
  - **shared-***: Shared DTOs và Types dùng chung

  **Folder `docs`**: Documentation

  **Lợi ích**:
  - **Code sharing dễ dàng** giữa frontend và backend
  - **Build/deploy thống nhất** với single command"

  ⏱️ **Thời gian**: ~45 giây

  ---

  ## Slide 9: Event-Driven Core (Section)

  **Layout**: LayoutSection

  **Nội dung slide**:
  - Title: "Event-Driven Core"
  - Subtitle: "Kiến trúc Event và Socket.IO Room Isolation"

  **Script:**

  "Bây giờ chúng ta đi vào phần **quan trọng nhất**: **Event-Driven Core** và cơ chế room isolation."

  ⏱️ **Thời gian**: ~10 giây

  ---

  ## Slide 10: Event Architecture

  **Layout**: LayoutDiagram

  **Nội dung slide**: Mermaid flowchart với 2 sections:
  - Inbound Events (Visitor → System): EventsGateway → visitor.message.received → InboxEventHandlerService → BullMQ Queue
  - Outbound Events (System → Visitor): Domain Services (ConversationService, MessageService, VisitorsService) → EventEmitter2 Events → GatewayEventListener handlers → EventsGateway Broadcast

  **Script:**

  "Đây là sơ đồ **kiến trúc Event** của hệ thống.

  **Inbound Events** (Visitor → System):
  - EventsGateway nhận events từ Widget
  - Emit event `visitor.message.received` đến InboxEventHandlerService
  - Handler enqueue job vào BullMQ Queue để xử lý background

  **Outbound Events** (System → Visitor):
  - **Domain Services** (ConversationService, MessageService, VisitorsService) không gọi trực tiếp Gateway
  - Thay vào đó, phát events qua **EventEmitter2 Bus**:
    - `conversation.updated`: Conversation assign hoặc đổi status
    - `agent.message.sent`: Agent gửi tin nhắn
    - `visitor.updated`: Visitor info thay đổi

  **GatewayEventListener** lắng nghe các events này:
  - `handleConversationUpdated` → Broadcast to Rooms
  - `handleAgentMessageSent` → Broadcast to Rooms + Emit to Visitor Socket
  - `handleVisitorUpdated` → Broadcast to Rooms

  **Ưu điểm** của kiến trúc decoupled: Services chỉ quan tâm **business logic**, không cần biết ai sẽ xử lý events."

  ⏱️ **Thời gian**: ~75 giây

  ---

  ## Slide 11: Event Catalog

  **Layout**: LayoutTwoCol

  **Nội dung slide**:
  - **Cột trái - Inbox Events**:
    - conversationUpdated: Assign, status change
    - newMessage: Tin nhắn mới
  - **Cột phải - Visitor Events**:
    - visitorStatusChanged: Connect/Disconnect
    - visitorIsTyping: Visitor gõ phím
    - visitorContextUpdated: URL thay đổi

  **Script:**

  "Catalog các events trong hệ thống:

  **Inbox Events**:
  - `conversationUpdated`: Trigger khi assign agent hoặc status thay đổi (OPEN → RESOLVED)
  - `newMessage`: Trigger khi có tin nhắn mới từ visitor hoặc agent

  **Visitor Events**:
  - `visitorStatusChanged`: Trigger khi visitor connect hoặc disconnect
  - `visitorIsTyping`: Trigger khi visitor đang gõ phím - hiển thị typing indicator
  - `visitorContextUpdated`: Trigger khi visitor di chuyển trang - agent biết visitor đang xem trang nào

  Tất cả events đều **type-safe** với TypeScript."

  ⏱️ **Thời gian**: ~45 giây

  ---

  ## Slide 12: Webhooks (Section)

  **Layout**: LayoutSection

  **Nội dung slide**:
  - Title: "Webhooks"
  - Subtitle: "External Integration với SSRF Protection"

  **Script:**

  "Phần tiếp theo: **Webhooks** - External Integration với **SSRF Protection**."

  ⏱️ **Thời gian**: ~8 giây

  ---

  ## Slide 13: Webhook Architecture (Overview)

  **Layout**: LayoutDiagram

  **Nội dung slide**: Mermaid flowchart:
  Message Created → Redis Pub/Sub → Dispatcher → BullMQ Queue → Processor → Customer Server

  **Script:**

  "Đây là sơ đồ tổng quan về **Webhook Architecture**.

  Khi một **Message được tạo** (Trigger), sự kiện được broadcast qua **Redis Pub/Sub** đến **Dispatcher**.

  **Dispatcher** lắng nghe channel này, tìm các webhook subscriptions cần gửi, rồi đẩy jobs vào **BullMQ Queue**.

  **BullMQ Queue** lưu trong Redis - đảm bảo **persistence** và **retry mechanism**.

  **Processor** (BullMQ Worker) lấy jobs từ queue và gửi **HTTP POST** đến **Customer Server**."

  ⏱️ **Thời gian**: ~40 giây

  ---

  ## Slide 14: Webhook Architecture: Detailed Flow

  **Layout**: LayoutDiagram

  **Nội dung slide**: Mermaid sequenceDiagram chi tiết với 3 bước:
  1. Trigger & Broadcast
  2. Dispatcher Receives & Enqueues
  3. Processor Executes

  **Script:**

  "Đây là luồng **chi tiết** của Webhook Architecture.

  **ĐIỂM QUAN TRỌNG**: Redis Pub/Sub và BullMQ Queue đều dùng **cùng một Redis Server**, nhưng với cơ chế khác nhau:
  - **Pub/Sub**: Broadcast đến TẤT CẢ subscribers (fire-and-forget)
  - **BullMQ**: Lưu jobs trong Redis dưới dạng Lists, chỉ 1 worker claim mỗi job

  **BƯỚC 1 - TRIGGER & BROADCAST**:
  - Khi message được tạo, **OutboxListener** phát hiện qua PostgreSQL NOTIFY
  - OutboxListener publish event lên Redis Pub/Sub channel
  - Đây là broadcast - mọi Dispatcher đều nhận được

  **BƯỚC 2 - DISPATCHER RECEIVES & ENQUEUES**:
  - **WebhookDispatcher** đã subscribe channel từ trước
  - Khi nhận message, Dispatcher query database tìm **active subscriptions**
  - Với mỗi subscription, Dispatcher tạo job vào BullMQ Queue

  **BƯỚC 3 - PROCESSOR EXECUTES**:
  - **WebhookProcessor** liên tục polling queue
  - Worker claim job bằng **distributed lock** - chỉ 1 worker xử lý
  - Processor ký payload bằng **HMAC-SHA256** và gửi HTTP POST
  - Nếu thành công: log SUCCESS
  - Nếu thất bại: retry với **exponential backoff** (1s, 2s, 4s, 8s, 16s)

  Cơ chế này đảm bảo: **Reliability** (retry), **Scalability** (distributed workers), **Security** (HMAC signature)."

  ⏱️ **Thời gian**: ~90 giây

  ---

  ## Slide 15: Webhook Components & Security

  **Layout**: LayoutTwoCol

  **Nội dung slide**:
  - **Cột trái - Components**:
    - Dispatcher: Lắng nghe Redis → Enqueue jobs
    - Processor: HTTP POST + retry + HMAC
    - Delivery Log: Theo dõi trạng thái gửi
  - **Cột phải - SSRF Protection**:
    - HTTPS only
    - DNS Validation
    - Block Private IPs
    - HMAC Signature

  **Script:**

  "**Components**:
  - **Dispatcher**: Lắng nghe Redis → Enqueue jobs
  - **Processor**: HTTP POST + retry + HMAC signature
  - **Delivery Log**: Theo dõi trạng thái gửi của từng webhook

  **SSRF Protection** - 4 layers bảo vệ:

  1. **HTTPS only**: Chỉ chấp nhận URL với `https://` protocol

  2. **DNS Validation**: Resolve hostname **trước** khi gửi request

  3. **Block Private IPs**: Reject các dải IP private:
    - `127.0.0.0/8` (localhost)
    - `10.0.0.0/8`, `192.168.0.0/16` (private network)
    
    Điều này ngăn attacker dùng webhook để scan internal network

  4. **HMAC Signature**: Header `X-Hub-Signature-256` - Customer có thể verify request thực sự đến từ hệ thống của chúng em"

  ⏱️ **Thời gian**: ~60 giây

  ---

  ## Slide 16: Audit Logs (Section)

  **Layout**: LayoutSection

  **Nội dung slide**:
  - Title: "Audit Logs"
  - Subtitle: "Security Compliance & Investigation"

  **Script:**

  "Phần cuối cùng: **Audit Logs** - đảm bảo security compliance và hỗ trợ investigation."

  ⏱️ **Thời gian**: ~8 giây

  ---

  ## Slide 17: Audit System

  **Layout**: LayoutTwoCol

  **Nội dung slide**:
  - **Cột trái - Overview**:
    - Mục đích: Security compliance
    - Cơ chế: Decorator-based Interceptor
    - Pattern: Fail-Open
    - Storage: PostgreSQL + JSONB
    - Code example với @Auditable decorator
  - **Cột phải - Sensitive Data Redaction**:
    - SENSITIVE_KEYS list
    - Example output với [REDACTED]
    - Case-insensitive và Recursive matching

  **Script:**

  "Hệ thống **Audit**:

  **Mục đích**: Security compliance - tạo audit trail cho mọi hành động quan trọng

  **Cơ chế**: **Decorator-based Interceptor**. Developers chỉ cần thêm decorator:

  ```typescript
  @Auditable({ 
    action: AuditAction.UPDATE, 
    entity: 'Conversation' 
  })
  @Patch(':id/assign')
  async assign(@Body() dto) { ... }
  ```

  Mỗi khi endpoint `assign` được gọi, hệ thống tự động tạo audit log.

  **Pattern**: **Fail-Open** - nếu audit fails, operation vẫn tiếp tục. Chúng em không để audit crash business logic.

  **Storage**: PostgreSQL với **JSONB** columns - query hiệu quả.

  **Sensitive Data Redaction**:

  SENSITIVE_KEYS: `password`, `token`, `secret`, `authorization`, `apikey`, `creditcard`, `cvv`, `ssn`

  Hệ thống tự động scan và redact:

  ```json
  {
    "email": "user@example.com",
    "password": "[REDACTED]",
    "token": "[REDACTED]"
  }
  ```

  Hai điểm quan trọng:
  1. **Case-insensitive**: `Password`, `PASSWORD`, `password` đều được redact
  2. **Recursive**: Scan deep vào nested objects và arrays

  Thiết kế này giúp comply với **GDPR** và **PCI-DSS**."

  ⏱️ **Thời gian**: ~75 giây

  ---

  ## Slide 18: Summary (Section)

  **Layout**: LayoutSection

  **Nội dung slide**:
  - Title: "Summary"
  - Subtitle: "Tổng kết phần System Architecture"

  **Script:**

  "Bây giờ chúng ta sẽ **tổng kết** phần System Architecture."

  ⏱️ **Thời gian**: ~8 giây

  ---

  ## Slide 19: Architecture Recap

  **Layout**: LayoutTitleContent

  **Nội dung slide**: Table với 6 chủ đề chính

  **Script:**

  " **6 điểm chính** đã được trình bày:

  1. **Kiến trúc**: Event-Driven Microservices với NestJS framework

  2. **Multi-tenancy**: Project-based isolation với RBAC

  3. **Real-time**: Socket.IO Rooms + EventEmitter2 cho low-latency messaging

  4. **Message Flow**: Optimistic UI + Outbox Pattern để đảm bảo reliability

  5. **External Integration**: Webhooks với 4-layer SSRF Protection

  6. **Compliance**: Audit Logs với Fail-Open pattern và Sensitive Data Redaction

  Tất cả quyết định kiến trúc đều hướng đến: hệ thống **scalable**, **secure**, và **maintainable**.

  Cảm ơn thầy/cô đã lắng nghe. Em xin nhường lại cho thành viên tiếp theo."

  ⏱️ **Thời gian**: ~45 giây

  ---

  # Tổng thời gian ước tính

  | Section | Slides | Thời gian |
  |---------|--------|-----------|
  | Intro & Overview | 1-4 | ~4 phút |
  | Tech Stack & Monorepo | 5-8 | ~3 phút |
  | Event-Driven Core | 9-11 | ~2.5 phút |
  | Webhooks | 12-15 | ~3.5 phút |
  | Audit Logs | 16-17 | ~1.5 phút |
  | Summary | 18-19 | ~1 phút |
  | **Tổng** | **19 slides** | **~15-18 phút** |

  ---

  # Presentation Tips

  ## Kỹ năng trình bày

  ### Tốc độ nói
  - **120-150 từ/phút** là tốc độ lý tưởng
  - **Dừng ngắn** (1-2 giây) sau mỗi ý quan trọng
  - **Nhấn mạnh** các keywords quan trọng (in đậm trong script)

  ### Ngôn ngữ cơ thể
  - **Eye contact** với giảng viên và các bạn
  - **Chỉ vào slide** khi giải thích diagram
  - **Di chuyển tự nhiên**, không đứng yên một chỗ

  ### Xử lý câu hỏi
  - Nếu không biết: "Em sẽ tìm hiểu thêm và trả lời sau ạ"
  - Nếu câu hỏi liên quan phần khác: "Phần này sẽ do [teammate] trình bày chi tiết hơn ạ"

  ---

  # Q&A Preparation

  ## Câu hỏi có thể gặp

  ### 1. Tại sao chọn Event-Driven?
  **Trả lời**: "Vì yêu cầu real-time và decoupling. Khi message được tạo, nhiều services cần biết (notification, webhook, logging) nhưng không muốn chúng coupled với nhau."

  ### 2. Outbox Pattern là gì? Tại sao cần?
  **Trả lời**: "Outbox Pattern giải quyết vấn đề dual-write - khi cần vừa ghi database vừa publish event. Chúng em ghi cả hai vào cùng transaction PostgreSQL, sau đó dùng pg_notify để broadcast. Nếu server crash sau commit, data đã được lưu và outbox processor sẽ retry."

  ### 3. SSRF là gì? Tại sao quan trọng?
  **Trả lời**: "SSRF - Server-Side Request Forgery - là attack mà attacker lợi dụng server để gửi request đến internal network. Trong webhook, nếu không validate URL, attacker có thể nhập `http://127.0.0.1:8080/admin` để access internal services. Chúng em block tất cả private IPs và chỉ cho phép HTTPS."

  ### 4. Tại sao dùng 2 BullMQ Queues riêng?
  **Trả lời**: "Để tách biệt concerns. Queue xử lý message cần priority cao và fast, queue webhook có thể chậm hơn vì phụ thuộc external server. Nếu webhook queue bị backlog, không ảnh hưởng message processing."

  ### 5. Fail-Open vs Fail-Close trong Audit?
  **Trả lời**: "Fail-Open nghĩa là nếu audit logging bị lỗi, business operation vẫn tiếp tục. Chúng em chọn approach này vì không muốn user không assign được conversation chỉ vì audit service down. Audit failures được log riêng để monitor."
