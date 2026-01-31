# 🎬 SCRIPT TRÌNH BÀY CHI TIẾT - MEMBER 4

## 📋 Thông tin tổng quan
- **File slides:** `presentation/pages/hiep.md`
- **Vai trò:** Member 4 - The Product Owner  
- **Chủ đề:** Product Features & Workflow
- **Thời gian:** ~20-25 phút
- **Câu hỏi chính cần trả lời:** "Agents sử dụng hệ thống này như thế nào?"

---

## 🎯 MỤC TIÊU CỦA PHẦN TRÌNH BÀY

Trước khi bắt đầu, bạn cần hiểu rõ **vai trò Product Owner**:
- Bạn KHÔNG nói về code chi tiết (đó là việc của Developer)
- Bạn KHÔNG nói về database schema (đó là việc của DBA)
- Bạn TẬP TRUNG vào **giá trị sản phẩm** và **trải nghiệm người dùng**

**Người dùng của bạn là ai?** → **Agents** (nhân viên hỗ trợ khách hàng)

**Họ cần gì?**
1. Quản lý nhiều cuộc hội thoại cùng lúc
2. Phân công công việc trong team
3. Trả lời nhanh các câu hỏi thường gặp
4. Thu thập thông tin khách hàng
5. Ghi chú về khách hàng để đồng nghiệp biết

---
---

# 📍 PHẦN 1: GIỚI THIỆU (2-3 phút)

---

## 🎭 SLIDE 1.1: Tiêu đề phần

### 📺 TRÊN SLIDE HIỂN THỊ:

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│              PRODUCT FEATURES & WORKFLOW                     │
│                                                              │
│              Member 4: Product Owner                         │
│                                                              │
│   Agent Workspace, Productivity Tools, Team Collaboration   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 🎤 SCRIPT (Nói từng câu):

**Câu 1 - Chào hỏi:**
> "Xin chào mọi người! Tôi là [TÊN BẠN], đảm nhiệm vai trò Product Owner trong nhóm."

**Câu 2 - Giải thích Product Owner là gì:**
> "Product Owner là người chịu trách nhiệm về **giá trị sản phẩm**. Trong khi các bạn khác tập trung vào **cách xây dựng** hệ thống, tôi sẽ tập trung vào **cách người dùng sử dụng** hệ thống."

**Câu 3 - Kết nối với phần trước:**
> "Các thành viên trước đã giải thích về kiến trúc backend và cơ sở dữ liệu. Bây giờ tôi sẽ trả lời câu hỏi: **Agents - những nhân viên hỗ trợ khách hàng - sử dụng hệ thống này như thế nào?**"

**Câu 4 - Preview nội dung:**
> "Tôi sẽ trình bày 5 tính năng chính, chia thành 3 nhóm:
> - **Agent Workspace**: Không gian làm việc - nơi agents quản lý conversations
> - **Productivity Tools**: Công cụ tăng năng suất - giúp agents làm việc nhanh hơn
> - **Team Collaboration**: Phối hợp nhóm - giúp team làm việc hiệu quả"

### 💡 GIẢI THÍCH KỸ HƠN (để bạn hiểu, không cần nói):

**Tại sao cần Product Owner?**
- Trong Scrum/Agile, Product Owner là người đại diện cho khách hàng
- Họ quyết định tính năng nào quan trọng, tính năng nào cần làm trước
- Họ nhìn sản phẩm từ góc độ **business value**, không phải technical implementation

**Agents là ai?**
- Agents = Nhân viên Customer Support
- Họ ngồi trước máy tính cả ngày, chat với khách hàng
- Mỗi ngày có thể xử lý hàng chục, hàng trăm cuộc hội thoại
- Họ cần tools để làm việc NHANH và CHÍNH XÁC

---

## 📊 SLIDE 1.2: Feature Overview

### 📺 TRÊN SLIDE HIỂN THỊ:

