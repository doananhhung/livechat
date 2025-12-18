# Phân tích UI Settings Pages & Đề xuất Nâng cấp

## 📊 PHÂN TÍCH UI HIỆN TẠI - SETTINGS PAGES

### 1. **Settings Layout**

#### ✅ **Điểm Mạnh:**

- Sidebar navigation rõ ràng
- Nested routing structure tốt
- Separation of concerns (Profile/Security/Projects)

#### ⚠️ **Điểm Yếu:**

1. **Sidebar quá basic:**

   - Không có icons cho nav items
   - Thiếu active indicator rõ ràng
   - Button "Quay lại Inbox" không có icon
   - Thiếu user info/avatar ở top sidebar

2. **Layout không responsive:**

   - Sidebar cố định width 256px
   - Không có mobile/tablet layout
   - Không collapsible sidebar

3. **Visual hierarchy yếu:**
   - Background colors đơn điệu
   - Không có spacing system nhất quán
   - Thiếu visual separation giữa sidebar và content

---

### 2. **Profile Page**

#### ✅ **Điểm Mạnh:**

- Form fields rõ ràng
- Read-only fields được disabled đúng cách
- Additional info section (status, last login, created at)

#### ⚠️ **Điểm Yếu:**

1. **Thiếu avatar preview:**

   - Chỉ có input URL, không preview ảnh
   - Không có file upload option
   - Không validation URL

2. **Form UX yếu:**

   - Không có "Cancel" button
   - Không show dirty state (unsaved changes)
   - Không có confirmation khi có changes chưa save
   - Không group related fields

3. **Loading/Error states basic:**

   - Chỉ có text "Đang tải hồ sơ..."
   - Không có skeleton loader
   - Error message quá đơn giản

4. **Missing features:**
   - Không có option để xóa account
   - Không có export data
   - Không có activity log

---

### 3. **Security Page**

#### ✅ **Điểm Mạnh:**

- 2FA implementation đầy đủ (QR code, recovery codes)
- Change password với validation
- Change email với verification
- Good separation into sections
- Dialog modals cho sensitive actions

#### ⚠️ **Điểm Yếu:**

1. **Visual design:**

   - Sections không có visual separation rõ ràng
   - Chỉ có `<hr />` đơn giản
   - Thiếu icons cho các sections
   - Forms nằm trong border box nhìn cluttered

2. **2FA UX:**

   - QR Code dialog thiếu manual entry option
   - Recovery codes không có download option
   - Checkbox "Tôi đã lưu..." dễ bị skip
   - Không có option để regenerate recovery codes

3. **Password form:**

   - Không có password strength indicator
   - Không show/hide password toggle
   - Không có password requirements hint upfront
   - Success state không rõ ràng

4. **Email change:**
   - Không preview confirmation email
   - Không có option để cancel pending change
   - Missing feedback về verification status

---

### 4. **ProjectsListPage**

#### ✅ **Điểm Mạnh:**

- Create project form với domain whitelist
- Widget snippet với copy button
- Project actions (Settings, Invite) rõ ràng
- Permission gate hoạt động tốt

#### ⚠️ **Điểm Yếu:**

1. **Project cards quá đơn giản:**

   - Chỉ có name, không có metadata
   - Không show số conversations, members
   - Không show last activity
   - Không có project avatar/color
   - Không có status indicator (active/inactive)

2. **Create form UX:**

   - Form quá dài, không collapsible
   - Luôn hiển thị, chiếm space
   - Không có stepper/wizard cho multi-step
   - Domain inputs không có validation realtime

3. **Widget snippet:**

   - Hardcoded "https://cdn.yourdomain.com"
   - Không có instructions rõ ràng
   - Thiếu preview widget

4. **Missing features:**
   - Không có search/filter projects
   - Không có sort (by name, date, activity)
   - Không có pagination (nếu nhiều projects)
   - Không có bulk actions
   - Không có archive/delete project

---

### 5. **ProjectSettingsPage**

