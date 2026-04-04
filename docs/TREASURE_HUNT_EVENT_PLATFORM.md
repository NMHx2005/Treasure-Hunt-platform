# Tài liệu dự án: Nền tảng sự kiện “Truy tìm kho báu” (Map + Check-in)

**Phiên bản tài liệu:** 1.7  
**Ngày:** 04/04/2026  
**Trạng thái:** Đặc tả & kế hoạch triển khai

---

## 1. Tóm tắt kinh doanh (Business)

### 1.1 Vấn đề & giải pháp

Ban tổ chức sự kiện cần một **web app mobile-first** để người chơi:

- Xem **bản đồ** với các **điểm kho báu** (spots).
- **Định vị** và điều hướng ngoài trời.
- **Check-in** tại điểm, **tải ảnh + comment**.
- Xem nội dung đã được **duyệt** (sau moderation).

Hệ thống giảm tải vận hành nhờ **tự động hóa duyệt nội dung** và **CRUD điểm** trên admin panel.

### 1.1a Tầm nhìn tối thiểu (đối chiếu nghiệp vụ)

Các ý sau **đã được bao phủ** bởi các mục F-xx bên dưới; **khu vực** và **quy mô số điểm** không cố định — chỉ tham chiếu khoảng khi chốt sự kiện; chi tiết kỹ thuật ở **§2.1**, **§3.2**, **§3.5**:

| Kỳ vọng kinh doanh | Trong tài liệu |
|--------------------|----------------|
| Bản đồ theo **nhiều khu vực** (thành phố / tỉnh — **có thể thêm bất kỳ đâu** BTC cần); số điểm **ước lượng** thường vài chục mỗi khu vực nhưng **không cam kết cứng**; marker kho báu + clustering | F-01, F-02, F-04, F-04b, F-08 + **region** trên spot |
| Bấm điểm → xem **tọa độ** + **ảnh** (ảnh minh họa điểm do BTC + ảnh/check-in text **đã duyệt** của user) | F-04, F-05, F-09 |
| User **bình luận / đăng ảnh check-in** theo từng điểm (text có thể không kèm ảnh) | F-05, F-06 |
| Tính năng **râu ria** nâng UX | Mục **6** (bonus), NF scroll/lag |

### 1.2 Đối tượng & giá trị

| Đối tượng | Giá trị nhận được |
|-----------|-------------------|
| Người chơi | Trải nghiệm rõ ràng ngoài trời, bản đồ dễ đọc, check-in nhanh |
| Ban tổ chức | Quản lý điểm, kiểm duyệt ảnh tập trung, triển khai HTTPS/GPS ổn định |
| Nhà phát triển | Stack quen thuộc (Next.js + Firebase + Google Maps), CI/CD rõ ràng |

### 1.3 Phạm vi tài chính & thời gian (tham chiếu)

| Hạng mục | Ngày (ước lượng) | Chi phí dự kiến (VNĐ) |
|----------|------------------|------------------------|
| UI/UX | 2 | 4.000.000 |
| Frontend & bản đồ | 3 | 6.000.000 |
| Admin & backend | 2 | 5.000.000 |
| DevOps & vận hành | 1 | 2.000.000 |
| **Tổng** | **8** | **17.000.000** |

Chi phí nền tảng (domain, Maps API, Firebase) tách biệt theo bảng dịch vụ khách hàng tự chi hoặc hợp đồng phụ.

### 1.4 Giả định & ràng buộc

- **HTTPS bắt buộc** để trình duyệt cho phép Geolocation API.
- Người chơi dùng **điện thoại** chủ yếu; không yêu cầu native app trong phạm vi hiện tại.
- **Không** cần phân quyền admin đa cấp (một nhóm BTC đăng nhập chung hoặc vài tài khoản cố định).
- Ảnh check-in **phải qua duyệt** trước khi hiển thị công khai trên popup điểm.

---

## 2. Yêu cầu (Requirements)

### 2.1 Chức năng (Functional)