```
┌──────────────────────────────────────────────────────────────┐
│                    FEATURE OVERVIEW                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Tính năng          │ Mô tả                │ Giá trị         │
│  ───────────────────┼──────────────────────┼────────────────│
│  Inbox Operations   │ Quản lý conversation │ Core workflow   │
│  Assignments        │ Phân công công việc  │ Team collab     │
│  Canned Responses   │ Quick replies        │ Tăng tốc độ     │
│  Actions/Forms      │ Custom forms         │ Thu thập data   │
│  Visitor Notes      │ Ghi chú khách hàng   │ CRM-lite        │
│                                                              │
│  💡 Tất cả scope theo projectId → Multi-tenant isolation     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 🎤 SCRIPT (Nói từng câu):

**Mở đầu:**
> "Đây là bảng tổng quan 5 tính năng. Mỗi tính năng giải quyết một **vấn đề cụ thể** của agents."

**Giải thích Inbox Operations:**
> "**Inbox Operations** là tính năng cốt lõi. Giống như Gmail có Inbox để quản lý emails, hệ thống này có Inbox để quản lý **conversations** - các cuộc hội thoại với khách hàng. Agent có thể filter, tìm kiếm, và theo dõi trạng thái từng cuộc."

**Giải thích Assignments:**
> "**Assignments** giải quyết vấn đề: Khi có 10 agents và 100 conversations, ai xử lý cái nào? Tính năng này cho phép **phân công rõ ràng** - conversation này thuộc về agent A, cái kia thuộc về agent B."

**Giải thích Canned Responses:**
> "**Canned Responses** là các **câu trả lời mẫu**. Thay vì gõ 'Xin chào, tôi có thể giúp gì?' 100 lần/ngày, agent chỉ cần gõ `/hello` và nội dung tự động xuất hiện. Tiết kiệm rất nhiều thời gian."

**Giải thích Actions/Smart Forms:**
> "**Actions/Smart Forms** cho phép tạo **form động**. Ví dụ: Khách muốn đặt hàng, agent mở form 'Đặt hàng' với các trường: tên, SĐT, địa chỉ. Dữ liệu được lưu có cấu trúc, dễ xử lý sau này."

**Giải thích Visitor Notes:**
> "**Visitor Notes** là tính năng **CRM đơn giản**. Agent có thể ghi chú: 'Khách VIP, cần chăm sóc kỹ' hoặc 'Đã mua sản phẩm X tháng trước'. Lần sau khách quay lại, bất kỳ agent nào cũng thấy được notes này."

**Điểm quan trọng:**
> "Một điểm **cực kỳ quan trọng**: Tất cả tính năng đều được **scope theo projectId**. Nghĩa là gì? Hệ thống này phục vụ **nhiều công ty khác nhau** - công ty A và công ty B đều dùng cùng hệ thống, nhưng dữ liệu hoàn toàn **tách biệt**. Đây gọi là **multi-tenant architecture**."

### 💡 GIẢI THÍCH KỸ HƠN:

**Multi-tenant là gì?**
- **Single-tenant**: Mỗi khách hàng có server riêng (đắt đỏ)
- **Multi-tenant**: Nhiều khách hàng dùng chung server, nhưng dữ liệu tách biệt
- LiveChat dùng multi-tenant: projectId phân biệt các khách hàng

**Tại sao cần projectId scope?**
- Agent của công ty A KHÔNG THỂ thấy conversations của công ty B
- Đây là yêu cầu **bảo mật quan trọng**
- Nếu thiếu, sẽ là **data breach** nghiêm trọng

---
---

# 📍 PHẦN 2: INBOX OPERATIONS (5-6 phút)

---

## 📁 SLIDE 2.1: Section Header

### 🎤 SCRIPT:

> "Bây giờ chúng ta đi vào phần **quan trọng nhất** - Inbox Operations."

> "Hãy tưởng tượng bạn là một agent. Mỗi sáng bạn đến công ty, mở laptop, và thấy hàng chục tin nhắn từ khách hàng. Bạn cần biết: Ai nhắn gì? Cần xử lý cái nào trước? Cái nào đã xong?"

> "Inbox Operations chính là **trung tâm điều khiển** - nơi agents quản lý tất cả công việc hàng ngày."

---

## 🔀 SLIDE 2.2: Inbox Architecture

### 📺 TRÊN SLIDE HIỂN THỊ:

```
┌──────────────────────────────────────────────────────────────┐
│                    INBOX ARCHITECTURE                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [Agent Dashboard] ──GET/PATCH──▶ [Backend Services]         │
│                                   ├── InboxController        │
│                                   └── ConversationService    │
│                                          │                   │
│                    ┌─────────────────────┼─────────────┐     │
│                    ▼                     ▼             ▼     │
│              [PostgreSQL]          [Redis]      [WebSocket]  │
│               Main DB               Cache        Real-time   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 🎤 SCRIPT:

