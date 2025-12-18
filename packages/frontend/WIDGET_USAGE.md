# 💬 Live Chat Widget - Usage Guide

## 📦 Installation

### Method 1: Script Tag (Recommended)

Add the following script tag to your HTML, just before closing `</body>`:

```html
<script
  id="your-app-widget-script"
  src="https://your-domain.com/widget/app.js"
  data-project-id="YOUR_PROJECT_ID"
  async
  defer
></script>
```

The widget will automatically initialize when the page loads.

---

### Method 2: Programmatic API

For more control, you can initialize the widget programmatically:

```html
<script src="https://your-domain.com/widget/app.js" async defer></script>

<script>
  // Wait for script to load
  window.addEventListener("load", function () {
    // Initialize widget
    LiveChatWidget.init({
      projectId: "YOUR_PROJECT_ID",
      visitor: {
        name: "John Doe", // Optional
        email: "john@example.com", // Optional
      },
    });
  });
</script>
```

---

## 🎮 API Reference

### `LiveChatWidget.init(config)`

Initialize the chat widget.

**Parameters:**

- `config` (Object)
  - `projectId` (string, required): Your project ID
  - `visitor` (Object, optional): Visitor information
    - `name` (string, optional): Visitor's name
    - `email` (string, optional): Visitor's email

**Example:**

```javascript
LiveChatWidget.init({
  projectId: "123456",
  visitor: {
    name: "Jane Smith",
    email: "jane@example.com",
  },
});
```

---

### `LiveChatWidget.destroy()`

Remove the widget and cleanup all resources.

**Example:**

```javascript
// Remove widget from page
LiveChatWidget.destroy();

// Re-initialize if needed
LiveChatWidget.init({ projectId: "123456" });
```

---

## 🎨 Customization

Widget appearance is controlled from your project settings dashboard:

- **Primary Color**: Changes button and header color
- **Welcome Message**: First message shown to visitors
- **Position**: Bottom-right corner (fixed)

---

## ♿ Accessibility

The widget is built with accessibility in mind:

### Keyboard Navigation

- **ESC**: Close chat window
- **Tab**: Navigate through interactive elements
- **Enter**: Send message or activate buttons

### Screen Readers

- Full ARIA label support
- Live regions for new messages
- Semantic HTML structure

---

## 🔒 Security

### XSS Protection

- All user input is sanitized
- HTML entities are escaped
- Safe rendering with `dangerouslySetInnerHTML`

### Rate Limiting

- Maximum 10 messages per 60 seconds
- Client-side validation before sending

### Message Length

- Maximum 5000 characters per message
- Character counter shown in composer

---

## 🌐 Browser Support

| Browser | Minimum Version |
| ------- | --------------- |
| Chrome  | 90+             |
| Firefox | 88+             |
| Safari  | 14+             |
| Edge    | 90+             |

**Required Features:**

- Shadow DOM
- ES6+ (async/await, arrow functions)
- WebSocket (Socket.IO)
- LocalStorage

---

## 🐛 Troubleshooting

### Widget not showing?

1. **Check project ID**: Make sure it's correct
2. **Check console**: Look for error messages
3. **Network tab**: Verify widget script loaded
4. **CORS**: Ensure your domain is whitelisted

### Connection issues?

1. **Internet**: Check your connection
2. **Firewall**: WebSocket port 443 must be open
3. **Browser**: Try disabling extensions
4. **API status**: Check backend health

### Messages not sending?

1. **Rate limit**: Wait a few seconds
2. **Connection**: Check status indicator
3. **Character limit**: Keep under 5000 chars
4. **Console errors**: Check browser console

---

## 📊 Events & Logging

### Development Mode

In development, the widget logs events to console:

```javascript
[Widget] Fetching settings for project: 123
[Socket Event]: connect
[Socket Event]: conversationHistory
[Socket Event]: messageSent
```

### Production Mode

Console logging is disabled in production builds.

---

## 🔧 Advanced Usage

### Dynamic Project Switching

```javascript
// Destroy current widget
LiveChatWidget.destroy();

// Initialize with different project
LiveChatWidget.init({
  projectId: "NEW_PROJECT_ID",
});
```

### Conditional Loading

```javascript
// Only show widget for logged-in users
if (user.isLoggedIn) {
  LiveChatWidget.init({
    projectId: "123",
    visitor: {
      name: user.name,
      email: user.email,
    },
  });
}
```

### SPA Integration (React, Vue, Angular)

```javascript
// In your component lifecycle
componentDidMount() {
  LiveChatWidget.init({ projectId: '123' });
}

componentWillUnmount() {
  LiveChatWidget.destroy();
}
```

---

## 📱 Mobile Support

The widget is fully responsive and works on mobile devices:

- Touch-friendly tap targets (min 44px)
- Optimized for small screens
- Mobile keyboard support
- Prevents viewport zoom issues

---

## 🚀 Performance

### Bundle Size

- **Gzipped**: ~45KB
- **Uncompressed**: ~140KB

### Load Time

- **First Paint**: <100ms
- **Interactive**: <300ms
- **First Message**: <1s

### Best Practices

- Loaded with `async defer`
- Shadow DOM isolation (no style conflicts)
- Lazy rendering (only when opened)
- Efficient re-renders with Preact

---

## 📞 Support

Need help? Contact us:

- **Email**: support@yourapp.com
- **Docs**: https://docs.yourapp.com
- **Status**: https://status.yourapp.com

---

## 📄 License

Proprietary - © 2025 Your Company

---

## 🎉 Examples

### Simple Example

```html
<!DOCTYPE html>
<html>
  <head>
    <title>My Website</title>
  </head>
  <body>
    <h1>Welcome to my website!</h1>

    <!-- Add widget -->
    <script
      id="your-app-widget-script"
      src="https://cdn.yourapp.com/widget/app.js"
      data-project-id="abc123"
      async
      defer
    ></script>
  </body>
</html>
```

### With Visitor Info

```html
<script src="https://cdn.yourapp.com/widget/app.js" async defer></script>

<script>
  window.addEventListener("load", function () {
    // Get user info from your app
    const user = getCurrentUser();

    LiveChatWidget.init({
      projectId: "abc123",
      visitor: {
        name: user.fullName,
        email: user.email,
      },
    });
  });
</script>
```

---

Made with ❤️ using Preact & Socket.IO
