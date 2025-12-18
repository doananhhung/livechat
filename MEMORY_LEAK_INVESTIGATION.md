# 🔍 Memory Leak Investigation - Enhanced Logging

## 📅 Date: October 20, 2025

## 🎯 Objective

Xác minh giả thuyết về socket reconnection gây memory leak bằng cách thêm timestamp và detailed logging.

## 📊 Initial Memory Analysis

### Snapshot Comparison:

| Metric                    | Snapshot 1 | Snapshot 2 | Snapshot 3 | Growth Factor |
| ------------------------- | ---------- | ---------- | ---------- | ------------- |
| **Total Heap**            | 52.9 MB    | 98.4 MB    | 207.0 MB   | **3.9x**      |
| **Window (Retained)**     | 0.4 MB     | 30.9 MB    | 102.5 MB   | **256x** 🔴   |
| **(system) (Retained)**   | 3.8 MB     | 35.3 MB    | 112.3 MB   | **29x** 🔴    |
| **Map**                   | 6.2 MB     | 18.7 MB    | 49.8 MB    | **8x** ⚠️     |
| **(string)**              | 18.6 MB    | 20.9 MB    | 26.4 MB    | **1.4x** ⚠️   |
| **Detached CSSStyleRule** | 0.0 MB     | 2.4 MB     | 4.8 MB     | **∞** ⚠️      |

## 🔬 Enhanced Logging Implementation

### Phase 1: Timestamp Format

Tất cả logs giờ đây hiển thị timestamp với format:

```
[HH:MM:SS.mmm] [Component] Message
```

Example:

```
[14:23:45.123] [SocketService eca017a9] 🔌 connect() called for projectId: 1 | Connection attempt #1
```

### Phase 2: Tracking Metrics

#### A. SocketService (`socketService.ts`)

**New Metrics:**

- ✅ `connectionCount` - Đếm số lần gọi `connect()`
- ✅ `disconnectionCount` - Đếm số lần disconnect
- ✅ Socket ID tracking cho mỗi connection
- ✅ Event handlers count tracking

**New Log Points:**

1. **Constructor**: Instance creation với timestamp
2. **connect()**:
   - Connection attempt number
   - Socket state check (connected/connecting)
   - Stale socket detection
   - Socket.IO config
3. **Reconnection Events**:
   - `reconnect_attempt` - Track mỗi lần thử reconnect
   - `reconnect` - Track successful reconnection
   - `reconnect_error` - Track reconnection errors
4. **disconnect()**:
   - Socket ID being disconnected
   - Connection/disconnection stats
5. **removeAllListeners()**:
   - Handlers count before cleanup
   - Individual handler removal logs
   - Handlers count after cleanup

#### B. App Component (`App.tsx`)

**New Log Points:**

1. **Visibility Change Handler**:
   - Page hidden/visible events
   - Interval pause/resume
2. **URL Tracking**:
   - Initial context send
   - URL changes (from interval)
   - URL changes (from popstate)
   - Interval setup/cleanup
3. **Component Lifecycle**:
   - Setup initialization
   - Cleanup execution

#### C. Widget Main (`main.tsx`)

**New Metrics:**

- ✅ `initializationCount` - Số lần widget được init
- ✅ `cleanupCount` - Số lần cleanup được gọi

**New Log Points:**

1. **initializeWidget()**:
   - Initialization attempt count
   - isInitialized flag state
   - Settings fetch
   - Visitor UID (new vs existing)
   - Store config update
   - Socket connect call
   - Shadow DOM creation
2. **cleanup()**:
   - Cleanup count
   - Each cleanup function execution
   - Socket disconnect call
   - Shadow DOM removal
   - Store reset
   - Final statistics

## 🧪 What to Look For in Logs

### ✅ **Normal Behavior** (Expected):

```
[14:23:45.001] [Widget] 🚀 initializeWidget() called | Attempt #1
[14:23:45.005] [SocketService eca017a9] ✨ Instance created
[14:23:45.010] [SocketService eca017a9] 🔌 connect() called | Connection attempt #1
[14:23:45.015] [SocketService eca017a9] 📡 Creating new socket instance...
[14:23:45.250] [SocketService eca017a9] ✅ Socket CONNECTED with ID: abc123xyz
```

### 🔴 **Memory Leak Indicators** (What we're hunting):

#### 1. Multiple Socket Connections

```
[14:23:45.001] [SocketService eca017a9] 🔌 connect() called | Connection attempt #1
[14:23:50.001] [SocketService eca017a9] 🔌 connect() called | Connection attempt #2  ⚠️
[14:23:55.001] [SocketService eca017a9] 🔌 connect() called | Connection attempt #3  🔴
```