**Mô tả flow:**
> "Khi agent mở Dashboard, chuyện gì xảy ra? Request đi từ browser đến backend."

**Giải thích Backend:**
> "Backend có 2 phần chính:
> - **InboxController**: Như một 'nhân viên lễ tân', nhận request, kiểm tra xem request có hợp lệ không
> - **ConversationService**: Như một 'nhân viên xử lý', thực hiện công việc thật sự"

**Giải thích 3 storage:**
> "Service làm việc với 3 nơi lưu trữ khác nhau, mỗi nơi có mục đích riêng:"

> "**PostgreSQL** - Database chính, lưu trữ **lâu dài**. Tất cả conversations, messages, thông tin agent đều ở đây."

> "**Redis** - Cache và **session data**. Redis rất nhanh, dùng để lưu những thứ cần truy cập liên tục. Ví dụ: visitor đang xem trang nào trên website."

> "**WebSocket Gateway** - Kênh **real-time**. Khi có tin nhắn mới, không cần agent refresh page - tin nhắn tự động hiện lên nhờ WebSocket."

### 💡 GIẢI THÍCH KỸ HƠN:

**Tại sao cần Redis khi đã có PostgreSQL?**
- PostgreSQL: Lưu trữ bền vững, nhưng chậm hơn khi đọc ghi liên tục
- Redis: Lưu trong RAM, cực nhanh, nhưng dữ liệu có thể mất khi restart
- Kết hợp cả hai: PostgreSQL lưu data quan trọng, Redis cache data thường xuyên truy cập

**WebSocket là gì?**
- HTTP thông thường: Client hỏi, Server trả lời (pull)
- WebSocket: Server có thể **chủ động** gửi data đến client (push)
- Dùng cho: Chat real-time, notifications, typing indicator

---

## 📋 SLIDE 2.3: Inbox Endpoints & Authorization

### 🎤 SCRIPT:

**Tổng quan:**
> "Inbox cung cấp 5 API endpoints. Mỗi endpoint phục vụ một mục đích cụ thể."

**GET conversations:**
> "**GET /inbox/conversations** - Lấy danh sách conversations. Agent có thể **filter theo status**: chỉ xem những cái đang mở, hoặc chỉ xem những cái đã giải quyết. Có **pagination** để không load hết một lúc."

**PATCH conversation:**
> "**PATCH /inbox/conversations/:id** - Update conversation. Thường dùng để **đổi status** từ OPEN sang RESOLVED, hoặc **đánh dấu đã đọc**."

**GET messages:**
> "**GET /inbox/conversations/:id/messages** - Lấy tin nhắn trong một conversation. Dùng **cursor-based pagination** - nghĩa là load 20 tin đầu, scroll xuống thì load thêm 20 tin tiếp."

**POST typing:**
> "**POST /inbox/conversations/:id/typing** - Gửi sự kiện agent đang gõ. Visitor sẽ thấy 'Agent is typing...' - biết agent đang làm việc."

**DELETE conversation:**
> "**DELETE /inbox/conversations/:id** - Xóa conversation. **Chỉ MANAGER** có quyền này, agent thường không được xóa."

**Giải thích Authorization:**
> "Về phân quyền, có 2 roles:
> - **AGENT**: Quyền cơ bản - xem, update, typing
> - **MANAGER**: Toàn quyền - có thêm quyền xóa
>
> Và một rule quan trọng: Bất kể role gì, bạn **phải là member của project** mới thao tác được. Không thể nhảy vào project người khác."

### 💡 GIẢI THÍCH KỸ HƠN:

**Cursor-based vs Offset-based pagination:**
- Offset-based: "Cho tôi records từ 21 đến 40" - có vấn đề khi data thay đổi
- Cursor-based: "Cho tôi 20 records sau record có ID là abc123" - ổn định hơn
- Chat apps thường dùng cursor-based vì messages liên tục được thêm mới

**Tại sao MANAGER mới được xóa?**
- Xóa conversation = mất toàn bộ lịch sử chat với khách
- Có thể cần cho audit, legal, hoặc training
- Tránh agent vô tình xóa data quan trọng

