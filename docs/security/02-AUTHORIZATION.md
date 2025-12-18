# Cơ chế Phân quyền (Authorization)

## Tổng quan

Hệ thống sử dụng mô hình phân quyền đa cấp (Multi-tier Authorization) kết hợp:

- **Global Roles:** Phân quyền cấp hệ thống
- **Project Roles:** Phân quyền cấp dự án
- **Role Hierarchy:** Kế thừa quyền theo cấp bậc
- **Guard-based Protection:** Bảo vệ routes và resources

## 1. Global Roles

### 1.1. Định nghĩa

**File:** `packages/shared/src/global-roles.enum.ts`

```typescript
export enum GlobalRole {
  USER = "user",
  ADMIN = "admin",
}
```

### 1.2. Ý nghĩa

- **USER:** Người dùng thông thường
  - Tạo và quản lý projects của mình
  - Mời thành viên vào projects
  - Truy cập inbox conversations
- **ADMIN:** Quản trị viên hệ thống
  - Tất cả quyền của USER
  - Quản lý tất cả users
  - Quản lý tất cả projects
  - Access system-wide settings
  - Suspend/activate users

### 1.3. Assignment

**Mặc định:** Mọi user mới = `USER`

**File:** `packages/shared/src/user.entity.ts`

```typescript
@Column({
  type: 'enum',
  enum: GlobalRole,
  default: GlobalRole.USER,
})
role: GlobalRole;
```

**Promote to ADMIN:** Chỉ có thể thực hiện qua database hoặc admin panel (chưa implement UI)

## 2. Project Roles

### 2.1. Định nghĩa

**File:** `packages/shared/src/project-roles.enum.ts`

```typescript
export enum ProjectRole {
  AGENT = "agent",
  MANAGER = "manager",
}
```

### 2.2. Ý nghĩa

- **AGENT:** Nhân viên hỗ trợ

  - Xem danh sách conversations
  - Trả lời tin nhắn
  - Xem project settings (read-only)
  - Không thể invite members
  - Không thể modify settings

- **MANAGER:** Quản lý dự án
  - Tất cả quyền của AGENT
  - Quản lý project settings
  - Mời và xóa members
  - Thay đổi roles của members
  - Xóa project

### 2.3. ProjectMember Entity

**File:** `packages/shared/src/project-member.entity.ts`

```typescript
@Entity()
export class ProjectMember {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @Column()
  projectId: number;

  @Column({
    type: "enum",
    enum: ProjectRole,
    default: ProjectRole.AGENT,
  })
  role: ProjectRole;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Project)
  @JoinColumn({ name: "project_id" })
  project: Project;
}
```

**Quan hệ:**

- Many-to-Many giữa User và Project
- Qua bảng trung gian ProjectMember
- Mỗi member có role riêng trong từng project

## 3. Role Hierarchy

### 3.1. Global Role Hierarchy

**File:** `packages/backend/src/rbac/roles.guard.ts`

```typescript
const globalRoleHierarchy: Map<GlobalRole, GlobalRole[]> = new Map([
  [GlobalRole.ADMIN, [GlobalRole.USER]],
]);
```

**Ý nghĩa:**

- ADMIN kế thừa tất cả quyền của USER
- Khi check quyền, cả ADMIN và USER đều pass nếu yêu cầu `@Roles(GlobalRole.USER)`

### 3.2. Project Role Hierarchy

```typescript
const projectRoleHierarchy: Map<ProjectRole, ProjectRole[]> = new Map([
  [ProjectRole.MANAGER, [ProjectRole.AGENT]],
]);
```

**Ý nghĩa:**

- MANAGER kế thừa tất cả quyền của AGENT
- Khi check quyền `@Roles(ProjectRole.AGENT)`, cả MANAGER và AGENT đều pass

## 4. Guards & Decorators

### 4.1. JwtAuthGuard

**File:** `packages/backend/src/auth/guards/jwt-auth.guard.ts`

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }
}
```

**Chức năng:**

- Kiểm tra JWT token trong Authorization header
- Validate token và attach user vào request
- Bypass nếu route có decorator `@Public()`

**Sử dụng:**

```typescript
@UseGuards(JwtAuthGuard)
@Get('me')
async getMe(@Request() req) {
  return req.user; // User đã được attach bởi JwtStrategy
}
```

### 4.2. RolesGuard

**File:** `packages/backend/src/rbac/roles.guard.ts`

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<
      (GlobalRole | ProjectRole)[]
    >(ROLES_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredRoles) {
      return true; // No roles required
    }

    const { user }: { user: User } = context.switchToHttp().getRequest();

    // Check Global Roles
    const requiresGlobalRole = requiredRoles.some((role) =>
      Object.values(GlobalRole).includes(role as GlobalRole)
    );

    if (requiresGlobalRole) {
      const userRoles = new Set<GlobalRole>([user.role]);
      const inheritedRoles = globalRoleHierarchy.get(user.role);
      if (inheritedRoles) {
        inheritedRoles.forEach((role) => userRoles.add(role));
      }
      return requiredRoles.some((role) => userRoles.has(role as GlobalRole));
    }

    // For ProjectRole, return true (validate in service layer)
    return true;
  }
}
```

