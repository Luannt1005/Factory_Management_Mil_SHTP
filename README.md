# Factory Management System (TTI Vietnam - SHTP & DDK)

Hệ thống quản lý nhà máy tập trung (**Factory Management System**) phục vụ vận hành cho **Milwaukee® / TTI Vietnam** (khu công nghệ cao SHTP & DDK). Hệ thống tích hợp toàn diện sơ đồ tổ chức (Org Chart), phân tích định biên nhân sự (Headcount Analytics), quy trình quản lý khách ra vào (Visitor Management & Control), và quản trị phân quyền người dùng (System Administration).

---

## 🚀 Các Phân Hệ Chính (Core Modules)

### 1. Sơ Đồ Tổ Chức (Org Chart)
- **Tuyến đường:** `/orgchart`, `/customize`, `/admin`
- **Công nghệ:** `@balkangraph/orgchart.js` kết hợp cơ chế bộ nhớ đệm SWR & in-memory server cache.
- **Tính năng:**
  - Hiển thị cây phân cấp nhân sự đa tầng: Quản lý trực tiếp (Direct Manager) và quản lý gián tiếp (Indirect Manager).
  - Lọc theo phòng ban (Department), hiển thị trạng thái nhân viên đang thử việc (Probation), vị trí tuyển dụng mở (Headcount Open).
  - Tùy chỉnh và lưu trữ sơ đồ tổ chức cá nhân hóa (`custom_orgcharts`).

### 2. Báo Cáo Định Biên Nhân Sự (Headcount Dashboard)
- **Tuyến đường:** `/dashboard`
- **Tính năng:**
  - Tổng hợp chỉ số KPI nhân sự theo thời gian thực (Tổng nhân sự, Staff, IDL, DL).
  - Biểu đồ thống kê Recharts: Phân bố thâm niên (Seniority), cơ cấu nhân sự theo loại (Donut Chart), phân bố theo BU Org 3.
  - Bộ lọc đa chiều: Lọc đệ quy theo cây quản lý (`ManagerFilter`), chức danh (`TitleFilter`), đơn vị kinh doanh (`BUFilter`).
  - Danh sách nhân viên (Employee Roster) hỗ trợ phân trang và danh sách nhân sự sắp nghỉ việc (Upcoming Resignations).

### 3. Quản Lý Khách Ra Vào (Visitor Management & Control)
- **Đăng ký & Theo dõi cá nhân:**
  - `/visitorrequest`: Đăng ký đơn khách đến làm việc, nhà thầu, phỏng vấn, chuyên gia expat.
  - `/visitordashboard`: Quản lý danh sách các yêu cầu khách thăm do cá nhân tạo.
- **Trạm kiểm soát an ninh & Lễ tân:**
  - `/visitoradmin/checkinout`: Trạm Check-in / Check-out cho bảo vệ và lễ tân. Hỗ trợ quét mã vạch trực tiếp bằng máy quét (Scanner Gun), gán thẻ khách ra vào (Card Number), ghi nhận thời gian thực.
  - `/visitoradmin/rooms`: Quản lý danh mục phòng họp, phòng tiếp khách theo tầng và cơ sở.
  - `/visitoradmin`: Bảng điều khiển quản trị viên phê duyệt đơn khách thăm.
  - `/visitoranalytics`: Báo cáo, biểu đồ thống kê lưu lượng khách ra vào theo ngày/tuần/tháng/site.
- **Tích hợp tự động hóa:** Kết nối Webhook Microsoft Power Automate gửi thông báo email, phê duyệt cấp VP và duyệt đơn.

### 4. Quản Lý Dữ Liệu Nhân Sự (HR Data Management)
- **Tuyến đường:** `/sheetmanager`, `/headcount_open`, `/import_hr_data`
- **Tính năng:**
  - Quản lý sheet dữ liệu nhân viên, cập nhật thông tin nhân sự.
  - Quản lý danh sách chỉ tiêu định biên mở (Headcount Open).
  - Nhập và lưu trữ hình ảnh nhân viên tự động vào thư mục lưu trữ của hệ thống.

### 5. Quản Trị Hệ Thống & Phân Quyền (System Admin & RBAC)
- **Tuyến đường:** `/systemadmin`
- **Tính năng:**
  - Quản lý tài khoản người dùng (`UserManagement`): Kích hoạt/Vô hiệu hóa tài khoản, cập nhật thông tin.
  - Phân quyền vai trò chi tiết (`RoleManagement`): Quản lý các nhóm vai trò (`app_roles`) như Security, Receptionist, Admin Orgchart, User Visitor, Hr Visitor... với quyền truy cập theo từng tuyến đường (`allowedPages`).
  - Phê duyệt tài khoản SSO chờ kích hoạt (`PendingApprovals`): Tự động duyệt đối với người dùng thuộc vị trí SHTP/DDK hoặc phòng HR-TA; các trường hợp khác được đưa vào danh sách chờ duyệt.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

