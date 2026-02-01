# Member 1 Presentation Script - System Architecture

> **Thời lượng dự kiến**: 18-22 phút  
> **Số slides**: 23 slides  
> **Vai trò**: System Architect

---

## Slide 1: Title Slide - System Architecture

**Layout**: LayoutSection

**Nội dung slide**:
- Title: "System Architecture"
- Subtitle: "Member 1: System Architect"
- Mô tả: "Kiến trúc tổng thể, triển khai, Event-Driven Core, Webhooks, và Audit Logs"

**Script:**

"Xin chào các thầy cô và các bạn. Tôi là Member 1 - System Architect của dự án Live Chat.

Trong phần trình bày của mình, tôi sẽ giới thiệu về **Kiến trúc tổng thể** của hệ thống, bao gồm:
- Event-Driven Core - trái tim của hệ thống real-time
- Triển khai và Tech Stack
- Webhooks - tích hợp với hệ thống bên ngoài
- Audit Logs - đảm bảo compliance"

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

"Trước tiên, để các bạn có cái nhìn tổng quan về hệ thống chúng tôi đang xây dựng.

**Về Application Type**: Đây là một nền tảng **Customer Support Chat Platform**, cho phép real-time messaging giữa **Visitor** - người truy cập website - và **Agent** - nhân viên hỗ trợ. 

Hệ thống bao gồm:
- Một **chat widget** có thể nhúng vào bất kỳ website nào của khách hàng
- Một **dashboard quản lý** dành cho các nhân viên hỗ trợ

**Về Architecture Style**: Chúng tôi chọn kiến trúc **Event-Driven Microservices**. Các điểm đặc biệt là:

1. **Real-time**: Sử dụng WebSocket thông qua Socket.IO để đảm bảo tin nhắn được truyền trong thời gian thực
2. **Multi-tenant**: Hỗ trợ nhiều công ty khác nhau sử dụng cùng hệ thống, với dữ liệu được cô lập hoàn toàn theo từng Project
3. **Decoupled**: Các thành phần giao tiếp thông qua EventEmitter2 Bus, giúp hệ thống linh hoạt và dễ mở rộng"

⏱️ **Thời gian**: ~60 giây

---

## Slide 3: System Components Overview

**Layout**: LayoutDiagram

**Nội dung slide**: Mermaid flowchart hiển thị 5 tầng chính của hệ thống:
- Frontend (Dashboard React, Widget Preact)
- WebSocket Layer (Socket.IO Gateway, Project Rooms)
- Backend (Guards, REST Controllers, EventBus, Services)
- Workers (BullMQ Consumer, Webhook Processor)
- Infrastructure (PostgreSQL, Redis)

**Script:**

"Bây giờ chúng ta sẽ đi sâu vào các thành phần chính của hệ thống qua sơ đồ này.

Hệ thống được chia thành **5 tầng chính**:

**Tầng Frontend** gồm hai phần:
- **Agent Dashboard**: Được viết bằng React, đây là giao diện làm việc của nhân viên hỗ trợ
- **Chat Widget**: Được viết bằng Preact - một phiên bản nhẹ hơn của React, chỉ khoảng 3KB - để đảm bảo tải nhanh khi nhúng vào website khách hàng

**Tầng WebSocket Layer**: Sử dụng Socket.IO Gateway để xử lý tất cả các kết nối real-time. Đặc biệt, chúng tôi sử dụng cơ chế **Project Rooms** để cô lập các sự kiện theo từng project.

**Tầng Backend**: Xây dựng trên NestJS framework, bao gồm:
- **REST Controllers** để xử lý các API request
- **Domain Services** chứa business logic
- **Auth Guards** và **RBAC** để kiểm soát quyền truy cập

**Background Workers**: Xử lý các tác vụ nặng như gửi webhook mà không làm block main thread. Chúng tôi dùng **BullMQ** để quản lý queue.

Cuối cùng là **Infrastructure layer**: Gồm PostgreSQL để lưu trữ dữ liệu, và Redis phục vụ cho cache, queue, và pub/sub.

Các thành phần này làm việc phối hợp với nhau để tạo nên một hệ thống real-time hiệu quả và scalable."

⏱️ **Thời gian**: ~90 giây

---

## Slide 4: Multi-Tenancy with Projects