---

## 📊 SLIDE 2.5: Status Management

### 🎤 SCRIPT:

**Giải thích 3 status:**
> "Mỗi conversation có một **trạng thái**. Có 3 trạng thái chính:"

> "**OPEN** - Đang hoạt động. Khách đang chat, cần agent trả lời. Đây là trạng thái **cần attention** nhất."

> "**PENDING** - Chờ xử lý. Có thể agent đã hỏi khách một câu và đang chờ trả lời, hoặc đang chờ team internal xác nhận gì đó."

> "**RESOLVED** - Đã giải quyết. Cuộc hội thoại kết thúc, vấn đề đã được xử lý xong."

**Real-time update:**
> "Điểm quan trọng: Khi agent A đổi status, tất cả agents khác trong project **thấy ngay lập tức** - không cần refresh. Đây là nhờ **WebSocket broadcast**."

**Audit logging:**
> "Và mọi thay đổi đều được **ghi log** bởi @Auditable decorator: Ai thay đổi, thay đổi gì, lúc nào. Quan trọng cho việc review và troubleshooting."

---

## ⌨️ SLIDE 2.6: Agent Typing Indicator

### 🎤 SCRIPT:

**Giới thiệu:**
> "Đây là một tính năng **nhỏ nhưng quan trọng** về mặt UX - User Experience."

**Vấn đề giải quyết:**
> "Hãy tưởng tượng bạn là khách hàng, gửi tin nhắn xong và chờ. 10 giây... 20 giây... Không có gì xảy ra. Bạn nghĩ: 'Có ai đọc tin không? Hay mình bị bỏ quên?' Có thể bạn sẽ đóng chat và đi."

**Giải pháp:**
> "Typing indicator giải quyết vấn đề này. Khi agent bắt đầu gõ, visitor thấy **'Agent is typing...'**. Họ biết có người đang làm việc, sẽ kiên nhẫn chờ."

**Flow kỹ thuật:**
> "Flow hoạt động như sau:
> 1. Agent gõ trong chatbox → Frontend gửi POST /typing
> 2. Backend tìm **socketId** của visitor trong Redis (mỗi visitor online có một socketId)
> 3. Nếu tìm thấy (visitor đang online) → Gửi event qua WebSocket đến widget của visitor
> 4. Widget hiển thị 'Agent is typing...'"

**Giá trị:**
> "Theo nghiên cứu UX, tính năng này **giảm 20-30% tỷ lệ visitor bỏ cuộc** trong khi chờ phản hồi."

---
---

# 📍 PHẦN 3: CONVERSATION ASSIGNMENTS (3-4 phút)

---

## 👥 SLIDE 3.1: Section Header

### 🎤 SCRIPT:

> "Phần tiếp theo là **Conversation Assignments** - Phân công công việc."

> "Trong team support, vấn đề lớn nhất là: **Ai đang làm gì?**"

> "Nếu không có assignment rõ ràng, sẽ xảy ra 2 vấn đề:
> 1. **Duplicate effort**: Hai agent cùng trả lời một khách - khách nhận 2 tin nhắn khác nhau, rất lộn xộn
> 2. **Dropped cases**: Không ai trả lời vì ai cũng nghĩ người khác đã làm"

> "Assignment feature giải quyết cả hai vấn đề này."

---

## 🔀 SLIDE 3.2: Assignment Flow

### 🎤 SCRIPT:

**Flow tổng quan:**
> "Khi agent A muốn assign conversation cho agent B, request đi qua nhiều bước kiểm tra."

**Validation double-check:**
> "Điểm đặc biệt: Hệ thống kiểm tra **CẢ HAI người**:
> - **Actor** (người đang assign) - có phải project member không?
> - **Assignee** (người được assign) - có phải project member không?
>
> Tại sao? Để tránh assign conversation cho người không thuộc project - đó sẽ là **data breach**."

**Transaction:**
> "Việc update được thực hiện trong **database transaction**. Nghĩa là: Hoặc thành công hoàn toàn, hoặc không có gì thay đổi. Không có trường hợp 'nửa vời'."

**Real-time broadcast:**
> "Sau khi assign xong, event được broadcast qua WebSocket. Tất cả agents thấy thay đổi ngay - **conversation này giờ thuộc về agent B**."