**Chức năng:**

- Kiểm tra Global Roles với hierarchy
- Project Roles được validate ở service layer (vì cần projectId)

**Sử dụng:**

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(GlobalRole.ADMIN)
@Get('all-users')
async getAllUsers() {
  // Only ADMIN can access
}
```

### 4.3. @Roles Decorator

**File:** `packages/backend/src/rbac/roles.decorator.ts`

```typescript
export const ROLES_KEY = "roles";
export const Roles = (...roles: (GlobalRole | ProjectRole)[]) =>
  SetMetadata(ROLES_KEY, roles);
```

**Sử dụng:**

```typescript
@Roles(GlobalRole.USER)              // Global role
@Roles(ProjectRole.MANAGER)          // Project role
@Roles(GlobalRole.ADMIN, ProjectRole.MANAGER) // Multiple roles (OR logic)
```

### 4.4. @Public Decorator

**File:** `packages/backend/src/common/decorators/public.decorator.ts`

```typescript
export const IS_PUBLIC_KEY = "isPublic";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

**Sử dụng:**

```typescript
@Public()
@Post('login')
async login() {
  // Không cần authentication
}
```

## 5. Project-Level Authorization

### 5.1. Validation trong Service Layer

Vì RolesGuard không thể validate ProjectRole (thiếu projectId trong context), ta phải validate ở service layer.

**File:** `packages/backend/src/projects/project.service.ts`

```typescript
async checkProjectRole(
  userId: string,
  projectId: number,
  requiredRoles: ProjectRole[]
): Promise<boolean> {
  const member = await this.projectMemberRepository.findOne({
    where: { userId, projectId },
  });

  if (!member) {
    throw new ForbiddenException('You are not a member of this project');
  }

  // Check role with hierarchy
  const memberRoles = new Set<ProjectRole>([member.role]);
  const inheritedRoles = projectRoleHierarchy.get(member.role);
  if (inheritedRoles) {
    inheritedRoles.forEach(role => memberRoles.add(role));
  }

  const hasRole = requiredRoles.some(role => memberRoles.has(role));
  if (!hasRole) {
    throw new ForbiddenException('You do not have permission');
  }

  return true;
}
```

### 5.2. Ví dụ sử dụng

**Controller:**

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ProjectRole.AGENT)  // Metadata only, actual check in service
@Get(':projectId/conversations')
async getConversations(
  @Param('projectId') projectId: number,
  @Request() req
) {
  return this.inboxService.getConversations(req.user.id, projectId);
}
```

**Service:**

```typescript
async getConversations(userId: string, projectId: number) {
  // Validate project role
  await this.projectService.checkProjectRole(
    userId,
    projectId,
    [ProjectRole.AGENT] // MANAGER cũng pass do hierarchy
  );

  // Proceed with business logic
  return await this.conversationRepository.find({ projectId });
}
```

### 5.3. Owner Check

**Project Owner = người tạo project**

```typescript
async isProjectOwner(userId: string, projectId: number): Promise<boolean> {
  const project = await this.projectRepository.findOne({
    where: { id: projectId }
  });
  return project?.createdBy === userId;
}
```

**Sử dụng cho các action nhạy cảm:**

- Xóa project (chỉ owner)
- Transfer ownership (chỉ owner)

## 6. Inbox/Conversation Authorization

### 6.1. Controller Protection

**File:** `packages/backend/src/inbox/inbox.controller.ts`

```typescript
@Controller("inbox")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ProjectRole.AGENT)
export class InboxController {
  // All endpoints require at least AGENT role
}
```

### 6.2. Conversation Access Control

**Service Layer:**

```typescript
async getConversation(userId: string, conversationId: number) {
  const conversation = await this.conversationRepository.findOne({
    where: { id: conversationId },
    relations: ['project']
  });

  if (!conversation) {
    throw new NotFoundException('Conversation not found');
  }

  // Check user has access to this project
  await this.projectService.checkProjectRole(
    userId,
    conversation.project.id,
    [ProjectRole.AGENT]
  );

  return conversation;
}
```

**Bảo mật:**

- User chỉ xem được conversations của projects họ tham gia
- Không thể access conversations của projects khác

## 7. Invitation System Authorization

### 7.1. Invite Members

**Endpoint:** `POST /projects/:id/invite`

**Authorization:**

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ProjectRole.MANAGER)  // Only MANAGER can invite
async inviteToProject(
  @Param('id') projectId: number,
  @Body() inviteDto: InviteToProjectDto,
  @Request() req
) {
  await this.projectService.checkProjectRole(
    req.user.id,
    projectId,
    [ProjectRole.MANAGER]
  );
  // Proceed...
}
```