**Layout**: LayoutTwoCol

**Nội dung slide**:
- **Cột trái - Data Isolation**: 
  - Mọi entity → projectId → Cô lập hoàn toàn
  - Project: Đơn vị cô lập dữ liệu gốc
  - ProjectMember: Liên kết User với Project
  - Mọi request phải validate project membership
- **Cột phải - Role Hierarchy**:
  - MANAGER: Toàn quyền
  - AGENT: Chat và quản lý conversation

**Script:**

"Một trong những đặc điểm quan trọng nhất của hệ thống là khả năng **Multi-Tenancy**.

**Về Data Isolation**: Mọi entity trong hệ thống đều có **projectId**. Đây là đơn vị cô lập dữ liệu gốc. Điều này có nghĩa là:
- **Project** là container chứa tất cả dữ liệu của một công ty
- **ProjectMember** liên kết User với Project
- Mọi request đều phải **validate project membership** trước khi cho phép truy cập

**Về Role Hierarchy**: Hệ thống có 2 role chính:
- **MANAGER**: Có toàn quyền quản lý - bao gồm cấu hình hệ thống, xem báo cáo, và quản lý team members
- **AGENT**: Quyền chat với khách hàng và quản lý conversation

**Điểm quan trọng nhất** là: Dữ liệu của công ty A **không bao giờ** có thể lẫn với công ty B. Mỗi project là một môi trường độc lập hoàn toàn."

⏱️ **Thời gian**: ~60 giây

---

## Slide 5: Visitor → Agent Flow (Overview)

**Layout**: LayoutDiagram

**Nội dung slide**: Mermaid flowchart đơn giản hóa luồng:
Widget → EventsGateway → EventConsumerService → PostgreSQL → Redis Pub/Sub → Project Room → Dashboard
(+ Background path: BullMQ → Webhooks)

**Script:**

"Đây là **tổng quan luồng** Visitor gửi tin nhắn đến Agent.

**Critical Path (~60ms)**:
- Widget gửi tin nhắn qua Socket.IO đến **EventsGateway**
- Gateway phát event qua EventEmitter đến **EventConsumerService**
- EventConsumerService lưu **Message** và **Outbox entry** vào PostgreSQL trong cùng một transaction

Sau khi commit, PostgreSQL **NOTIFY trigger** kết hợp **Outbox Pattern** đảm bảo message được broadcast qua **Redis Pub/Sub**.

EventsGateway nhận event từ Redis và emit đến **Project Room** cụ thể (ví dụ `project:X`). **Chỉ** các Agents đã join room này mới nhận được message - đây là cơ chế **multi-tenancy isolation**.

**Background path**: EventConsumerService enqueue webhook job vào BullMQ để xử lý sau, **không block** real-time flow.

Kết quả: Critical path từ Widget đến Dashboard chỉ mất khoảng **~60ms**."

⏱️ **Thời gian**: ~60 giây

---

## Slide 6: Visitor → Agent: Complete Flow (Sequence Diagram)

**Layout**: LayoutDiagram

**Nội dung slide**: Mermaid sequenceDiagram chi tiết với 4 phases:
1. Optimistic UI (~5ms)
2. Event Routing
3. Background Processing
4. Real-time Broadcast

**Script:**

"Đây là luồng **HOÀN CHỈNH** khi Visitor gửi tin nhắn đến Agent.

**PHASE 1 - OPTIMISTIC UI (~5ms)**: Ngay khi visitor nhấn gửi, Widget hiển thị tin nhắn **NGAY LẬP TỨC** với status `SENDING`. Người dùng không phải chờ.

**PHASE 2 - EVENT ROUTING**:
- Widget emit event qua Socket.IO đến EventsGateway
- Gateway forward event qua EventEmitter đến InboxEventHandlerService
- InboxEventHandlerService enqueue job vào BullMQ

**PHASE 3 - BACKGROUND PROCESSING**:
- BullMQ dequeue job và gọi EventProcessor
- EventProcessor gọi EventConsumerService
- EventConsumerService bắt đầu database **TRANSACTION**:
  - Save Message vào messages table
  - Save Outbox Entry vào outbox table (cùng transaction!)
  - **COMMIT** transaction - đảm bảo **ATOMIC** operation
  