---
---

# 📍 PHẦN 4: CANNED RESPONSES (2-3 phút)

---

## 📝 SLIDE 4.2: Canned Responses Overview

### 🎤 SCRIPT:

**Vấn đề:**
> "Hãy tưởng tượng bạn là agent, mỗi ngày trả lời 100 cuộc chat. Có 50 câu hỏi giống nhau: 'Giờ mở cửa?', 'Chính sách đổi trả?', 'Ship bao lâu?'. Bạn gõ đi gõ lại những câu trả lời giống nhau - rất mất thời gian."

**Giải pháp:**
> "Canned Responses cho phép tạo **templates với shortcuts**. Thay vì gõ cả đoạn văn, agent chỉ cần gõ `/hours` và nội dung 'Chúng tôi mở cửa từ 8h-22h...' tự động xuất hiện."

**Cách hoạt động:**
> "Agent gõ slash `/` trong chat input, autocomplete hiện ra các options. Chọn một cái, nội dung được chèn vào message. Gửi đi."

**Phân quyền:**
> "Về quyền:
> - **MANAGER**: Tạo, sửa, xóa templates - đảm bảo nội dung chuẩn
> - **AGENT**: Chỉ sử dụng - không được tự ý sửa templates
>
> Logic này đảm bảo **consistency** - tất cả agents trả lời giống nhau, đúng theo quy chuẩn công ty."

**Constraints:**
> "Có vài ràng buộc:
> - Shortcut tối đa 50 ký tự, chỉ alphanumeric và dấu gạch
> - Content tối đa 5000 ký tự
> - **Unique shortcut trong project** - không thể có 2 cái `/hello` khác nhau"

---
---

# 📍 PHẦN 5: ACTIONS & SMART FORMS (4-5 phút)

---

## 📋 SLIDE 5.2: Actions Concept

### 🎤 SCRIPT:

**Use case:**
> "Đây là tính năng **advanced nhất**. Use case: Trong quá trình chat, agent cần thu thập thông tin có cấu trúc từ khách."

**Ví dụ cụ thể:**
> "Ví dụ: Khách muốn đặt hàng. Agent cần biết:
> - Tên khách hàng
> - Số điện thoại
> - Địa chỉ giao hàng
> - Sản phẩm muốn mua
>
> Thay vì hỏi từng câu qua chat (dễ sót, khó quản lý), agent mở một **form động** với các trường đã định sẵn."

**Action Template là gì:**
> "**Action Template** = Form được định nghĩa trước bởi Manager. Có các fields với kiểu dữ liệu cụ thể:
> - **TEXT**: Input text thường
> - **NUMBER**: Chỉ nhập số
> - **BOOLEAN**: Toggle có/không (ví dụ: Giao hàng nhanh?)
> - **DATE**: Chọn ngày
> - **SELECT**: Dropdown chọn từ danh sách"

**Phân quyền:**
> "Manager tạo và quản lý templates. Agent chỉ điền form và submit. Submissions được **link đến conversation** - dễ track và audit."

**Validation:**
> "Có **strict validation** theo từng field type. Nếu field là NUMBER nhưng agent nhập chữ → lỗi. Nếu field required mà để trống → lỗi."

---
---

# 📍 PHẦN 6: VISITOR NOTES (2-3 phút)

---

## 📋 SLIDE 6.2: Visitor Notes Overview

### 🎤 SCRIPT:

**Use case:**
> "**Visitor Notes** là tính năng CRM đơn giản. Agent có thể ghi chú về khách hàng."

**Ví dụ:**
> "Ví dụ: 'Khách VIP, CEO công ty ABC', 'Đã mua laptop tháng trước, hỏi về warranty', 'Thích được gọi bằng tên, tránh formal quá'."

**Giá trị:**
> "Notes được lưu theo **visitor**, không phải conversation. Nghĩa là: Lần sau khách quay lại, **bất kỳ agent nào** cũng thấy được notes này. Họ biết context ngay, không cần hỏi lại từ đầu."

**Real-time sync:**
> "Có 3 events real-time:
> - Note được tạo → broadcast
> - Note được sửa → broadcast
> - Note bị xóa → broadcast
>
> Tất cả agents thấy thay đổi ngay lập tức."

---
---

# 📍 PHẦN 7: TỔNG KẾT (2-3 phút)