| ID | Mô tả | Ưu tiên |
|----|--------|---------|
| F-01 | Hiển thị bản đồ Google Maps với style tùy chỉnh (brand) | Must |
| F-02 | Clustering marker khi zoom out | Must |
| F-03 | Nút “Vị trí của tôi” + xử lý từ chối quyền vị trí | Must |
| F-04 | Hiển thị điểm kho báu trên map: **marker** theo từng spot; mỗi spot có **tọa độ**, tên, **ảnh minh họa / ảnh “xung quanh”** do admin gắn (nếu có) | Must |
| F-04b | **Đa khu vực mở rộng**: admin định nghĩa / chọn **khu vực** (tỉnh, thành, hoặc nhóm do BTC đặt tên); mỗi spot gắn **một khu vực**; app cho phép **lọc hoặc chuyển vùng** map (center/bounds mặc định theo khu vực đang xem) — **không giới hạn** chỉ một hay hai thành phố cố định | Must |
| F-05 | Popup điểm: hiển thị **tọa độ** (copy được nếu cần) + ảnh điểm + luồng **ảnh & bình luận text đã duyệt** (real-time hoặc refresh có kiểm soát) | Must |
| F-06 | Gửi nội dung tại điểm: **bình luận text**; **ảnh check-in tùy chọn** (cho phép chỉ text); nén/resize ảnh **client-side** trước upload khi có ảnh | Must |
| F-07 | Admin đăng nhập Email/Password | Must |
| F-08 | CRUD điểm kho báu (**khu vực**, tọa độ, tên, hình/gallery) | Must |
| F-09 | Moderation: danh sách pending, Approve/Reject | Must |
| F-10 | Triển khai Firebase Hosting + domain + SSL | Must |

### 2.2 Phi chức năng (Non-functional)

| ID | Mô tả | Mục tiêu |
|----|--------|----------|
| NF-01 | Thời gian tải map ban đầu (4G) | ≤ ~3s (mục tiêu dự án; cần đo thực tế) |
| NF-02 | Khả năng chịu tải | **Mục tiêu ~1.000–2.000 CCU** (user đồng thời); **bắt buộc** xác nhận bằng **load test** trên staging + **giám sát** Firebase/Maps/Storage ngày chạy — không coi là SLA cứng nếu chưa có số liệu |
| NF-03 | Bảo mật dữ liệu | Firestore Security Rules, không lộ quyền admin |
| NF-04 | Tối ưu chi phí Firebase | Giảm dung lượng ảnh (resize/compress), hạn chế đọc/ghi thừa |
| NF-05 | Mobile ngoài trời | Độ tương phản cao, nút lớn, responsive iOS/Android |
| NF-06 | Khả dụng trong sự kiện | CI/CD, log cơ bản, kênh hỗ trợ khẩn cấp (theo gói) |
| NF-07 | Quy mô điểm trên map | **Không cố định** số lượng; dùng **clustering** (F-02); kiểm thử stress theo **kịch bản BTC** (ví dụ vài chục đến trăm điểm — chỉ minh họa, không là SLA cứng) |
| NF-08 | Luồng bình luận / ảnh trong popup | **Không cố định** số comment; tối ưu theo quy mô thực tế: **phân trang / cursor**, **lazy load** hoặc **virtual list**, giới hạn dữ liệu mỗi lần đọc; UI cuộn mượt, tránh jank |
| NF-09 | Hiệu năng & chất lượng web | Theo **§3.5**: giảm JS không cần thiết, ảnh/font tối ưu, cache, đo **Core Web Vitals** / Lighthouse trên mobile — cải thiện liên tục, ngưỡng cụ thể ghi sau khi đo baseline |

### 2.3 Ngoài phạm vi (Out of scope) — gợi ý làm rõ với khách

- App native (iOS/Android store).
- Đa ngôn ngữ nếu không được nêu trong hợp đồng.
- Phân quyền admin chi tiết (role RBAC phức tạp).
- Thanh toán trong app.

---

## 3. Kiến trúc & công nghệ (Tech)

### 3.1 Stack đề xuất

| Lớp | Công nghệ | Ghi chú |
|-----|-----------|---------|
| Frontend | **Next.js (React)** | SSR/SSG tùy chiến lược; tối ưu cold start theo yêu cầu |
| Bản đồ | **Google Maps JavaScript API** + Marker clustering + **Map Style** (JSON) |
| Auth (admin) | **Firebase Authentication** (Email/Password) |
| Database | **Cloud Firestore** (collections: users/admin refs, spots, checkIns/moderation state) |
| Lưu ảnh | **Firebase Storage** (đường dẫn theo spot/user/checkIn) |
| Hosting & CI/CD | **Firebase Hosting** + GitHub Actions (hoặc tương đương) |
| Domain | DNS trỏ về Firebase, SSL do Firebase/Google xử lý |

### 3.2 Mô hình dữ liệu (khái niệm)