**PHASE 4 - REAL-TIME BROADCAST (~10ms)**:
- PostgreSQL trigger tự động phát **NOTIFY** event sau khi commit
- Redis Pub/Sub nhận NOTIFY và broadcast đến **TẤT CẢ** servers
- EventsGateway ở mọi servers nhận event từ Redis
- Gateway emit `NEW_MESSAGE` đến Dashboard của Agent đang online
- Gateway cũng emit `MESSAGE_SENT` confirmation đến Widget
- Widget cập nhật status từ `SENDING` thành `SENT`

**Điểm quan trọng**: **Outbox Pattern** đảm bảo nếu server crash **SAU** khi commit transaction, message đã được lưu và outbox processor sẽ retry broadcast. Đây là **exactly-once delivery** guarantee."

⏱️ **Thời gian**: ~90 giây

---

## Slide 7: Agent → Visitor Flow (Overview)

**Layout**: LayoutDiagram

**Nội dung slide**: Mermaid flowchart đơn giản hóa luồng:
Dashboard → Auth Guards → MessageService → PostgreSQL + Redis Session → GatewayEventListener → Redis Pub/Sub → EventsGateway → Widget + Project Room

**Script:**

"Đây là **tổng quan luồng** Agent gửi tin nhắn đến Visitor.

**Authentication Flow**:
- Dashboard gửi REST API request với JWT token
- Request đi qua **Auth Guards & RBAC** để verify authentication và authorization

**Processing**:
- MessageService nhận authenticated user
- Lưu message vào PostgreSQL transaction
- Đồng thời lookup visitor's **socketId** từ Redis Session

**Broadcast**:
- Sau transaction, MessageService emit event qua EventEmitter đến **GatewayEventListener**
- Listener **PUBLISH** lên **Redis Pub/Sub** để broadcast cross-server
- EventsGateway nhận từ Redis và emit tin nhắn đến **Widget** của visitor
- Đồng thời, Gateway emit đến **Project Room** để broadcast `NEW_MESSAGE` cho tất cả Agents khác đang join room này - đảm bảo multi-tenancy isolation

**Điểm quan trọng**: Redis Pub/Sub đảm bảo tin nhắn được deliver ngay cả khi visitor socket ở **server khác**."

⏱️ **Thời gian**: ~60 giây

---

## Slide 8: Agent → Visitor: Complete Flow (Sequence Diagram)

**Layout**: LayoutDiagram

**Nội dung slide**: Mermaid sequenceDiagram chi tiết với các phases:
1. Authentication (~10ms)
2. Critical Path (~50ms)
3. Real-time Broadcast via Redis
4. HTTP Response

**Script:**

"Đây là luồng **HOÀN CHỈNH** khi Agent gửi tin reply đến Visitor.

**AUTHENTICATION (~10ms)**:
- Dashboard gửi REST API request với JWT token
- **JwtAuthGuard** verify token signature và extract user
- **RolesGuard** kiểm tra user có role AGENT/MANAGER trong project
- Chỉ khi pass **cả 2 guards** mới được tiếp tục

**CRITICAL PATH (~50ms - Synchronous)**:
- InboxController gọi `MessageService.sendAgentReply()`
- MessageService bắt đầu database **TRANSACTION**:
  - Find Conversation và validate permissions
  - Lookup visitor's **socketId** từ Redis Session
  - Save Message với status `SENT` (nếu visitor online) hoặc `DELIVERED` (nếu offline)
  - `validateProjectMembership` để đảm bảo conversation thuộc đúng project
  - **COMMIT** transaction

**REAL-TIME BROADCAST via Redis Pub/Sub (~10ms)**:
- Sau transaction, MessageService emit event local `agent.message.sent`
- **GatewayEventListener** nhận event
- Listener **PUBLISH** message lên Redis channel `agent_reply_channel`
- Redis broadcast đến **TẤT CẢ servers** (critical cho multi-server!)
- EventsGateway ở mọi servers nhận event:
  - Server có visitor socket → emit `AGENT_REPLIED` đến Widget
  - Broadcast `NEW_MESSAGE` đến Other Agents trong project room

**HTTP RESPONSE**:
- MessageService return saved message object
- InboxController return HTTP **200 OK** với message data
- Dashboard nhận response và biết chắc message đã gửi thành công

