# 📚 HƯỚNG DẪN SỬ DỤNG CẤU TRÚC PRESENTATION

## 📁 Cấu trúc thư mục

```
presentation/reveal.js/
├── index.html                          # Trang chủ - Table of Contents
├── security_presentation.html          # File gốc (backup)
│
├── shared/                             # Components dùng chung
│   ├── head.html                       # Meta tags + CSS links
│   ├── styles.html                     # Custom CSS styles
│   └── scripts.html                    # Reveal.js scripts + init
│
└── chapters/                           # Các chương riêng biệt
    ├── chapter-template.html           # Template mẫu
    ├── 01-authentication.html
    ├── 02-authorization.html
    ├── 03-data-encryption.html
    └── 04-api-websocket-security.html
```

---

## 🎯 TẠI SAO SỬ DỤNG FILE SHARED?

### ✅ Lợi ích:

1. **DRY (Don't Repeat Yourself)**
   - Không copy-paste CSS/scripts vào mỗi file
   - Sửa 1 lần, áp dụng cho tất cả

2. **Maintainability (Dễ bảo trì)**
   - Thay đổi theme → Chỉ sửa `shared/styles.html`
   - Update Reveal.js → Chỉ sửa `shared/scripts.html`

3. **Consistency (Nhất quán)**
   - Đảm bảo tất cả chapters có cùng style
   - Không bị lỗi do quên update

4. **File size nhỏ hơn**
   - Mỗi chapter chỉ ~300-500 dòng
   - Dễ đọc, dễ chỉnh sửa

---

## 🔧 CÁCH HOẠT ĐỘNG

### 1. **File `index.html` (Trang chủ)**

```html
<!doctype html>
<html lang="vi">
<head>
  <!-- Hard-coded vì đây là landing page -->
  <meta charset="utf-8">
  <link rel="stylesheet" href="dist/reveal.css">
  <!-- ... -->
  <style>
    /* Minimal styles cho TOC */
  </style>
</head>
<body>
  <div class="reveal">
    <div class="slides">
      <section>
        <h1>Bảo Mật Dự Án</h1>
        <ul>
          <li><a href="chapters/01-authentication.html">Chương 1</a></li>
          <li><a href="chapters/02-authorization.html">Chương 2</a></li>
          <!-- ... -->
        </ul>
      </section>
    </div>
  </div>
  <script src="dist/reveal.js"></script>
  <script>Reveal.initialize({...});</script>
</body>
</html>
```

### 2. **File `shared/head.html`**

Chỉ chứa meta tags và link tags (KHÔNG có `<head>` wrapper):

```html
<!-- Meta tags -->
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<!-- Fonts -->
<link href="https://fonts.googleapis.com/..." rel="stylesheet">

<!-- Reveal.js CSS -->
<link rel="stylesheet" href="../dist/reset.css">
<link rel="stylesheet" href="../dist/reveal.css">
```

### 3. **File `shared/styles.html`**

Chỉ chứa 1 thẻ `<style>` với custom CSS:

```html
<!-- Custom Styles -->
<style>
  :root {
    --accent-color: #818CF8;
    /* ... */
  }
  
  .reveal {
    background: linear-gradient(...);
  }
  
  /* ... all custom styles ... */
</style>
```

### 4. **File `shared/scripts.html`**

Chỉ chứa các thẻ `<script>`:

```html
<!-- Reveal.js Scripts -->
<script src="../dist/reveal.js"></script>
<script src="../plugin/notes/notes.js"></script>
<!-- ... -->

<!-- Initialize -->
<script>
  Reveal.initialize({
    width: 1920,
    height: 1080,
    /* ... */
  });
  mermaid.initialize({ startOnLoad: true, theme: 'dark' });
</script>
```

### 5. **File Chapter (Ví dụ: `01-authentication.html`)**

```html
<!doctype html>
<html lang="vi">
<head>
  <script>
    // Load head (meta + links) - Chạy NGAY
    fetch('../shared/head.html')
      .then(r => r.text())
      .then(html => {
        document.head.insertAdjacentHTML('afterbegin', html);
      });
    
    // Load styles - Chạy NGAY
    fetch('../shared/styles.html')
      .then(r => r.text())
      .then(html => {
        document.head.insertAdjacentHTML('beforeend', html);
      });
  </script>
  <title>Chương 1: Xác thực</title>
</head>
<body>
  <div class="reveal">
    <div class="slides">
      
      <section>
        <h1 class="chapter-title">Chương 1: Xác thực</h1>
      </section>

      <!-- Nội dung slides -->
      
      <section>
        <h2>Kết thúc Chương 1</h2>
        <p><a href="../index.html">← Quay lại</a></p>
      </section>

    </div>
  </div>
  
  <script>
    // Load scripts SAU khi DOM ready
    window.addEventListener('DOMContentLoaded', () => {
      fetch('../shared/scripts.html')
        .then(r => r.text())
        .then(html => {
          document.body.insertAdjacentHTML('beforeend', html);
        });
    });
  </script>
</body>
</html>
```

---

## 🔍 CHI TIẾT KỸ THUẬT

### **Tại sao dùng `insertAdjacentHTML` thay vì `innerHTML +=`?**

```javascript
// ❌ KHÔNG TỐT - Có thể gây lỗi
document.head.innerHTML += html; // Overwrite existing content

// ✅ TỐT - Insert vào vị trí cụ thể
document.head.insertAdjacentHTML('afterbegin', html);  // Đầu head
document.head.insertAdjacentHTML('beforeend', html);   // Cuối head
document.body.insertAdjacentHTML('beforeend', html);   // Cuối body
```

### **Thứ tự loading**

1. **`<head>` scripts** (sync) → Load ngay khi parse HTML
   - Load `head.html` (meta + links)
   - Load `styles.html` (CSS)

2. **`DOMContentLoaded`** → Chờ DOM ready
   - Load `scripts.html` (Reveal.js + init)

### **Path resolution**

```
chapters/01-authentication.html
└── ../shared/head.html          → presentation/reveal.js/shared/head.html
└── ../dist/reveal.css           → presentation/reveal.js/dist/reveal.css
└── ../index.html                → presentation/reveal.js/index.html
```

---

## 📝 CÁCH TẠO CHAPTER MỚI

### Bước 1: Copy template

```bash
cp chapters/chapter-template.html chapters/05-new-chapter.html
```

### Bước 2: Sửa tiêu đề

```html
<title>Chương 5: Tiêu đề mới</title>

<section>
  <h1 class="chapter-title">Chương 5: Tiêu đề mới</h1>
  <p class="subtitle">(Subtitle)</p>
</section>
```

### Bước 3: Thêm nội dung slides

```html
<section>
  <div class="slide-content-card">
    <!-- Slide content -->
  </div>
</section>
```

### Bước 4: Update `index.html`

```html
<li><a href="chapters/05-new-chapter.html">Chương 5: Tiêu đề mới</a></li>
```

---

## 🚀 LOCAL DEVELOPMENT

### Option 1: Live Server (VS Code Extension)

1. Install "Live Server" extension
2. Right-click `index.html` → "Open with Live Server"
3. Navigate: `http://localhost:5500/index.html`

### Option 2: Python HTTP Server

```bash
cd presentation/reveal.js
python -m http.server 8000
# Mở: http://localhost:8000/index.html
```

### Option 3: Node.js http-server

```bash
npm install -g http-server
cd presentation/reveal.js
http-server -p 8000
# Mở: http://localhost:8000/index.html
```

**⚠️ Lưu ý:** Phải dùng web server vì `fetch()` không hoạt động với `file://` protocol (CORS policy).

---

## 🎨 CUSTOM STYLES

### Thay đổi theme colors

Edit `shared/styles.html`:

```css
:root {
  --accent-color: #FF6B6B;  /* Thay đổi màu accent */
  --text-color: #FFFFFF;
  /* ... */
}
```

### Thêm custom class

```css
.my-custom-class {
  color: var(--accent-color);
  font-weight: bold;
}
```

Sử dụng trong chapter:

```html
<p class="my-custom-class">Custom styled text</p>
```

---

## 🐛 TROUBLESHOOTING

### 1. **Styles không load**

```javascript
// Kiểm tra console
console.log('Styles loaded');

// Thêm vào shared/styles.html
<style>
  /* Debug */
  body::after {
    content: 'Styles loaded!';
    position: fixed;
    bottom: 10px;
    right: 10px;
  }
</style>
```

### 2. **Reveal.js không khởi tạo**

```javascript
// Thêm logging
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM ready, loading scripts...');
  fetch('../shared/scripts.html')
    .then(r => {
      console.log('Scripts fetched');
      return r.text();
    })
    .then(html => {
      console.log('Scripts inserted');
      document.body.insertAdjacentHTML('beforeend', html);
    });
});
```

### 3. **CORS error với `fetch()`**

```
Access to fetch at 'file://...' from origin 'null' has been blocked by CORS policy
```

**Giải pháp:** Phải chạy qua web server (xem phần Local Development)

---

## ✅ CHECKLIST KHI TẠO CHAPTER MỚI

- [ ] Copy từ `chapter-template.html`
- [ ] Đổi title trong `<title>` và `<h1>`
- [ ] Kiểm tra path `../shared/` đúng
- [ ] Thêm link vào `index.html`
- [ ] Test trên local server
- [ ] Kiểm tra speaker notes
- [ ] Verify mermaid diagrams render

---

## 📊 SO SÁNH

| Cách làm | Ưu điểm | Nhược điểm |
|----------|---------|------------|
| **Hard-code mỗi file** | Đơn giản, không cần server | Copy-paste nhiều, khó maintain |
| **Fetch shared files** | DRY, dễ maintain | Cần web server |
| **Build tool (webpack)** | Professional, optimize | Phức tạp, overkill cho dự án này |

→ **Chúng ta chọn cách 2:** Balance giữa đơn giản và maintainability

---

## 🎯 KẾT LUẬN

Cấu trúc này giúp:
- ✅ Tách biệt nội dung theo chapter
- ✅ Dễ maintain và update
- ✅ Consistent styles across all chapters
- ✅ File size nhỏ, dễ đọc
- ✅ Git-friendly (ít conflict)
- ✅ Scalable (dễ thêm chapter mới)

**Happy presenting! 🎉**