#### ✅ **Điểm Mạnh:**

- Collapsible sections (accordion style)
- Permission gate cho Manager only
- Widget settings comprehensive
- Color picker cho primary color
- Back button navigation

#### ⚠️ **Điểm Yếu:**

1. **Accordion UI:**

   - Chevron icons nhỏ, khó nhấn
   - Không có smooth transition animation
   - Section headers thiếu description preview
   - Không remember expanded state

2. **Widget settings:**

   - Color picker và text input duplicate
   - Position dropdown basic, không có visual preview
   - Không có widget preview pane
   - Không test widget realtime

3. **Form organization:**

   - Tất cả fields nằm trong 1 form dài
   - Không group related fields
   - Không có "Reset to default"
   - Save button chỉ ở cuối

4. **Missing features:**
   - Không có change history
   - Không có template presets
   - Không có A/B testing
   - Không có analytics integration

---

## 🚀 ĐỀ XUẤT NÂNG CẤP - THEO ƯU TIÊN

### **PRIORITY 1 - Layout & Navigation**

#### 1.1 **Responsive Settings Layout**

```tsx
// Nâng cấp SettingsLayout.tsx

<div className="flex min-h-screen">
  {/* Mobile: Drawer, Desktop: Sidebar */}
  <aside
    className={cn(
      "bg-card border-r flex flex-col",
      // Mobile: Hidden by default, show as drawer
      "hidden md:flex md:w-64 lg:w-72"
    )}
  >
    {/* User Card */}
    <div className="p-4 border-b">
      <div className="flex items-center gap-3">
        <Avatar name={user?.fullName} src={user?.avatarUrl} size="md" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{user?.fullName}</p>
          <p className="text-xs text-muted-foreground truncate">
            {user?.email}
          </p>
        </div>
      </div>
    </div>

    {/* Navigation */}
    <nav className="flex-1 p-3 space-y-1">
      <NavLink to="/inbox" className="nav-item">
        <MessageSquare className="h-4 w-4" />
        <span>Quay lại Inbox</span>
        <ArrowLeft className="h-4 w-4 ml-auto" />
      </NavLink>

      <div className="pt-4 pb-2">
        <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Cài đặt
        </h3>
      </div>

      {navItems.map((item) => (
        <NavLink key={item.href} to={item.href} className="nav-item">
          <item.icon className="h-4 w-4" />
          <span>{item.name}</span>
          {item.badge && <Badge variant="secondary">{item.badge}</Badge>}
        </NavLink>
      ))}
    </nav>

    {/* Footer */}
    <div className="p-3 border-t">
      <Button variant="ghost" size="sm" className="w-full justify-start">
        <HelpCircle className="h-4 w-4 mr-2" />
        Trợ giúp & Hỗ trợ
      </Button>
    </div>
  </aside>

  {/* Mobile: Header with drawer toggle */}
  <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b">
    <div className="flex items-center justify-between p-4">
      <Button variant="ghost" size="icon" onClick={toggleDrawer}>
        <Menu className="h-5 w-5" />
      </Button>
      <h1 className="font-semibold">Cài đặt</h1>
      <div className="w-10" /> {/* Spacer */}
    </div>
  </div>

  {/* Main Content */}
  <main className="flex-1 p-4 md:p-6 lg:p-8 bg-background overflow-auto">
    <div className="max-w-4xl mx-auto">
      <Outlet />
    </div>
  </main>
</div>
```

**Icons cho nav items:**

```tsx
const navItems = [
  { name: "Hồ sơ cá nhân", href: "/settings/profile", icon: User },
  { name: "Bảo mật", href: "/settings/security", icon: Shield },
  { name: "Dự án", href: "/settings/projects", icon: FolderKanban },
];
```

---

#### 1.2 **Animated Transitions**

```tsx
// Thêm vào các NavLinks
className={({ isActive }) => cn(
  "nav-item transition-all duration-200",
  isActive
    ? "bg-accent text-accent-foreground shadow-sm"
    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
)}
```