**Diagnosis**: Socket đang được tạo lại nhiều lần

#### 2. Stale Socket Detection

```
[14:23:50.001] [SocketService eca017a9] ⚠️ STALE SOCKET FOUND! Old socket ID: abc123xyz
```

**Diagnosis**: Socket cũ chưa được cleanup đúng cách

#### 3. Reconnection Loop

```
[14:24:00.001] [SocketService eca017a9] 🔄 RECONNECT ATTEMPT #1
[14:24:05.001] [SocketService eca017a9] 🔄 RECONNECT ATTEMPT #2
[14:24:10.001] [SocketService eca017a9] 🔄 RECONNECT ATTEMPT #3
...
```

**Diagnosis**: Socket.IO đang liên tục reconnect

#### 4. Handlers Not Being Cleaned

```
[14:24:00.001] [SocketService eca017a9] 🧹 CLEANING UP 11 event listeners
[14:24:05.001] [SocketService eca017a9] ✅ Registered 22 event handlers  🔴
```

**Diagnosis**: Handlers tích lũy thay vì được replace

#### 5. Multiple Widget Initializations

```
[14:23:45.001] [Widget] 🚀 initializeWidget() | Attempt #1
[14:23:50.001] [Widget] 🚀 initializeWidget() | Attempt #2  🔴
```

**Diagnosis**: Widget đang được init nhiều lần

#### 6. Cleanup Not Being Called

```
// After 5 minutes, no cleanup logs
[14:28:45.001] Still no cleanup() logs  🔴
```

**Diagnosis**: Cleanup không được trigger khi cần

## 📝 Testing Instructions

### Step 1: Open Widget Test Page

1. Build widget: `npm run build:widget`
2. Open test page in browser
3. Open DevTools Console
4. Open Memory Profiler

### Step 2: Monitor Logs

Look for patterns in console logs:

- [ ] Check connection count increases over time
- [ ] Check for "STALE SOCKET FOUND" warnings
- [ ] Check for reconnection attempts
- [ ] Check handlers count accumulation
- [ ] Check timestamp intervals between events

### Step 3: Trigger Events

1. **Page Visibility**: Switch tabs back and forth
2. **URL Changes**: Navigate using browser back/forward
3. **Network**: Disable network briefly to trigger reconnect
4. **Time**: Let widget run for 5-10 minutes

### Step 4: Take Memory Snapshots

Take snapshots every 2 minutes and compare:

- Window objects count
- Map size growth
- String retention
- Event handler references

## 🎯 Success Criteria

### Confirmed Memory Leak Indicators:

- [ ] `connectionCount > disconnectionCount` over time
- [ ] Multiple "STALE SOCKET FOUND" warnings
- [ ] Event handlers count keeps growing
- [ ] Multiple instances of same handler in Map
- [ ] Reconnection loop without proper cleanup

### Expected Fix Impact:

After implementing fixes based on findings:

- Total Heap: 207MB → ~60-70MB (66% reduction)
- Window/System: 102.5MB → ~15MB (85% reduction)
- Map: 49.8MB → ~15MB (70% reduction)
- Event handlers: Should stay constant (~11-14)
- Connection count: Should match disconnection count ±1

## 📊 Log Analysis Template

Copy this template to record your findings:

```
=== Session Start: [TIME] ===

Initial State:
- connectionCount: ___
- disconnectionCount: ___
- eventHandlers size: ___
- Memory Heap: ___ MB

After 5 minutes:
- connectionCount: ___
- disconnectionCount: ___
- eventHandlers size: ___
- Memory Heap: ___ MB
- Warnings seen: ___

After 10 minutes:
- connectionCount: ___
- disconnectionCount: ___
- eventHandlers size: ___
- Memory Heap: ___ MB
- Warnings seen: ___

=== Findings ===
[ ] Multiple socket connections detected
[ ] Stale sockets found
[ ] Reconnection loops
[ ] Handler accumulation
[ ] Cleanup issues

=== Next Steps ===
Based on findings above...
```

## 🔧 Next Actions (After Analysis)

Once you confirm the issue with these logs, we'll implement:

1. **Phase 1**: Fix socket reconnection (prevent duplicates)
2. **Phase 2**: Fix event handler cleanup (use WeakMap)
3. **Phase 3**: Add connection state management
4. **Phase 4**: Optimize URL tracking
5. **Phase 5**: Production build optimizations

---

**Status**: 🟡 Waiting for log analysis results
**Updated**: October 20, 2025
