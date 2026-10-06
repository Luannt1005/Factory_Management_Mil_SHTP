# web-tester.md — Antigravity Web & E2E Testing Agent (Powered by Gemini)

> **Role:** Automated Web Crawler, E2E Form Tester & UI Visual Verifier  
> **Host Platform:** Google Antigravity (Powered by Google Gemini 1M+ Context)  
> **Credentials Tested:** `admin` / `123456` (Local NextAuth System Admin)  
> **Mission:** Tự động truy cập Web app, test giao diện và luồng đăng nhập/chức năng, sau đó để Gemini tổng hợp báo cáo siêu ngắn (< 15 dòng) gửi lại cho Claude mà không làm tốn token context của Claude.

---

## 1. Cơ chế hoạt động (How it works)

Khi bạn chat với Claude yêu cầu test web (ví dụ: *"Claude ơi, hãy test trang login với tài khoản admin"* hoặc *"Test trang quản trị khách"*):

1. **Claude** sẽ tự động gọi lệnh terminal:
   ```bash
   node scripts/antigravity_web_tester.js <route> [action]
   ```
2. **Antigravity Script** sẽ:
   - Tự động lấy CSRF token và cookies của Next.js app (`http://localhost:3001` hoặc `3000`).
   - Nếu có action `test_admin`: Tự động submit payload đăng nhập với tài khoản `admin` / `123456`.
   - Trích xuất HTML DOM, các form inputs, buttons, lỗi render hoặc redirect status.
3. **Gemini Model (Antigravity)** sẽ:
   - Đọc toàn bộ DOM và HTTP status trong nền (hàng nghìn dòng HTML).
   - Tóm lược lại đúng 6-10 dòng báo cáo kết quả sạch sẽ.
4. **Claude nhận kết quả:**
   - Claude đọc báo cáo 10 dòng từ Gemini, nắm ngay lỗi hoặc giao diện bị hỏng và tiếp tục fix code cho bạn!

---

## 2. Các lệnh Claude có thể chạy tự động

| Mục tiêu test | Lệnh Claude thực thi | Chức năng test |
|---|---|---|
| **Test trang đăng nhập & tài khoản admin** | `node scripts/antigravity_web_tester.js /login test_admin` | Kiểm tra giao diện `/login`, submit auth credentials `admin` / `123456`, kiểm tra phản hồi của NextAuth và DB. |
| **Test trang kiểm soát bảo vệ (Check-in/out)** | `node scripts/antigravity_web_tester.js /visitoradmin/checkinout` | Kiểm tra bảng quét bảo vệ, các bộ lọc SHTP/DDK, camera/QR inputs. |
| **Test trang đặt phòng họp** | `node scripts/antigravity_web_tester.js /visitoradmin/rooms` | Kiểm tra modal đặt phòng, danh sách phòng họp, tình trạng trống. |
| **Test trang tạo yêu cầu khách** | `node scripts/antigravity_web_tester.js /visitorrequest` | Kiểm tra multi-step form đăng ký khách, safety checkbox. |
| **Test trang Orgchart & Headcount** | `node scripts/antigravity_web_tester.js /orgchart` | Kiểm tra render canvas sơ đồ tổ chức BalkanGraph. |

---

## 3. Mẫu báo cáo gọn gàng Gemini gửi cho Claude

```markdown
### [Antigravity Web Test Report for Claude]
- Route: /login
- HTTP Status: 200
- Page Render: PASS - Factory Management login page rendered successfully.
- Feature Verification: PASS / FAIL (Chi tiết: đăng nhập thành công hay lỗi timeout DB)
- UI Elements Identified: Milwaukee Tool logo, background video, inputs, submit button.
- Next Steps / Diagnostics: [Gợi ý cho Claude dòng code cần sửa nếu có lỗi]
```

---

## 4. Hướng dẫn dành cho bạn khi chat với Claude

Bạn chỉ cần chat bình thường với Claude:
- *"Claude, chạy agent test thử vào web trang login với tài khoản admin xem hoạt động không."*
- *"Claude, test xem trang /visitoradmin/rooms có hiển thị các tab phòng họp không."*

Claude sẽ tự động chạy script `scripts/antigravity_web_tester.js`, model Gemini của Antigravity sẽ vào web test và báo cáo kết quả ngay lập tức!