**Điểm QUAN TRỌNG**: Redis Pub/Sub là **BẮT BUỘC** cho multi-server deployment! Vì visitor socket có thể ở server khác với server xử lý agent request. Nếu chỉ emit local Socket.IO, visitor sẽ **KHÔNG BAO GIỜ** nhận được message."

⏱️ **Thời gian**: ~90 giây

---

## Slide 9: Deployment & Tech Stack (Section)

**Layout**: LayoutSection

**Nội dung slide**:
- Title: "Deployment & Tech Stack"
- Subtitle: "Công nghệ và cấu trúc Monorepo"

**Script:**

"Tiếp theo, chúng ta sẽ tìm hiểu về **công nghệ** và **cấu trúc Monorepo** của dự án."

⏱️ **Thời gian**: ~10 giây

---

## Slide 10: Technology Stack

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

**Script:**

"**Backend Stack**:
- **Runtime**: Node.js phiên bản 18 trở lên
- **Framework**: NestJS - TypeScript first, dependency injection, modular architecture
- **Database**: PostgreSQL cho ACID transactions và JSONB support
- **Cache/Queue**: Redis kết hợp BullMQ cho background jobs
- **Real-time**: Socket.IO cho WebSocket connections

**Frontend Stack**:
- **Dashboard**: React cho complex UI và rich interactions
- **Widget**: Preact - chỉ khoảng 3KB, phù hợp cho embedded scenarios
- **State Management**: Zustand - nhẹ hơn Redux rất nhiều
- **Styling**: TailwindCSS cho rapid development

**DevOps**:
- **Container**: Docker Compose phiên bản 2.x trở lên
- **Monorepo**: npm workspaces để quản lý multiple packages

Công nghệ được chọn với tiêu chí balance giữa **performance**, **developer experience**, và **maintainability**."

⏱️ **Thời gian**: ~60 giây

---

## Slide 11: Monorepo Structure

**Layout**: LayoutTitleContent

**Nội dung slide**: File tree structure của project

**Script:**

"Cấu trúc **Monorepo** của dự án rất rõ ràng:

**Folder `packages`** chứa toàn bộ source code:
- **backend**: NestJS API và Worker, chia thành các modules:
  - `auth` - Authentication
  - `inbox` - Messages và Conversations
  - `gateway` - WebSocket handling
  - `webhooks` - External integration
- **frontend**: React Dashboard và Preact Widget
- **shared-***: Shared DTOs và Types dùng chung giữa frontend và backend

**Folder `docs`**: Documentation

**Lợi ích của cấu trúc này**:
- **Code sharing dễ dàng** giữa frontend và backend
- **Build/deploy thống nhất** với single command
- **Refactoring an toàn** - khi thay đổi interface, tất cả consumers đều được cập nhật ngay"

⏱️ **Thời gian**: ~60 giây

---

## Slide 12: Event-Driven Core (Section)

**Layout**: LayoutSection

**Nội dung slide**:
- Title: "Event-Driven Core"
- Subtitle: "Kiến trúc Event và Socket.IO Room Isolation"

**Script:**

"Bây giờ chúng ta đi vào phần **quan trọng nhất**: **Event-Driven Core** và **Socket.IO Room Isolation**."

⏱️ **Thời gian**: ~10 giây

---

## Slide 13: Event Architecture

**Layout**: LayoutDiagram

**Nội dung slide**: Mermaid flowchart với 3 sections:
- Inbound Events (Visitor → System)
- Domain Services
- Outbound Events (System → Gateway via EventEmitter2)

**Script:**

"Đây là sơ đồ **kiến trúc Event** của hệ thống.

**Inbound Events** (Visitor → System):
- EventsGateway nhận events từ Widget
- Emit event `visitor.message.received` đến InboxEventHandlerService
- Handler enqueue job vào BullMQ Queue

**Domain Services** ở backend:
- ConversationService
- MessageService
- VisitorService

Khi thực hiện action quan trọng, services **không gọi trực tiếp** consumer. Thay vào đó, phát events qua **EventEmitter2 Bus**:
- `conversation.updated`: Conversation assign hoặc đổi status
- `agent.message.sent`: Agent gửi tin nhắn
- `visitor.updated`: Visitor info thay đổi