**Validation:**

- Chỉ MANAGER mới có thể mời
- Không thể mời user đã là member
- Role được assign trong invitation

### 7.2. Accept Invitation

**Endpoint:** `POST /projects/invitations/:token/accept`

**Authorization:**

```typescript
@UseGuards(JwtAuthGuard)
async acceptInvitation(
  @Param('token') token: string,
  @Request() req
) {
  const invitation = await this.findInvitationByToken(token);

  // Check invitation is for this user
  if (invitation.email !== req.user.email) {
    throw new ForbiddenException('This invitation is not for you');
  }

  // Proceed...
}
```

**Bảo mật:**

- Token-based invitation
- Chỉ người được mời mới accept được
- Token one-time use
- Expiration time

### 7.3. Remove Member

**Endpoint:** `DELETE /projects/:id/members/:userId`

**Authorization:**

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ProjectRole.MANAGER)
async removeMember(
  @Param('id') projectId: number,
  @Param('userId') userIdToRemove: string,
  @Request() req
) {
  await this.projectService.checkProjectRole(
    req.user.id,
    projectId,
    [ProjectRole.MANAGER]
  );

  // Cannot remove yourself
  if (userIdToRemove === req.user.id) {
    throw new BadRequestException('Cannot remove yourself');
  }

  // Cannot remove owner
  const isOwner = await this.projectService.isProjectOwner(
    userIdToRemove,
    projectId
  );
  if (isOwner) {
    throw new ForbiddenException('Cannot remove project owner');
  }

  // Proceed...
}
```

## 8. WebSocket Authorization

### 8.1. WsJwtAuthGuard

**File:** `packages/backend/src/gateway/guards/ws-jwt-auth.guard.ts`

```typescript
@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient<Socket>();
    const authToken = client.handshake.auth?.token;

    if (!authToken) {
      this.logger.log("WebSocket connection from widget (no auth)");
      return true; // Allow widget connections
    }

    // Validate JWT for dashboard connections
    const payload = await this.jwtService.verifyAsync(authToken);
    const user = await this.userService.findOneById(payload.sub);

    if (!user) {
      throw new WsException("Unauthorized: User not found");
    }

    // Attach user to socket
    client.data.user = { id: user.id, email: user.email };
    return true;
  }
}
```

**Đặc điểm:**

- Cho phép 2 loại connections:
  1. **Authenticated (Dashboard):** Có JWT token
  2. **Unauthenticated (Widget):** Không có token
- Attach user info vào `client.data.user`

### 8.2. Event Handler Authorization

**File:** `packages/backend/src/gateway/events.gateway.ts`

```typescript
@SubscribeMessage('joinConversation')
async handleJoinConversation(
  @MessageBody() data: { conversationId: number },
  @ConnectedSocket() client: Socket
) {
  const user = client.data.user;

  if (!user) {
    throw new WsException('Unauthorized');
  }

  // Check user has access to this conversation
  const conversation = await this.conversationService.findOne(
    data.conversationId
  );

  await this.projectService.checkProjectRole(
    user.id,
    conversation.projectId,
    [ProjectRole.AGENT]
  );

  // Join room
  client.join(`conversation:${data.conversationId}`);
}
```

**Bảo mật:**

- Mỗi event handler validate quyền riêng
- Không thể join rooms của projects khác
- Widget connections có logic riêng (identify by projectId + visitorUid)

## 9. User Settings Authorization

### 9.1. Profile Management

**File:** `packages/backend/src/user/user.controller.ts`

```typescript
@Controller("user")
@UseGuards(JwtAuthGuard)
export class UserController {
  @Get("me")
  async getProfile(@Request() req) {
    const user = await this.userService.findOneById(req.user.id);
    const { passwordHash, ...result } = user;
    return result; // Never expose passwordHash
  }