---

## 🔄 SLIDE 7.2: Handoff Summary

### 🎤 SCRIPT:

**Tóm tắt:**
> "Tóm lại, tôi đã trình bày 5 tính năng:
> - **Inbox Operations**: Trung tâm quản lý conversations
> - **Assignments**: Phân công rõ ràng trong team
> - **Canned Responses**: Trả lời nhanh với templates
> - **Actions/Smart Forms**: Thu thập dữ liệu có cấu trúc
> - **Visitor Notes**: Chia sẻ context về khách hàng"

**Value proposition:**
> "Một câu tóm gọn: **Productivity tools và collaboration features giúp agents làm việc hiệu quả hơn, từ đó deliver trải nghiệm tốt hơn cho khách hàng.**"

**Kết thúc:**
> "Đó là tất cả phần trình bày của tôi. Cảm ơn mọi người đã lắng nghe! Có câu hỏi nào không ạ?"

---
---

# ❓ CÂU HỎI THƯỜNG GẶP VÀ CÁCH TRẢ LỜI

## 📚 NHÓM 1: CÂU HỎI VỀ KIẾN TRÚC & KỸ THUẬT

### Q1: "Tại sao dùng cả PostgreSQL lẫn Redis? Không dư thừa sao?"

**Trả lời:**
> "Không dư thừa ạ, vì mỗi cái có vai trò khác nhau:
> - **PostgreSQL**: Lưu trữ **bền vững** (persistent) - data không mất khi restart server
> - **Redis**: Lưu trong **RAM**, cực nhanh, nhưng data có thể mất
>
> Chúng em kết hợp: PostgreSQL lưu conversations, messages - data quan trọng. Redis cache data thường xuyên truy cập như currentUrl của visitor.
>
> Ví dụ: Mỗi giây có thể có 1000 request hỏi 'visitor này đang ở trang nào?'. Nếu query PostgreSQL 1000 lần/giây sẽ rất chậm. Redis đáp ứng được vì nó ở trong RAM."

---

### Q2: "WebSocket là gì? Tại sao không dùng HTTP thường?"

**Trả lời:**
> "HTTP thường hoạt động theo kiểu **request-response**: Client hỏi, server trả lời. Client không hỏi thì server không thể gửi gì.
>
> **WebSocket** là kết nối 2 chiều, luôn mở. Server có thể **chủ động push** data đến client bất cứ lúc nào.
>
> Trong chat app, điều này cực kỳ quan trọng:
> - Khi có tin nhắn mới → Server push ngay đến agent
> - Khi status thay đổi → Tất cả agents thấy ngay
> - Không cần agent liên tục refresh để kiểm tra
>
> Nếu dùng HTTP polling (liên tục hỏi 'có gì mới không?'), sẽ rất tốn bandwidth và chậm."

---

### Q3: "Multi-tenant là gì? Tại sao cần projectId?"

**Trả lời:**
> "**Multi-tenant** nghĩa là nhiều khách hàng (công ty) dùng chung một hệ thống, nhưng dữ liệu hoàn toàn tách biệt.
>
> **projectId** là ID của mỗi project/tenant. Mọi query đều có điều kiện `WHERE projectId = X`.
>
> Ví dụ: Công ty A (projectId=1) và công ty B (projectId=2) đều dùng LiveChat:
> - Agent của A chỉ thấy conversations có projectId=1
> - Agent của B chỉ thấy conversations có projectId=2
>
> Nếu thiếu projectId scope → Agent A có thể thấy data của B → **Data breach nghiêm trọng**."

---

### Q4: "Cursor-based pagination khác offset-based như nào?"

**Trả lời:**
> "**Offset-based**: 'Cho tôi records từ vị trí 21 đến 40'
> - Vấn đề: Nếu trong lúc đó có record mới được thêm vào đầu → vị trí bị lệch, có thể thấy duplicate hoặc miss record
>
> **Cursor-based**: 'Cho tôi 20 records sau record có ID là abc123'
> - Ổn định hơn: Dù có record mới, vẫn lấy đúng từ vị trí đã đánh dấu
>
> Chat apps dùng cursor-based vì messages liên tục được thêm mới. Offset-based sẽ gây lỗi hiển thị."

---