- **Region** (tuỳ mô hình): document `regions/{id}` với `name`, `slug`, optional `defaultCenter`/`defaultBounds` — **BTC thêm khu vực mới** (bất kỳ tỉnh/thành) mà không đổi code cứng.
- **Spot**: `id`, `name`, `lat`, `lng`, **`regionId`** (FK tới `regions`), `imageUrl` hoặc **`galleryUrls`** (optional), `createdAt`, …  
  *(Nếu đơn giản hóa MVP: field `regionSlug` string + validate admin — vẫn phải **mở rộng được**.)*
- **Check-in / submission**: `spotId`, `comment`, `imagePath` hoặc URL sau upload, `status: pending | approved | rejected`, `createdAt`, (optional) `deviceId` hoặc rate key — tùy chống spam.
- **Admin user**: quản lý qua Firebase Auth; Firestore có thể lưu `admins/{uid}` để rules.

### 3.3 Luồng real-time

- Client subscribe Firestore (theo spot hoặc theo batch có giới hạn) để hiển thị nội dung đã duyệt, **tránh** mở quá nhiều listener cùng lúc (gắn với popup đang mở hoặc pagination).

### 3.4 Bảo mật

- Rules: chỉ admin **write** spots; người chơi **create** check-in giới hạn field; chỉ đọc check-in `approved` công khai.
- Không để API key Maps lộ nếu dùng server-side restrictions; với JS client cần **API key restrictions** (HTTP referrer) và giới hạn API.

### 3.5 Tối ưu hiệu năng website (bắt buộc hướng tới)

Mục tiêu: web **nhẹ, nhanh, ổn định** trên 4G và máy tầm trung — đặc biệt khi bản đồ và danh sách dài.

| Hạng mục | Hành động gợi ý |
|----------|-----------------|
| **JavaScript** | **Code-split** / **dynamic import** thư viện Maps (không nhét toàn bộ vào chunk đầu); giảm hydration không cần thiết (component map lazy mount). |
| **Ảnh** | Resize/compress (đã có F-06); hiển thị: định dạng hiện đại (WebP/AVIF nếu pipeline cho phép), **lazy load** ảnh dưới fold, kích thước phù hợp viewport. |
| **Font** | Chỉ subset ký tự cần (vd. Latin + tiếng Việt nếu dùng); `font-display: swap` để tránh text ẩn lâu. |
| **Mạng & cache** | Firebase Hosting: **cache** asset tĩnh lâu, HTML ngắn hạn nếu cần; `preconnect`/`dns-prefetch` tới origin Maps **cân nhắc** (đo trade-off). |
| **Firestore / UI** | Ít listener đồng thời; query có **limit** + pagination; tránh render một lúc hàng trăm node DOM trong popup. |
| **Đo lường** | Lighthouse (mobile) hoặc PageSpeed; theo dõi **LCP, INP, CLS** — ghi **baseline** sau build đầu, lặp cải thiện (không gắn SLA số cứng trước khi đo). |

Phần triển khai chi tiết nằm trong `planning/04-frontend-maps.md` và `planning/06-devops-operations.md`.

---

## 4. Gói công việc & deliverables (mapping)

| Module | Deliverable chính |
|--------|-------------------|
| UI/UX | User flow, Figma (marker, popup, form), map style JSON, hướng dẫn responsive |
| Frontend | Next.js app: map + GPS + form + real-time read tối ưu + **hiệu năng web** (§3.5) |
| Admin | Dashboard CRUD spots + moderation |
| DevOps | Pipeline deploy Hosting, domain SSL, tài liệu vận hành cơ bản |

---

## 5. Đánh giá nhanh & đề xuất cải thiện (so với bảng gốc)

1. **Chi phí mục 4.2 (Domain):** Trong bảng ghi “500” — nên thống nhất **500.000 VNĐ** (hoặc đúng số thực tế) để tránh hiểu nhầm với 500 đồng.
2. **Chống spam check-in:** Chỉ Security Rules có thể chưa đủ; cân nhắc **rate limit** (Cloud Functions + Firestore counter), **App Check**, hoặc **reCAPTCHA** nếu sự kiện công khai lớn.
3. **Mạng yếu / gián đoạn:** Thêm **retry upload**, **trạng thái “đang gửi”**, có thể **Service Worker** cache shell (tuỳ ưu tiên thời gian).
4. **Quyền riêng tư ảnh:** **Xóa EXIF** (GPS trong ảnh) phía client trước upload; chính sách lưu trữ/xóa sau sự kiện.
5. **1.000–2.000 CCU:** Cần **kịch bản load test** (công cụ + chỉ số đọc/ghi/realistic burst check-in) và **giám sát** quota Firebase/Maps/Storage trong ngày chạy; gói **Blaze** + cảnh báo billing nếu vượt định mức miễn phí.
6. **Audit moderation:** Log **ai duyệt**, **thời điểm** (field trong document) để tránh tranh chấp nội dung.
7. **Sự cố Maps billing:** Cảnh báo email khi usage tăng; document fallback (thông báo BTC nếu map lỗi).
8. **Accessibility:** Thêm tiêu chí tối thiểu (focus, label form, contrast) song song với “ngoài trời”.
9. **Backup Firestore:** Export định kỳ hoặc quy trình snapshot trước sự kiện lớn (tùy gói vận hành).

