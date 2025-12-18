# 🔍 Widget Memory Leak Testing Guide

## 📋 Quick Start

### 1. Build Widget

```bash
cd packages/frontend
npm run build:widget
```

### 2. Open Test Page

```bash
# Option 1: Using VS Code Live Server
# Right-click on test-widget-memory.html → "Open with Live Server"

# Option 2: Using Python HTTP Server
python3 -m http.server 8080
# Then open: http://localhost:8080/packages/frontend/test-widget-memory.html

# Option 3: Using Node HTTP Server
npx http-server -p 8080
# Then open: http://localhost:8080/packages/frontend/test-widget-memory.html
```

### 3. Open DevTools

1. Press `F12` or `Ctrl+Shift+I` (Windows/Linux) / `Cmd+Option+I` (Mac)
2. Go to **Console** tab
3. Go to **Memory** tab (keep it ready)

### 4. Start Testing

1. Click "**Start Test**" button on the page
2. Watch console logs with timestamps
3. Take memory snapshots every 2 minutes

---

## 📊 What Enhanced Logging Shows

### Normal Log Flow (Expected)

```
[14:23:45.001] [Widget] 🚀 initializeWidget() called | Attempt #1
[14:23:45.005] [SocketService eca017a9] ✨ Instance created at 2025-10-20T14:23:45.005Z
[14:23:45.010] [SocketService eca017a9] 🔌 connect() called for projectId: 1 | Connection attempt #1
[14:23:45.015] [SocketService eca017a9] 📡 Creating new socket instance... | Connection #1
[14:23:45.020] [SocketService eca017a9] 🔧 Socket.IO instance created with config: reconnectionAttempts=5, delay=5s, timeout=10s
[14:23:45.025] [SocketService eca017a9] ✅ Registered 14 event handlers
[14:23:45.250] [SocketService eca017a9] ✅ Socket CONNECTED with ID: abc123xyz | Total connections: 1
[14:23:46.010] [App] 🚀 Setting up URL tracking and popstate listener
[14:23:46.015] [App] ✅ URL check interval STARTED (every 5s)
```

### Memory Leak Indicators (What We're Looking For)

#### 🔴 Issue 1: Multiple Socket Connections

```
[14:23:45.001] [SocketService eca017a9] 🔌 connect() | Connection attempt #1
[14:23:50.001] [SocketService eca017a9] 🔌 connect() | Connection attempt #2  ⚠️
[14:23:55.001] [SocketService eca017a9] 🔌 connect() | Connection attempt #3  🔴
[14:24:00.001] [SocketService eca017a9] 🔌 connect() | Connection attempt #4  🔴
```

**What it means**: Socket đang được tạo lại nhiều lần → Memory leak!

---

#### 🔴 Issue 2: Stale Socket Detection

```
[14:23:50.001] [SocketService eca017a9] ⚠️ STALE SOCKET FOUND! Old socket ID: abc123xyz
[14:23:50.005] [SocketService eca017a9] ❌ disconnect() called for socket ID: abc123xyz
[14:23:50.010] [SocketService eca017a9] 🧹 CLEANING UP 14 event listeners
```

**What it means**: Socket cũ chưa được cleanup trước khi tạo mới → Memory leak!

---

#### 🔴 Issue 3: Reconnection Loop

```
[14:24:00.001] [SocketService eca017a9] 🔄 RECONNECT ATTEMPT #1 started...
[14:24:05.001] [SocketService eca017a9] 🔄 RECONNECT ATTEMPT #2 started...
[14:24:10.001] [SocketService eca017a9] 🔄 RECONNECT ATTEMPT #3 started...
[14:24:15.001] [SocketService eca017a9] 🔄 RECONNECT ATTEMPT #4 started...
[14:24:20.001] [SocketService eca017a9] 🔄 RECONNECT ATTEMPT #5 started...
[14:24:25.001] [SocketService eca017a9] ❌ Socket reconnection FAILED after all attempts
```

**What it means**: Socket đang liên tục thử reconnect → Có thể gây memory leak!

---

#### 🔴 Issue 4: Event Handlers Accumulation

```
[14:23:45.001] [SocketService eca017a9] ✅ Registered 14 event handlers
[14:23:50.001] [SocketService eca017a9] ✅ Registered 28 event handlers  ⚠️
[14:23:55.001] [SocketService eca017a9] ✅ Registered 42 event handlers  🔴
[14:24:00.001] [SocketService eca017a9] ✅ Registered 56 event handlers  🔴
```

**What it means**: Event handlers tích lũy thay vì được replace → Memory leak!

---

#### 🔴 Issue 5: Multiple Widget Initializations

```
[14:23:45.001] [Widget] 🚀 initializeWidget() | Attempt #1
[14:23:50.001] [Widget] 🚀 initializeWidget() | Attempt #2  🔴
[14:23:55.001] [Widget] 🚀 initializeWidget() | Attempt #3  🔴
```

**What it means**: Widget đang được init nhiều lần → Memory leak!

---

#### 🔴 Issue 6: Cleanup Not Called