## 🔐 NHÓM 2: CÂU HỎI VỀ BẢO MẬT & PHÂN QUYỀN

### Q5: "Làm sao đảm bảo agent không thấy data của project khác?"

**Trả lời:**
> "Có nhiều lớp bảo vệ:
> 1. **JwtAuthGuard**: Verify token hợp lệ, extract user info bao gồm projectId
> 2. **RolesGuard**: Check role (AGENT, MANAGER)
> 3. **Query scope**: Tất cả query đều có `WHERE projectId = ?`, projectId lấy từ JWT token, không phải từ request body (agent không thể fake)
>
> Ngay cả khi hacker cố gắng gửi projectId khác trong request, hệ thống vẫn dùng projectId từ token - được ký bởi server, không thể giả mạo."

---

### Q6: "Tại sao chỉ MANAGER được xóa conversation?"

**Trả lời:**
> "Xóa conversation = mất toàn bộ lịch sử chat.
>
> Dữ liệu này có thể cần cho:
> - **Audit**: Review chất lượng support
> - **Legal**: Nếu có tranh chấp với khách hàng
> - **Training**: Đào tạo agent mới
>
> Nếu agent được xóa:
> - Có thể vô tình xóa nhầm
> - Có thể cố tình xóa để che đậy sai sót
>
> MANAGER (supervisor) có trách nhiệm cao hơn, được quyền xóa."

---

### Q7: "Assignment check cả actor và assignee là sao?"

**Trả lời:**
> "Khi agent A assign conversation cho agent B, hệ thống check:
> - A có phải member của project này không? → **Actor validation**
> - B có phải member của project này không? → **Assignee validation**
>
> Tại sao cần cả hai?
> - Nếu chỉ check A: A có thể assign cho người ngoài project → data leak
> - Nếu chỉ check B: Người ngoài có thể tự assign vào project → unauthorized access
>
> **Double validation** đảm bảo chỉ những người được phép mới thao tác được."

---

## ⚡ NHÓM 3: CÂU HỎI VỀ TÍNH NĂNG

### Q8: "Canned Response có giới hạn số lượng không?"

**Trả lời:**
> "Về mặt database, không có hard limit.
>
> Tuy nhiên, về mặt UX, chúng em recommend giữ dưới 100 templates mỗi project vì:
> - Quá nhiều → Khó tìm
> - Autocomplete sẽ hiển thị quá nhiều options
>
> Thực tế, đa số projects chỉ cần 20-50 templates là đủ cover các use cases phổ biến."

---

### Q9: "Nếu visitor offline thì typing indicator có gửi không?"

**Trả lời:**
> "Không ạ.
>
> Flow là:
> 1. Agent gõ → Backend tìm socketId của visitor trong Redis
> 2. Nếu visitor online → Có socketId → Gửi event
> 3. Nếu visitor offline → Không có socketId → Không gửi
>
> Đây là optimization: Không tốn resource gửi event đến người không thể nhận."

---

### Q10: "Actions data có thể export không?"

**Trả lời:**
> "Hiện tại có API để query submissions:
> - GET /projects/:id/action-submissions
> - Filter theo template, date range, status
>
> Về export, có thể extend thêm:
> - Export CSV/Excel cho Manager
> - Webhook để push data sang CRM/ERP khác
>
> Đây là roadmap tính năng chứ chưa implement trong scope hiện tại."

---

### Q11: "Visitor Notes có private không? Agent khác có thấy không?"

**Trả lời:**
> "Trong design hiện tại, notes là **shared** - tất cả agents trong project đều thấy.
>
> Lý do: Mục đích chính là **team collaboration** - chia sẻ context về khách hàng.
>
> Nếu cần private notes, có thể extend:
> - Thêm field `isPrivate: boolean`
> - Hoặc tạo thêm entity `AgentPersonalNotes`
>
> Nhưng trong scope hiện tại, focus vào shared notes cho team."

---

## 🎯 NHÓM 4: CÂU HỎI SO SÁNH & ĐÁNH GIÁ

### Q12: "So với các hệ thống chat khác như Zendesk, Intercom, khác gì?"