| Thành phần | Công nghệ / Thư viện |
| :--- | :--- |
| **Framework** | [Next.js 15 (App Router)](https://nextjs.org/) + [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) + PostCSS |
| **Database** | [PostgreSQL On-Premises](https://www.postgresql.org/) (kết nối qua thư viện `pg`) |
| **Xác thực (Auth)** | [NextAuth.js v4](https://next-auth.js.org/) (Azure AD SSO / Microsoft Entra ID + Local Credentials bcrypt) |
| **Đồ thị & Biểu đồ** | [@balkangraph/orgchart.js](https://balkan.app/OrgChart-JS), [Recharts](https://recharts.org/) |
| **UI Components** | [@headlessui/react](https://headlessui.com/), [@heroicons/react](https://heroicons.com/) |
| **Xử lý tệp & Dữ liệu** | `exceljs`, `xlsx`, `axios`, `swr` |
| **Hạ tầng máy chủ** | PM2 Process Manager + Nginx Reverse Proxy (SSL / HTTPS) |

---

## 📁 Cấu Trúc Thư Mục (Project Structure)

```
Orgchart_TTI_onprem/
├── .agent/
│   └── workflows/              # Kế hoạch phát triển tính năng (Dashboard enhancement,...)
├── public/                     # Tài nguyên tĩnh (Logo, icon, ảnh mặc định)
├── scripts/                    # Scripts SQL & Javascript migration database
├── src/
│   ├── app/                    # Next.js App Router (Pages & APIs)
│   │   ├── api/                # API Routes (orgchart, visitor, auth, users, roles,...)
│   │   ├── checkinout/         # Trạm an ninh check-in/out
│   │   ├── dashboard/          # Headcount Analytics Dashboard
│   │   ├── orgchart/           # Giao diện sơ đồ tổ chức
│   │   ├── systemadmin/        # Quản trị hệ thống, tài khoản & vai trò
│   │   ├── visitoradmin/       # Quản trị khách thăm & phòng họp
│   │   ├── visitorrequest/     # Đăng ký khách thăm
│   │   └── layout.tsx          # Root Layout với Header, Sidebar & Providers
│   ├── components/             # Reusable UI Components (Header, Sidebar, Modals, Tables,...)
│   ├── constant/               # Hằng số cấu hình & API endpoints
│   ├── hooks/                  # Custom React Hooks (useOrgData, useSheetData,...)
│   ├── lib/                    # Database Pool (db.ts, visitor-db.ts), NextAuth, Cache
│   ├── middleware.ts           # Next.js Middleware xác thực token & phân quyền RBAC
│   ├── styles/                 # Tùy chỉnh CSS giao diện
│   └── types/                  # TypeScript Interfaces & Database Schema Types
├── ecosystem.config.js         # Cấu hình triển khai PM2 trên máy chủ
├── nginx.conf                  # Cấu hình Nginx Reverse Proxy & SSL
├── package.json
└── tsconfig.json
```

---

## ⚙️ Cấu Hình Môi Trường (.env.local)

Tạo tệp `.env.local` ở thư mục gốc với các thông số cấu hình:

```env
# Cache Configuration
NEXT_PUBLIC_CACHE_REVALIDATE_INTERVAL=60000

# ============================================
# PostgreSQL Configuration (On-Premises)
# ============================================
DB_SERVER=10.147.36.55
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_database_password
DB_NAME=Orgchart_TTI_Mil

# ============================================
# Power Automate Webhooks
# ============================================
POWER_AUTOMATE_FOR_LEAVE_URL=https://...
POWER_AUTOMATE_VP_APPROVAL_URL=https://...
POWER_AUTOMATE_EMAIL_NOTIFICATION_URL=https://...

# ============================================
# NextAuth & Microsoft Azure AD SSO
# ============================================
AZURE_AD_CLIENT_ID=your_client_id
AZURE_AD_CLIENT_SECRET=your_client_secret
AZURE_AD_TENANT_ID=your_tenant_id
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your_nextauth_secret
```

---

## 🚀 Hướng Dẫn Khởi Chạy (Getting Started)

### 1. Cài đặt thư viện dependencies
```bash
npm install
```

### 2. Chạy môi trường phát triển (Development)
```bash
npm run dev
```
Truy cập ứng dụng tại: `http://localhost:3001`

### 3. Kiểm tra kiểu dữ liệu & lint
```bash
npx tsc --noEmit
npm run lint
```

### 4. Đóng gói & Chạy môi trường Production
```bash
# Đóng gói bản build
npm run build

# Khởi chạy trực tiếp
npm run start

# Hoặc khởi chạy bằng PM2 trên máy chủ
pm2 start ecosystem.config.js
```

---

## 🔒 Triển Khai Máy Chủ & Nginx (On-Premise Deployment)

- **PM2:** Được cấu hình trong `ecosystem.config.js` với tham số `NODE_OPTIONS: "--max-http-header-size=65536"` để đảm bảo xử lý an toàn kích thước lớn của SSO JWT tokens từ hệ thống mạng doanh nghiệp.
- **Nginx:** Đảm nhiệm xử lý HTTPS (port 443), cân bằng bộ đệm proxy (`proxy_buffer_size 2048k`), chuyển hướng HTTP sang HTTPS, và định tuyến trực tiếp thư mục ảnh nhân viên `/uploads/` sang đường dẫn vật lý trên máy chủ.