---

### **PRIORITY 2 - Profile Page Enhancements**

#### 2.1 **Avatar Upload & Preview**

```tsx
import { Upload, X } from "lucide-react";

const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl);
const [avatarFile, setAvatarFile] = useState<File | null>(null);

const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }
};

return (
  <div className="space-y-4">
    {/* Avatar Section */}
    <div className="flex items-start gap-6 p-6 border rounded-lg bg-card">
      <div className="relative">
        <Avatar
          src={avatarPreview}
          name={user?.fullName}
          size="xl"
          className="ring-2 ring-offset-2 ring-border"
        />
        {avatarPreview && (
          <Button
            size="icon"
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={() => {
              setAvatarPreview(null);
              setAvatarFile(null);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="flex-1">
        <h3 className="font-semibold mb-2">Ảnh đại diện</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Tải lên ảnh của bạn hoặc nhập URL
        </p>

        <div className="flex gap-2">
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <Button variant="outline" size="sm" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Tải ảnh lên
              </span>
            </Button>
          </label>

          <Input
            placeholder="hoặc nhập URL ảnh"
            value={watch("avatarUrl")}
            onChange={(e) => {
              setValue("avatarUrl", e.target.value);
              setAvatarPreview(e.target.value);
            }}
            className="flex-1"
          />
        </div>
      </div>
    </div>

    {/* Form fields */}
    {/* ...existing code... */}
  </div>
);
```

---

#### 2.2 **Form với Dirty State & Confirmation**

```tsx
import { useBlocker } from "react-router-dom";

const {
  register,
  handleSubmit,
  formState: { isDirty, dirtyFields },
  reset,
} = useForm<ProfileFormData>();

// Block navigation nếu có unsaved changes
const blocker = useBlocker(isDirty && !updateProfile.isSuccess);

return (
  <>
    <form>
      {/* ...fields... */}

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={!isDirty || updateProfile.isPending}>
          {updateProfile.isPending ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>

        {isDirty && (
          <Button type="button" variant="ghost" onClick={() => reset()}>
            Hủy
          </Button>
        )}

        {isDirty && (
          <p className="text-sm text-warning ml-auto">
            <AlertCircle className="h-4 w-4 inline mr-1" />
            Bạn có thay đổi chưa lưu
          </p>
        )}
      </div>
    </form>

    {/* Unsaved changes dialog */}
    <Dialog open={blocker.state === "blocked"} onOpenChange={() => {}}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bạn có thay đổi chưa lưu</DialogTitle>
          <DialogDescription>
            Bạn có chắc muốn rời khỏi trang này? Các thay đổi sẽ bị mất.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => blocker.reset()}>
            Ở lại
          </Button>
          <Button variant="destructive" onClick={() => blocker.proceed()}>
            Rời đi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
);
```

---

### **PRIORITY 3 - Security Page Improvements**

#### 3.1 **Password Strength Indicator**

```tsx
import { Check, X } from "lucide-react";

const getPasswordStrength = (password: string) => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z\d]/.test(password)) strength++;
  return strength;
};

const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  const strength = getPasswordStrength(password);

  const requirements = [
    { label: "Ít nhất 8 ký tự", met: password.length >= 8 },
    {
      label: "Chữ hoa và chữ thường",
      met: /[a-z]/.test(password) && /[A-Z]/.test(password),
    },
    { label: "Ít nhất 1 số", met: /\d/.test(password) },
    { label: "Ít nhất 1 ký tự đặc biệt", met: /[^a-zA-Z\d]/.test(password) },
  ];

  const strengthColors = [
    "bg-destructive",
    "bg-warning",
    "bg-warning",
    "bg-success",
    "bg-success",
  ];
  const strengthLabels = ["Rất yếu", "Yếu", "Trung bình", "Mạnh", "Rất mạnh"];

  return (
    <div className="space-y-3 mt-2">
      {/* Strength bar */}
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i < strength ? strengthColors[strength - 1] : "bg-muted"
            )}
          />
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">
          {password && strengthLabels[strength]}
        </span>
      </div>

      {/* Requirements checklist */}
      <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
        {requirements.map((req, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            {req.met ? (
              <Check className="h-3 w-3 text-success" />
            ) : (
              <X className="h-3 w-3 text-muted-foreground" />
            )}
            <span
              className={req.met ? "text-foreground" : "text-muted-foreground"}
            >
              {req.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Usage in form
<div>
  <Input
    type={showPassword ? "text" : "password"}
    {...register("newPassword")}
    rightIcon={
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setShowPassword(!showPassword)}
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </Button>
    }
  />
  <PasswordStrengthIndicator password={watch("newPassword")} />
</div>;
```