**GatewayEventListener** lắng nghe các events này:
- `handleConversationUpdated` lắng nghe `conversation.updated`
- `handleAgentMessageSent` lắng nghe `agent.message.sent`
- `handleVisitorUpdated` lắng nghe `visitor.updated`

Mỗi handler gọi **EventsGateway** để broadcast đến clients qua WebSocket.

**Ưu điểm** của kiến trúc decoupled này: Services chỉ quan tâm **business logic**, không cần biết ai sẽ xử lý events."

⏱️ **Thời gian**: ~75 giây

---

## Slide 14: Socket.IO Room Isolation

**Layout**: LayoutTitleContent

**Nội dung slide**: Code example cho `handleJoinProjectRoom` và broadcast to room

**Script:**

"**Thách thức**: Làm sao cô lập events giữa các projects trong môi trường multi-tenant realtime?

**Giải pháp**: **Socket.IO Rooms**.

Function `handleJoinProjectRoom` khi agent join:

**Bước 1 - Authentication**: Kiểm tra đăng nhập. Nếu không có user data → throw `WsException('Unauthorized')`.

**Bước 2 - Authorization**: Validate user là member của project qua `projectService.validateProjectMembership`. Không phải member → throw exception.

**Bước 3 - Join Room**: Chỉ khi pass CẢ 2 kiểm tra, client mới được join room `project:{projectId}`.

**Khi broadcast**:
```typescript
this.server.to(`project:${projectId}`).emit('conversationUpdated', payload);
```

Event **chỉ gửi đến** clients trong room cụ thể đó.

**Kết quả**: Agent của công ty A **hoàn toàn không thể** nhận event của công ty B - đây là **security measure** quan trọng nhất trong multi-tenant system."

⏱️ **Thời gian**: ~60 giây

---

## Slide 15: Event Catalog

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
- `visitorIsTyping`: Trigger khi visitor đang gõ phím - dùng cho typing indicator
- `visitorContextUpdated`: Trigger khi visitor di chuyển trang - agent biết visitor đang xem trang nào

Tất cả events follow **naming convention** nhất quán và **type-safe** với TypeScript."

⏱️ **Thời gian**: ~45 giây

---

## Slide 16: Webhooks (Section)

**Layout**: LayoutSection

**Nội dung slide**:
- Title: "Webhooks"
- Subtitle: "External Integration với SSRF Protection"

**Script:**

"Phần tiếp theo: **Webhooks** - External Integration với **SSRF Protection**."

⏱️ **Thời gian**: ~10 giây

---

## Slide 17: Webhook Architecture (Overview)

**Layout**: LayoutDiagram

**Nội dung slide**: Mermaid flowchart đơn giản:
Message Created → Redis Pub/Sub → Dispatcher → BullMQ Queue → Processor → Customer Server

**Script:**

"Đây là sơ đồ tổng quan về **Webhook Architecture**.

Khi một **Message được tạo** (Trigger), sự kiện được broadcast qua **Redis Pub/Sub** đến **Dispatcher**.

**Dispatcher** lắng nghe channel này, tìm các webhook subscriptions cần gửi, rồi đẩy jobs vào **BullMQ Queue**.

**BullMQ Queue** thực chất là data structures được lưu trong Redis - đảm bảo **persistence** và **retry mechanism**.

**Processor** (BullMQ Worker) lấy jobs từ queue và gửi **HTTP POST** đến **Customer Server** của khách hàng.

Slide tiếp theo sẽ giải thích chi tiết hơn về infrastructure và luồng xử lý."

⏱️ **Thời gian**: ~45 giây

---

## Slide 18: Webhook Architecture: Detailed Flow

**Layout**: LayoutDiagram

**Nội dung slide**: Mermaid sequenceDiagram chi tiết với 3 bước:
1. Trigger & Broadcast
2. Dispatcher Receives & Enqueues
3. Processor Executes

**Script:**

"Đây là luồng **chi tiết** của Webhook Architecture.

**ĐIỂM QUAN TRỌNG**: Redis Pub/Sub và BullMQ Queue đều sử dụng **CÙNG MỘT Redis Server**, nhưng với cơ chế khác nhau:
- **Pub/Sub**: Broadcast message đến TẤT CẢ subscribers (fire-and-forget)
- **BullMQ**: Lưu jobs trong Redis dưới dạng Lists, chỉ 1 worker claim mỗi job