**Trả lời:**
> "Zendesk, Intercom là các sản phẩm commercial hoàn chỉnh với hàng trăm tính năng.
>
> Hệ thống của chúng em focus vào **core features cần thiết nhất**:
> - Inbox management
> - Assignment
> - Canned responses
> - Custom forms
> - Notes
>
> Đây là project học tập, demonstrate khả năng thiết kế và implement một hệ thống phức tạp từ đầu.
>
> Về mặt technical, chúng em đã implement đúng các best practices: multi-tenant, real-time, role-based access, audit logging."

---

### Q13: "Nếu có 10,000 conversations thì performance ra sao?"

**Trả lời:**
> "Đã có các optimization:
> 1. **Pagination**: Không load hết, chỉ load 20-50 records/lần
> 2. **Database indexing**: Index trên projectId, status, createdAt
> 3. **Redis cache**: Hot data được cache
> 4. **Query chỉ lấy fields cần thiết**: Không SELECT *
>
> Với 10,000 conversations:
> - GET list với filter + pagination: < 100ms
> - GET messages của 1 conversation: < 50ms
>
> Nếu scale lên millions, cần thêm: Database sharding, Elasticsearch for search, CDN for static assets."

---

### Q14: "@Auditable decorator làm gì?"

**Trả lời:**
> "**@Auditable** là decorator gắn vào các methods quan trọng. Khi method được gọi, nó tự động ghi log:
> - **Who**: User ID của người thực hiện
> - **What**: Action gì (create, update, delete)
> - **When**: Timestamp
> - **What changed**: Giá trị trước và sau
>
> Ví dụ: Agent đổi status từ OPEN sang RESOLVED → Log: 'User abc123 changed status from OPEN to RESOLVED at 2024-01-29 10:30:00'
>
> Dùng cho: Compliance, troubleshooting, performance review."

---

## 💡 NHÓM 5: CÂU HỎI MỞ RỘNG

### Q15: "Nếu phát triển thêm, bạn sẽ làm gì?"

**Trả lời:**
> "Roadmap tiếp theo:
> 1. **AI Integration**: Chatbot tự động trả lời câu hỏi đơn giản, gợi ý canned response phù hợp
> 2. **Analytics Dashboard**: Thống kê response time, satisfaction score, workload distribution
> 3. **Mobile App**: Agent có thể support từ điện thoại
> 4. **Integrations**: Connect với CRM (Salesforce), Helpdesk (JIRA), Email
> 5. **Multi-language**: Support nhiều ngôn ngữ cho canned responses"

---

### Q16: "Khó khăn lớn nhất khi làm phần này?"

**Trả lời:**
> "Khó khăn lớn nhất là **real-time synchronization**.
>
> Khi nhiều agents cùng làm việc trên cùng conversations:
> - Agent A đổi status, agent B phải thấy ngay
> - Không được có race condition (2 người assign cùng lúc)
> - Phải handle reconnection khi mất mạng
>
> Giải pháp:
> - WebSocket cho real-time
> - Database transaction cho atomicity
> - Optimistic locking để prevent race condition"

---

# 📌 MẸO TRÌNH BÀY

## ✅ NÊN LÀM:
1. **Nói chậm, rõ ràng** - Đặc biệt với technical terms
2. **Giải thích thuật ngữ** - Không assume người nghe biết WebSocket, Redis...
3. **Dùng ví dụ thực tế** - "Giống như Gmail inbox..."
4. **Eye contact** - Nhìn người nghe, không chỉ nhìn slide
5. **Chuẩn bị sẵn câu trả lời** - Đọc kỹ phần Q&A ở trên

## ❌ TRÁNH:
1. Đọc nguyên văn từ slide
2. Nói quá nhanh khi lo lắng
3. Dùng thuật ngữ mà không giải thích
4. Trả lời "Em không biết" ngay - Thử phân tích trước

## ⏱️ Phân bổ thời gian:
| Phần | Thời gian |
|------|-----------|
| Giới thiệu (1.1-1.2) | 2-3 phút |
| Inbox Operations (2.1-2.6) | 5-6 phút |
| Assignments (3.1-3.3) | 3-4 phút |
| Canned Responses (4.1-4.2) | 2-3 phút |
| Actions/Smart Forms (5.1-5.2) | 4-5 phút |
| Visitor Notes (6.1-6.2) | 2-3 phút |
| Tổng kết (7.1-7.2) | 2-3 phút |
| **Q&A** | **5-10 phút** |

**Tổng: 25-35 phút**