---

#### 3.2 **Enhanced 2FA with Download Recovery Codes**

```tsx
const handleDownloadRecoveryCodes = () => {
  const text = recoveryCodes.join("\n");
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `recovery-codes-${new Date().toISOString()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
};

// In recovery codes dialog
<DialogFooter className="mt-4 flex-col sm:flex-row gap-2">
  <Button variant="outline" onClick={handleDownloadRecoveryCodes}>
    <Download className="h-4 w-4 mr-2" />
    Tải xuống
  </Button>
  <Button
    onClick={() => {
      navigator.clipboard.writeText(recoveryCodes.join("\n"));
      toast({ title: "Đã copy vào clipboard" });
    }}
    variant="outline"
  >
    <Copy className="h-4 w-4 mr-2" />
    Copy
  </Button>
  <Button
    onClick={() => setRecoveryCodesDialogOpen(false)}
    disabled={!confirmSavedCodes}
  >
    Đã lưu, đóng
  </Button>
</DialogFooter>;
```

---

### **PRIORITY 4 - ProjectsListPage Enhancements**

#### 4.1 **Enhanced Project Cards**

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {projects.map((project) => (
    <Card
      key={project.id}
      className="overflow-hidden group hover:shadow-lg transition-shadow"
    >
      {/* Header with color accent */}
      <div
        className="h-2"
        style={{ backgroundColor: project.color || "var(--primary)" }}
      />

      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar
              name={project.name}
              size="md"
              className="ring-2 ring-offset-2"
              style={{ "--tw-ring-color": project.color }}
            />
            <div>
              <CardTitle className="text-lg">{project.name}</CardTitle>
              <Badge
                variant={project.status === "active" ? "success" : "secondary"}
                className="mt-1"
              >
                {project.status === "active" ? "Hoạt động" : "Tạm dừng"}
              </Badge>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => navigate(`/projects/${project.id}/settings`)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Cài đặt
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate(`/projects/${project.id}/invite`)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Mời thành viên
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Xóa dự án
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {project.stats?.conversationCount || 0}
            </div>
            <div className="text-xs text-muted-foreground">Cuộc trò chuyện</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {project.stats?.memberCount || 0}
            </div>
            <div className="text-xs text-muted-foreground">Thành viên</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {project.stats?.unreadCount || 0}
            </div>
            <div className="text-xs text-muted-foreground">Chưa đọc</div>
          </div>
        </div>

        {/* Last activity */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            Hoạt động:{" "}
            {project.lastActivityAt
              ? formatDistanceToNow(new Date(project.lastActivityAt), {
                  addSuffix: true,
                  locale: vi,
                })
              : "Chưa có"}
          </span>
        </div>
      </CardContent>

      <CardFooter className="border-t bg-muted/50">
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => navigate(`/inbox/projects/${project.id}`)}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Mở Inbox
        </Button>
      </CardFooter>
    </Card>
  ))}
</div>
```

---

#### 4.2 **Collapsible Create Project Form**