```
// After widget should be destroyed, but no cleanup logs appear
[14:25:00.001] [SocketService eca017a9] Still connected...  🔴
// No cleanup() or disconnect() logs
```

**What it means**: Cleanup không được trigger → Memory leak!

---

## 📸 Memory Snapshot Guide

### Taking Snapshots

1. Open **Memory** tab in DevTools
2. Select "**Heap snapshot**"
3. Click "**Take snapshot**"
4. Name it: "Snapshot 1 - Baseline", "Snapshot 2 - 2min", etc.

### When to Take Snapshots

- **Snapshot 1**: Right after clicking "Start Test" (Baseline)
- **Snapshot 2**: After 2 minutes
- **Snapshot 3**: After 5 minutes
- **Snapshot 4**: After 10 minutes (optional)

### What to Compare

1. Select a snapshot
2. Change dropdown from "Summary" to "**Comparison**"
3. Compare with previous snapshot
4. Look for growth in:
   - `Map` objects
   - `Window` (Retained Size)
   - `(system)` (Retained Size)
   - `(compiled code)`
   - `Detached` elements

---

## 🧪 Test Scenarios

### Scenario 1: Normal Usage (5 minutes)

1. Start test
2. Let it run without interaction
3. Take snapshots at 0, 2, 5 minutes
4. **Expected**: Minimal memory growth

### Scenario 2: Tab Switching

1. Start test
2. Click "Simulate Tab Switch" every 30 seconds
3. Take snapshots at 0, 2, 5 minutes
4. **Check**: Look for interval cleanup logs

### Scenario 3: URL Changes

1. Start test
2. Click "Simulate Navigation" every 20 seconds
3. Take snapshots at 0, 2, 5 minutes
4. **Check**: Look for URL change logs and context updates

### Scenario 4: Mixed (Stress Test)

1. Start test
2. Let auto-simulation run (switches every 30s)
3. Take snapshots at 0, 2, 5, 10 minutes
4. **Check**: Memory growth pattern

---

## 📝 Recording Your Findings

### Template

```markdown
## Test Session: [DATE & TIME]

### Environment

- Browser: Chrome/Firefox/Safari
- Version: \_\_\_
- OS: \_\_\_

### Initial State (Snapshot 1 - 0min)

- Heap Size: \_\_\_ MB
- connectionCount: \_\_\_
- disconnectionCount: \_\_\_
- eventHandlers: \_\_\_

### After 2 Minutes (Snapshot 2)

- Heap Size: **_ MB (+_** MB)
- connectionCount: \_\_\_
- disconnectionCount: \_\_\_
- eventHandlers: \_\_\_

### After 5 Minutes (Snapshot 3)

- Heap Size: **_ MB (+_** MB)
- connectionCount: \_\_\_
- disconnectionCount: \_\_\_
- eventHandlers: \_\_\_

### Issues Found

- [ ] Multiple socket connections
- [ ] Stale sockets detected
- [ ] Reconnection loops
- [ ] Event handler accumulation
- [ ] Multiple widget inits
- [ ] Missing cleanup calls

### Console Warnings/Errors
```

[Copy paste relevant log lines here]

```

### Memory Growth Analysis
- Map: ___ MB → ___ MB (+___ MB)
- Window: ___ MB → ___ MB (+___ MB)
- (system): ___ MB → ___ MB (+___ MB)

### Conclusion
[Your analysis here]
```

---

## 🎯 Success Criteria

### ✅ Good Behavior

- `connectionCount === disconnectionCount` (or ±1)
- Event handlers stay at **14** throughout test
- No "STALE SOCKET FOUND" warnings
- No reconnection loops
- Heap size growth < 20MB over 5 minutes
- Cleanup logs appear when expected

### 🔴 Bad Behavior (Memory Leak Confirmed)

- `connectionCount > disconnectionCount + 1`
- Event handlers growing (28, 42, 56...)
- Multiple "STALE SOCKET FOUND" warnings
- Continuous reconnection attempts
- Heap size growth > 50MB over 5 minutes
- No cleanup logs when expected

---

## 🐛 Debugging Tips

### Filter Console Logs

```javascript
// Show only SocketService logs
/SocketService/

// Show only warnings/errors
⚠️|❌|🔴

// Show only connection-related logs
connect|disconnect|STALE

// Show only event handler logs
handlers|Registered|CLEANING
```

### Check Current State in Console

```javascript
// Get current socket instance (from DevTools)
window.LiveChatWidget;

// Manual cleanup test
window.LiveChatWidget.destroy();

// Re-initialize
window.LiveChatWidget.init({ projectId: "1" });
```

---

## 📞 Next Steps

Once you've confirmed the memory leak patterns:

1. **Document findings** using the template above
2. **Share results** with the team
3. **Prioritize fixes** based on severity
4. **Implement fixes** from `MEMORY_LEAK_INVESTIGATION.md`
5. **Re-test** to verify fixes work

---

**Happy Testing! 🚀**

For detailed fix implementation plan, see: `MEMORY_LEAK_INVESTIGATION.md`