  @Patch("me")
  async updateProfile(@Request() req, @Body() updateDto: UpdateUserDto) {
    // User can only update their own profile
    return this.userService.update(req.user.id, updateDto);
  }
}
```

**Bảo mật:**

- User chỉ có thể xem/sửa profile của chính mình
- PasswordHash bị loại bỏ khỏi response
- Validation trong DTO

### 9.2. Email Change

```typescript
@Post('request-email-change')
async requestEmailChange(
  @Request() req,
  @Body() dto: EmailChangeDto
) {
  // Verify current password
  return this.userService.requestEmailChange(
    req.user.id,
    dto.newEmail,
    dto.currentPassword
  );
}
```

**Authorization:**

- Yêu cầu current password
- Chỉ user đó mới có thể đổi email
- Verification qua cả 2 emails

### 9.3. Password Change

```typescript
@Post('change-password')
async changePassword(
  @Request() req,
  @Body() dto: ChangePasswordDto
) {
  return this.authService.changePassword(
    req.user.id,
    dto.currentPassword,
    dto.newPassword
  );
}
```

**Authorization:**

- Verify current password
- Revoke all sessions sau khi đổi
- User chỉ đổi được password của mình

## 10. Admin-Only Endpoints

### 10.1. User Management

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(GlobalRole.ADMIN)
@Get('admin/users')
async getAllUsers() {
  return this.userService.findAll();
}

@Roles(GlobalRole.ADMIN)
@Patch('admin/users/:id/suspend')
async suspendUser(@Param('id') userId: string) {
  return this.userService.suspendUser(userId);
}
```

### 10.2. System Settings

```typescript
@Roles(GlobalRole.ADMIN)
@Get('admin/settings')
async getSystemSettings() {
  // Only ADMIN
}
```

## 11. Resource Ownership

### 11.1. Project Ownership

**Tự động assign khi tạo:**

```typescript
async createProject(userId: string, createDto: CreateProjectDto) {
  const project = await this.projectRepository.save({
    ...createDto,
    createdBy: userId  // Owner
  });

  // Auto-add owner as MANAGER
  await this.projectMemberRepository.save({
    userId,
    projectId: project.id,
    role: ProjectRole.MANAGER
  });

  return project;
}
```

### 11.2. Conversation Assignment

**Assign agent to conversation:**

```typescript
async assignAgent(conversationId: number, agentId: string) {
  // Check agent is member of project
  const conversation = await this.conversationRepository.findOne({
    where: { id: conversationId },
    relations: ['project']
  });

  await this.projectService.checkProjectRole(
    agentId,
    conversation.project.id,
    [ProjectRole.AGENT]
  );

  conversation.assignedTo = agentId;
  return await this.conversationRepository.save(conversation);
}
```

## 12. API Key Authorization (Future)

**Planned:** Widget embed authentication

```typescript
// Future implementation
@Public()
@UseGuards(ApiKeyGuard)
@Post('widget/init')
async initWidget(
  @Headers('x-api-key') apiKey: string,
  @Body() data: any
) {
  const project = await this.projectService.findByApiKey(apiKey);
  // Validate origin against whitelisted domains
}
```

## 13. Best Practices

### 13.1. Defense in Depth

1. **Controller Layer:** Guards kiểm tra authentication & global roles
2. **Service Layer:** Validate project roles & ownership
3. **Database Layer:** Foreign key constraints
4. **Business Logic:** Thêm checks cụ thể cho từng case

### 13.2. Fail Securely

```typescript
if (!user) {
  throw new UnauthorizedException(); // Fail closed
}

if (!hasPermission) {
  throw new ForbiddenException(); // Fail closed
}

// Default deny
return false;
```

### 13.3. Least Privilege

- User mặc định = `USER` role
- Project member mặc định = `AGENT` role
- Chỉ grant permissions khi cần thiết
- Owner ≠ ADMIN (project owner không phải system admin)

### 13.4. Audit Logging

**Planned:**

```typescript
@Audit('DELETE_PROJECT')
async deleteProject(projectId: number, userId: string) {
  // Log who deleted what and when
}
```

## 14. Kết luận

Hệ thống phân quyền được thiết kế với:

✅ **Dual-tier roles:** Global + Project levels
✅ **Role hierarchy:** Kế thừa quyền
✅ **Guard-based protection:** Declarative authorization
✅ **Service-layer validation:** Project-specific permissions
✅ **Owner checks:** Sensitive operations
✅ **WebSocket authorization:** Dual-mode (auth + widget)
✅ **Resource ownership:** Automatic assignment
✅ **Fail secure:** Default deny

**Improvements needed:**

1. Add audit logging
2. Implement API key auth for widgets
3. Add fine-grained permissions (beyond roles)
4. Add permission caching
5. Implement admin panel for role management
6. Add project-level custom roles