**BƯỚC 1 - TRIGGER & BROADCAST**:
- Khi message được tạo, **OutboxListener** (chạy trong Worker Server) phát hiện thông qua PostgreSQL NOTIFY
- OutboxListener publish event lên Redis Pub/Sub channel `new_message_channel`
- Đây là **broadcast** - mọi Dispatcher trên tất cả servers đều nhận được

**BƯỚC 2 - DISPATCHER RECEIVES & ENQUEUES**:
- **WebhookDispatcher** (chạy trong API Server) đã subscribe vào channel từ trước
- Khi nhận message, Dispatcher query database để tìm **active subscriptions** cho project
- Với mỗi subscription, Dispatcher tạo job và đẩy vào BullMQ Queue
- Queue này được lưu trong Redis, **shared** cho tất cả servers

**BƯỚC 3 - PROCESSOR EXECUTES**:
- **WebhookProcessor** (BullMQ Worker) liên tục polling queue
- Khi có job, Worker claim bằng **distributed lock** - đảm bảo chỉ 1 worker xử lý
- Processor ký payload bằng **HMAC-SHA256** và gửi HTTP POST đến Customer Server
- Nếu thành công: log SUCCESS
- Nếu thất bại: retry với **exponential backoff** (1s, 2s, 4s, 8s, 16s)

Cơ chế này đảm bảo: **Reliability** (retry), **Scalability** (distributed workers), **Security** (HMAC signature)."

⏱️ **Thời gian**: ~90 giây

---

## Slide 19: Webhook Components & Security

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

1. **HTTPS only**: Chỉ chấp nhận URL với `https://` protocol, không cho phép `http` hay `file`

2. **DNS Validation**: Resolve hostname **trước** khi gửi request

3. **Block Private IPs**: Reject các dải IP private:
   - `127.0.0.0/8` (localhost)
   - `10.0.0.0/8`, `192.168.0.0/16` (private network)
   
   Điều này ngăn attacker dùng webhook để scan internal network

4. **HMAC Signature**: Header `X-Hub-Signature-256`. Customer có thể verify request thực sự đến từ hệ thống của chúng tôi

Webhook system vừa **flexible** cho integration vừa **secure** chống lại attacks."

⏱️ **Thời gian**: ~60 giây

---

## Slide 20: Audit Logs (Section)

**Layout**: LayoutSection

**Nội dung slide**:
- Title: "Audit Logs"
- Subtitle: "Security Compliance & Investigation"

**Script:**

"Phần cuối cùng: **Audit Logs** - đảm bảo security compliance và hỗ trợ investigation."

⏱️ **Thời gian**: ~10 giây

---

## Slide 21: Audit System

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

**Cơ chế**: **Decorator-based Interceptor**. Developers chỉ cần thêm decorator, hệ thống tự động log:

```typescript
@Auditable({ 
  action: AuditAction.UPDATE, 
  entity: 'Conversation' 
})
@Patch(':id/assign')
async assign(@Body() dto) { ... }
```

Mỗi khi endpoint `assign` được gọi, hệ thống tự động tạo audit log.

**Pattern**: **Fail-Open** - nếu audit fails, operation vẫn tiếp tục. Chúng tôi không để audit crash business logic.

**Storage**: PostgreSQL với **JSONB** columns - query hiệu quả và có thể lưu custom fields.

**Sensitive Data Redaction**:

SENSITIVE_KEYS: `password`, `token`, `secret`, `authorization`, `apikey`, `creditcard`, `cvv`, `ssn`

Hệ thống tự động scan và redact khi log:

```json
{
  \"email\": \"user@example.com\",
  \"password\": \"[REDACTED]\",
  \"token\": \"[REDACTED]\"
}
```

Hai điểm quan trọng:
1. **Case-insensitive**: `Password`, `PASSWORD`, `password` đều được redact
2. **Recursive**: Scan deep vào nested objects và arrays

Thiết kế này giúp comply với **GDPR** và **PCI-DSS**."

⏱️ **Thời gian**: ~75 giây

---

## Slide 22: Summary (Section)

**Layout**: LayoutSection

**Nội dung slide**:
- Title: "Summary"
- Subtitle: "Tổng kết phần System Architecture"

**Script:**

"Bây giờ chúng ta sẽ **tổng kết** phần System Architecture."