```tsx
const [isCreateFormOpen, setCreateFormOpen] = useState(false);

return (
  <>
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-xl font-semibold">Dự án của bạn</h2>
        <p className="text-sm text-muted-foreground">
          Quản lý tất cả các dự án live chat
        </p>
      </div>

      <Button onClick={() => setCreateFormOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Tạo dự án mới
      </Button>
    </div>

    {/* Create Project Dialog */}
    <Dialog open={isCreateFormOpen} onOpenChange={setCreateFormOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tạo dự án mới</DialogTitle>
          <DialogDescription>
            Thêm một dự án mới để bắt đầu nhận tin nhắn từ khách hàng
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateProject} className="space-y-6">
          {/* Project Name */}
          <div>
            <Label>Tên dự án *</Label>
            <Input
              placeholder="VD: Website bán hàng"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
            />
          </div>

          {/* Whitelisted Domains */}
          <div>
            <Label>Tên miền được phép *</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Thêm các tên miền mà bạn muốn tích hợp widget
            </p>

            {whitelistedDomains.map((domain, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <Input
                  placeholder="example.com"
                  value={domain}
                  onChange={(e) => handleDomainChange(index, e.target.value)}
                  className="flex-1"
                />
                {whitelistedDomains.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDomainInput(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addDomainInput}
              className="mt-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm tên miền
            </Button>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateFormOpen(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={createProjectMutation.isPending}>
              {createProjectMutation.isPending ? "Đang tạo..." : "Tạo dự án"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </>
);
```

---

### **PRIORITY 5 - ProjectSettingsPage Polish**

#### 5.1 **Accordion với Animation & Icons**

```tsx
import { ChevronRight, Info, Palette, Code } from "lucide-react";
import * as Accordion from "@radix-ui/react-accordion";

const sections = [
  {
    id: "basic",
    title: "Thông tin cơ bản",
    description: "Tên dự án và cài đặt chung",
    icon: Info,
  },
  {
    id: "widget",
    title: "Tùy chỉnh Widget",
    description: "Màu sắc, vị trí và nội dung",
    icon: Palette,
  },
  {
    id: "snippet",
    title: "Mã nhúng",
    description: "Copy code để tích hợp vào website",
    icon: Code,
  },
];

<Accordion.Root type="multiple" defaultValue={["basic"]} className="space-y-4">
  {sections.map((section) => (
    <Accordion.Item
      key={section.id}
      value={section.id}
      className="border rounded-lg overflow-hidden bg-card"
    >
      <Accordion.Header>
        <Accordion.Trigger className="group flex items-center justify-between w-full px-6 py-4 hover:bg-accent transition-colors">
          <div className="flex items-center gap-3">
            <section.icon className="h-5 w-5 text-muted-foreground" />
            <div className="text-left">
              <h3 className="font-semibold text-foreground">{section.title}</h3>
              <p className="text-sm text-muted-foreground">
                {section.description}
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
        </Accordion.Trigger>
      </Accordion.Header>

      <Accordion.Content className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden">
        <div className="px-6 pb-6 border-t pt-6">{/* Section content */}</div>
      </Accordion.Content>
    </Accordion.Item>
  ))}
</Accordion.Root>;
```

**Thêm animations vào tailwind.config.js:**

```js
keyframes: {
  "accordion-down": {
    from: { height: 0 },
    to: { height: "var(--radix-accordion-content-height)" },
  },
  "accordion-up": {
    from: { height: "var(--radix-accordion-content-height)" },
    to: { height: 0 },
  },
},
animation: {
  "accordion-down": "accordion-down 0.2s ease-out",
  "accordion-up": "accordion-up 0.2s ease-out",
},
```

---

#### 5.2 **Widget Preview Panel**