Tài liệu này có thể cập nhật khi chốt hợp đồng và sau mỗi sprint.

---

## 6. Roadmap cải thiện & tính năng bonus (mở rộng)

Phần này **không** thay thế phạm vi gói 8 ngày trừ khi được ký bổ sung; dùng để ưu tiên sau UAT hoặc đóng gói **Plus / Pro**.

### 6.1 Cải thiện vận hành & sản phẩm (ưu tiên sau Core)

| Ưu tiên | Hạng mục | Mô tả ngắn |
|---------|----------|------------|
| Cao | Chống spam & lạm dụng | App Check, rate limit (Cloud Functions), tùy chọn reCAPTCHA v3 khi submit |
| Cao | UX khi từ chối GPS | Thông báo rõ ràng, gợi ý bật quyền / mở Settings; vẫn xem map + danh sách điểm nếu phù hợp game |
| Cao | Real-time tối ưu | Một listener/query theo `spotId`, `limit`, unsubscribe khi đóng popup |
| Trung bình | Moderation “cao điểm” | Preview ảnh full màn, phím tắt Approve/Reject, lọc theo spot |
| Trung bình | Vận hành sự kiện | Trang status tối giản + hotline; cảnh báo billing Maps/Firebase |
| Trung bình | Pháp lý / niềm tin | Điều khoản + consent ảnh hiển thị công khai (nội dung ngắn theo tư vấn pháp lý) |

Chi tiết prompt thực thi: `planning/07-bonus-backlog.md`.

### 6.2 Bảng tính năng bonus (tùy chọn / upsell)

| ID | Tính năng | Giá trị | Effort (ước lượng) |
|----|-----------|---------|---------------------|
| B-01 | Leaderboard / điểm theo spot đã check-in | Engagement, dễ chia sẻ | Trung bình–cao (cần rule chống gian lận) |
| B-02 | QR tại điểm → deep link mở đúng spot | Giảm nhầm điểm, hỗ trợ hiện trường | Thấp–trung bình |
| B-03 | Chế độ preview nội bộ (BTC) trước giờ mở công khai | Kiểm tra tọa độ thực địa | Thấp |
| B-04 | Export báo cáo CSV (check-in theo spot, thời gian) | Báo cáo cho BTC / nhà tài trợ | Thấp |
| B-05 | FCM thông báo admin khi có submission pending | Duyệt nhanh, không F5 | Trung bình |
| B-06 | PWA (Add to Home Screen, icon sự kiện) | Trải nghiệm gần app, mở lại nhanh | Thấp–trung bình |
| B-07 | Watermark logo sự kiện trên ảnh (client) | Branding | Trung bình |
| B-08 | Hai map style (sáng/tối) + nút đổi | Ngoài trời ngày/đêm | Thấp |

### 6.3 Gợi ý đóng gói bán hàng

| Gói | Gồm gì (gợi ý) |
|-----|----------------|
| **Core** | Đúng phạm vi báo giá 8 ngày: map, GPS, check-in, moderation, CRUD spot, deploy |
| **Plus** | Core + chống spam nhẹ (App Check / rate limit), audit moderation, export CSV, QR deep link |
| **Pro** | Plus + leaderboard (nếu chốt rule), FCM admin, PWA, watermark — tùy đàm phán thời gian |

Mọi mục **Plus/Pro** cần id trong hợp đồng phụ hoặc phụ lục scope.

---

## 7. Liên kết nội bộ

- Thư mục kế hoạch & thứ tự file: `planning/README.md`
- **Khởi tạo dự án (Day 0):** `planning/01-project-init.md`
- **Traceability & quy ước triển khai Core:** `planning/02-implementation-traceability.md`
- Module triển khai: `planning/03-ui-ux.md` … `planning/06-devops-operations.md`
- Prompt tổng (tech lead): `planning/00-master-prompts.md`
- Hiệu năng web (thực thi): `planning/04-frontend-maps.md`, `planning/06-devops-operations.md` — đối chiếu **§3.5**
- Cải thiện & bonus (prompt chi tiết): `planning/07-bonus-backlog.md`