⏱️ **Thời gian**: ~10 giây

---

## Slide 23: Architecture Recap

**Layout**: LayoutTitleContent

**Nội dung slide**: Table với 6 chủ đề chính và điểm chính của mỗi chủ đề

**Script:**

"**6 chủ đề chính** đã được trình bày:

1. **Kiến trúc**: Event-Driven Microservices với NestJS framework

2. **Multi-tenancy**: Project-based isolation với RBAC để đảm bảo data separation

3. **Real-time**: Socket.IO Rooms kết hợp EventEmitter2 cho low-latency messaging

4. **Message Flow**: Optimistic UI cho UX tốt, Outbox Pattern cho reliability

5. **External Integration**: Webhooks với 4-layer SSRF Protection

6. **Compliance**: Audit Logs với Fail-Open pattern và Sensitive Data Redaction

Tất cả quyết định kiến trúc đều hướng đến mục tiêu: hệ thống **scalable**, **secure**, và **maintainable**."

⏱️ **Thời gian**: ~45 giây

---

## Slide 24: Handoff to Next Presenter

**Layout**: LayoutTwoCol

**Nội dung slide**:
- **Cột trái - Covered Topics**:
  - System Architecture Overview
  - Multi-tenancy & Project Isolation
  - Message Flow Patterns
  - Event-Driven Core
  - Webhooks & Security
  - Audit Logs
- **Cột phải - Next: Member 2**:
  - JWT Authentication
  - OAuth Integration
  - Two-Factor Authentication (2FA)
  - Session Management

**Script:**

"Vậy là tôi đã hoàn thành phần **System Architecture**.

**Đã covered**:
- System Architecture Overview
- Multi-tenancy & Project Isolation
- Message Flow Patterns
- Event-Driven Core
- Webhooks & Security
- Audit Logs

**Phần tiếp theo**: Member 2 - Core Developer Authentication sẽ trình bày về:
- JWT Authentication mechanism
- OAuth Integration
- Two-Factor Authentication (2FA)
- Session Management

Cảm ơn các thầy cô và các bạn đã lắng nghe. Tôi xin chuyển microphone cho Member 2."

⏱️ **Thời gian**: ~30 giây

---

# Presentation Tips

## Kỹ năng trình bày

### Tốc độ nói
- **120-150 từ/phút** là tốc độ lý tưởng
- **Dừng ngắn** (1-2 giây) sau mỗi ý quan trọng
- **Nhấn mạnh** các keywords quan trọng

### Ngôn ngữ cơ thể
- **Eye contact**: Nhìn audience, không chỉ đọc slides
- **Gestures**: Dùng tay chỉ vào diagrams và code examples
- **Posture**: Đứng thẳng, tự tin

### Thuật ngữ kỹ thuật
- Đọc **rõ ràng** các thuật ngữ tiếng Anh
- **Giải thích** concepts phức tạp bằng ví dụ thực tế
- **Không đọc nguyên văn** code - summarize ý nghĩa

## Thời gian

| Section | Số slides | Thời gian dự kiến |
|---------|-----------|-------------------|
| Overview & Architecture | 4 slides | ~4 phút |
| Message Flows | 4 slides | ~5 phút |
| Tech Stack | 3 slides | ~2.5 phút |
| Event-Driven Core | 3 slides | ~2.5 phút |
| Webhooks | 3 slides | ~3.5 phút |
| Audit Logs | 2 slides | ~1.5 phút |
| Summary & Handoff | 3 slides | ~1.5 phút |
| **TỔNG** | **22 slides** | **~20 phút** |

> Dành 2-3 phút cho Q&A

## Xử lý câu hỏi

- **Không biết**: "Câu hỏi rất hay, tôi sẽ research thêm và trả lời sau"
- **Technical details**: Redirect sang members khác nếu cần
- **Concise answers**: Trả lời ngắn gọn, đúng trọng tâm

## Checklist trước trình bày

- [ ] Đọc script ít nhất **2 lần**
- [ ] Practice với timer
- [ ] Test slides transitions trên máy trình chiếu
- [ ] Backup slides (USB, cloud)
- [ ] Uống nước trước khi nói
- [ ] Kiểm tra mic and audio
- [ ] Laptop đầy pin hoặc cắm sạc

---

**Good luck! 🎤**