```tsx
const [widgetPreview, setWidgetPreview] = useState(false);

return (
  <div className="grid lg:grid-cols-2 gap-6">
    {/* Settings Form (Left) */}
    <div className="space-y-6">
      {/* ...form fields... */}

      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => setWidgetPreview(!widgetPreview)}
        >
          <Eye className="h-4 w-4 mr-2" />
          {widgetPreview ? "Ẩn Preview" : "Xem Preview"}
        </Button>

        <Button type="submit" disabled={updateWidgetMutation.isPending}>
          {updateWidgetMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </div>
    </div>

    {/* Live Preview (Right) - Hidden on mobile */}
    {widgetPreview && (
      <div className="hidden lg:block sticky top-6 h-fit">
        <div className="border rounded-lg p-6 bg-muted/50">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview Widget
          </h4>

          <div className="relative h-[500px] bg-background rounded-lg border overflow-hidden">
            {/* Mock website */}
            <div className="p-8">
              <div className="h-4 bg-muted rounded w-3/4 mb-4" />
              <div className="h-4 bg-muted rounded w-full mb-2" />
              <div className="h-4 bg-muted rounded w-5/6" />
            </div>

            {/* Widget Preview */}
            <div
              className={cn(
                "absolute bottom-4 w-80 bg-card border rounded-lg shadow-lg",
                position === WidgetPosition.BOTTOM_RIGHT ? "right-4" : "left-4"
              )}
            >
              <div
                className="p-4 rounded-t-lg text-white"
                style={{ backgroundColor: primaryColor }}
              >
                {companyLogoUrl && (
                  <img src={companyLogoUrl} alt="Logo" className="h-8 mb-2" />
                )}
                <h5 className="font-semibold">
                  {headerText || "Chat với chúng tôi"}
                </h5>
              </div>
              <div className="p-4">
                <div className="bg-muted rounded-lg p-3 text-sm mb-3">
                  {welcomeMessage ||
                    "Xin chào! Chúng tôi có thể giúp gì cho bạn?"}
                </div>
                <Input placeholder="Nhập tin nhắn..." disabled />
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);
```

---

## 📝 IMPLEMENTATION ROADMAP

### **Phase 1: Foundation (Week 1)**

- ✅ Responsive settings layout
- ✅ Sidebar icons & user card
- ✅ Mobile drawer navigation
- ✅ Breadcrumb navigation

### **Phase 2: Profile Enhancements (Week 2)**

- ✅ Avatar upload & preview
- ✅ Form dirty state tracking
- ✅ Unsaved changes confirmation
- ✅ Skeleton loaders

### **Phase 3: Security Improvements (Week 3)**

- ✅ Password strength indicator
- ✅ Show/hide password toggle
- ✅ Download/copy recovery codes
- ✅ Enhanced 2FA UX

### **Phase 4: Projects List (Week 4)**

- ✅ Enhanced project cards với stats
- ✅ Project colors & avatars
- ✅ Search & filter
- ✅ Collapsible create form

### **Phase 5: Project Settings (Week 5)**

- ✅ Animated accordions
- ✅ Widget live preview
- ✅ Better form organization
- ✅ Change history

---

## ✅ QUICK WINS - Có thể làm ngay

1. **Thêm icons cho sidebar navigation** (1h)
2. **User card ở top sidebar** (1h)
3. **Password show/hide toggle** (30min)
4. **Enhanced accordion với icons** (2h)
5. **Project card với stats** (3h)
6. **Avatar preview trong profile** (2h)
7. **Form dirty state indicator** (2h)
8. **Collapsible create project form** (2h)

**Total: ~1.5 days work → Much better UX**

---

## 🎯 KẾT LUẬN

**Current Settings UI:** Functional nhưng plain, thiếu polish và advanced features.

**Target Settings UI:**

- **Professional** với proper spacing, icons, visual hierarchy
- **Responsive** mobile-first design
- **User-friendly** với confirmations, validations, previews
- **Feature-rich** upload, download, search, filter
- **Accessible** keyboard navigation, screen reader support
- **Delightful** smooth animations, visual feedback

**Key Improvements:**

1. Responsive layout với mobile drawer
2. Avatar upload thay vì chỉ URL
3. Password strength & requirements
4. Enhanced project cards với stats
5. Widget live preview
6. Better form UX với dirty state tracking

**Next Step:** Start with Quick Wins? 🚀
