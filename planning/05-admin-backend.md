# Kế hoạch: Admin panel & Backend — `05-admin-backend`

**Deliverables:** Schema Firestore (spots, check-ins), Security Rules, Auth admin Email/Password, CRUD điểm, moderation Approve/Reject.

---

## 1. Prompt tạo (Create)

```
Thiết kế và triển khai backend Firebase cho admin + public app:

1) Schema NoSQL: **bắt buộc** thống nhất với `planning/02-implementation-traceability.md` mục 3 — collections `regions`, `spots`, `checkIns` (đổi tên chỉ khi sửa đồng bộ file `02-implementation-traceability` + toàn bộ code). Field tối thiểu & composite index (spotId + status + createdAt, …) nằm trong mục 3 file đó; tạo `firestore.indexes.json` và deploy cùng rules.
2) Security Rules: 
   - Public đọc spots (read), không ghi.
   - User (anonymous hoặc signed) tạo submission giới hạn field; không đổi status.
   - Chỉ admin (custom claims hoặc admins/{uid}) update status moderation và CRUD spots.
3) Firebase Auth: email/password cho BTC; hướng dẫn tạo user đầu tiên.
4) Admin UI: đăng nhập, CRUD **regions** (nếu dùng bảng khu vực) + CRUD spots (chọn **khu vực**, tọa độ, tên, upload Storage / gallery), danh sách pending với preview ảnh, nút Approve/Reject nhanh.
5) Ghi audit: moderatedBy, moderatedAt (nếu trong scope).

Lưu ý: chống spam ở mức rules (validate size field, giới hạn độ dài `text`); đề xuất thêm Functions nếu cần rate limit. **Storage rules** đồng bộ path `spots/`, `checkIns/` với mục 3.3 file `02-implementation-traceability` (ai được upload, ai được đọc).
```

---

## 2. Prompt review (Review)

```
Review backend & admin:

1) Rules: thử bypass bằng client giả (đổi status, đọc pending người khác, list toàn bộ users).
2) Admin UI: XSS từ comment; URL ảnh từ Storage có signed URL đúng không?
3) CRUD spots: validate lat/lng range; trùng tọa độ?
4) Auth: session timeout, logout, không hardcode password.
5) Indexes Firestore cho query moderation và list spots.

Output: test cases rules (mô tả) + severity.
```

---

## 3. Prompt đánh giá (Evaluate)

```
Nghiệm thu admin & backend:

1) Tạo/sửa/xóa spot phản ánh ngay trên map public (sau refresh hoặc real-time).
2) Submission từ app xuất hiện pending; approve hiện trên popup; reject không hiện.
3) User không phải admin không vào được route admin (guard + rules).
4) Backup/export (nếu cam kết trong hợp đồng) hoặc ghi rõ “chưa có”.

Sign-off BTC trên moderation flow.
```

---

## 4. Prompt cải thiện (Improve)

```
Mở rộng an toàn:

1) Firebase App Check + Cloud Functions rate limit theo IP/device.
2) Bulk approve, filter theo spot, search theo thời gian.
3) Soft delete spots; lưu lý do reject.
4) Email notify admin khi có pending mới (tùy budget).

Mỗi tính năng: estimate dev + ảnh hưởng billing.
```

---

**Mở rộng (bonus / roadmap):** `docs/TREASURE_HUNT_EVENT_PLATFORM.md` mục 6; `planning/07-bonus-backlog.md`. Gợi ý liên quan admin/backend: **B-04** export CSV, **B-05** FCM cho admin, **B-01** điểm/leaderboard (rule server-side); mục **6.1** (moderation cao điểm, App Check, rate limit).
