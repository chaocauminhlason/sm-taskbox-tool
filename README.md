# 📦 Scenario Manager TaskBox Tool (SM TaskBox Suite)

> Công cụ tự động hóa toàn diện cho hệ thống Scenario Manager (`https://sm.config.inc/boxes`): Đồng bộ từ Google Sheets, quản lý TaskBox trực tiếp trên Web, phân công Assignee, bàn giao ca (Handover), mượn/trả đồ và in nhãn mã QR hàng loạt.

---

## 🚀 Tính năng nổi bật

### 📊 Tab 1: Đồng bộ dữ liệu từ Google Sheets lên Scenario Manager
- **Tự động đọc URL Tab**: Hỗ trợ copy link trực tiếp từng Tab của người soạn đồ (Sơn, Tiến, Quân, Giang, Mạnh, Hưng...).
- **Tự động đối chiếu thông minh (Smart Audit)**:
  - So sánh chi tiết từng món đồ (Object ID & Số lượng) trong Sheet với dữ liệu thực tế trên Scenario Manager.
  - Phân loại rõ ràng: 🟢 **Tạo mới (CREATE)**, 🟡 **Cập nhật đồ (UPDATE)**, 🔵 **Đã khớp 100% (MATCH)**, 🔴 **Đã mượn (COLLECTED)**, ⚪ **Bỏ qua (Nghỉ)**.
- **Tự động nhận diện Anchor Object ID**:
  - Đọc trực tiếp Anchor ID từ cột B nếu có.
  - Tự động map fallback theo từ điển 77 Anchor chuẩn.
  - Cho phép chỉnh sửa Anchor ID trực tiếp ngay trên bảng trước khi đồng bộ.
- **Tự động phân công Assignee ID**: Nhập ID theo module (vd: `M12`: `2140`, `M13`: `3178`, `M12-01_B2`: `3122`), tự động lưu vào LocalStorage cho các lần sau.
- **Start Fresh & Xóa nháp an toàn**: Tự động dọn sạch cache nháp cũ tránh xung đột form.

---

### 🌐 Tab 2: Quản lý & Bàn giao / Trả đồ trực tiếp từ Web (Live Web Manager)
- **Không cần Google Sheet**: Quét trực tiếp toàn bộ TaskBox đang có trên Scenario Manager.
- **Bộ lọc theo Ngày tạo**:
  - Chọn nhanh: **Hôm nay**, **Hôm qua**, **3 ngày gần nhất**, **Tất cả ngày**.
  - Tùy chọn ngày cụ thể qua **Date Picker**.
- **Bộ lọc theo Trạng thái**:
  - **Chưa trả (Active)**: Ẩn các box đã deactivated.
  - **Đang mượn (collected)**: Lọc các box đang trong ca làm việc.
  - **Đã gán (assigned)** / **Mới tạo (created)** / **Tất cả**.
- **Tìm kiếm tức thì**: Lọc theo Module (`M12`, `M13`), Tên Box, ID người giữ, Anchor ID.
- 🤝 **Bàn giao ca (Handover)**:
  - Hỗ trợ bàn giao hàng loạt: Tích chọn các box -> Nhập Receiver ID + Ghi chú -> Bấm "Bàn giao".
  - Nút Bàn giao nhanh `🤝 Giao` trên từng dòng.
- ↩️ **Trả đồ (Return / Deactivate)**:
  - Trả đồ hàng loạt cho các box `collected` -> `deactivated`.
  - Nút Trả đồ nhanh `↩️ Trả` trên từng dòng.
- 📦 **Mượn đồ (Borrow)**: Chuyển trạng thái `assigned` -> `collected`.
- 🖨️ **In nhãn mã QR (QR Print Generator)**: Mở popup in nhãn chuẩn đẹp (hỗ trợ chọn 2 cột / 3 cột, xem trước và in PDF ngay).

---

## 🛠️ Hướng dẫn cài đặt

1. Cài đặt tiện ích mở rộng **Tampermonkey** trên trình duyệt Chrome / Edge:
   - [Tampermonkey trên Chrome Web Store](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
2. Mở Tampermonkey Dashboard -> Tạo Script mới (`+`).
3. Sao chép toàn bộ mã nguồn từ file [`tampermonkey_taskbox_sync_tool.user.js`](./tampermonkey_taskbox_sync_tool.user.js) và dán vào trình soạn thảo.
4. Bấm **Ctrl + S** để lưu lại.
5. Truy cập `https://sm.config.inc/boxes` để sử dụng nút bấm nổi tròn **`Sync Sheet Taskbox`** ở góc dưới màn hình.

---

## ⚙️ Cấu hình quyền truy cập (Tampermonkey Grants)

```javascript
// @match        https://sm.config.inc/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
```

---

## 📄 Bản quyền
Phát triển bởi Antigravity.
