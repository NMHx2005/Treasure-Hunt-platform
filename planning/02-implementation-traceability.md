# Traceability & checklist triển khai Core — `02-implementation-traceability`

**Mục đích:** đối chiếu **F-xx / NF-xx** với file prompt; quy ước kỹ thuật **tối thiểu** để dev không phải đoán; thứ tự sprint gợi ý.

**Tài liệu gốc:** `docs/TREASURE_HUNT_EVENT_PLATFORM.md`

---

## 1. Đánh giá nhanh: đã đủ chi tiết chưa?

| Mức độ | Ý nghĩa |
|--------|---------|
| **Đủ để bắt đầu** | Có: `01-project-init` khởi tạo repo, `03`–`06` prompt theo module, `00-master` tổng thể, `docs` F/NF rõ. |
| **Thiếu nếu chỉ đọc prompt rời** | Trước đây: không có **tên collection/field thống nhất**, **thứ tự upload Storage → Firestore**, **route app**, **index Firestore** — dễ lệch giữa dev. |
| **Cách xử lý** | Dùng **mục 3–5 file này** như “single source” kỹ thuật; mọi prompt `04-frontend-maps` / `05-admin-backend` đã được bổ sung tham chiếu. |

**Chưa có trong planning (chấp nhận hoặc bổ sung sau):** test E2E tự động (Playwright/Cypress), nội dung pháp lý/copy chính thức, thiết kế Figma cụ thể (do `03-ui-ux` + khách hàng).

---

## 2. Ma trận: Requirement → File prompt chính

| ID | File planning (ưu tiên đọc / chạy prompt) |
|----|-------------------------------------------|
| F-01, F-02, F-04, F-04b, F-05 (phần public) | `04-frontend-maps.md` + style từ `03-ui-ux.md` |
| F-03 | `04-frontend-maps.md` |
| F-05 (feed), F-06 | `04-frontend-maps.md` + `05-admin-backend.md` (rules đọc `approved`) |
| F-07, F-08, F-09 | `05-admin-backend.md` |
| F-10 | `06-devops-operations.md` + `01-project-init.md` |
| NF-01, NF-07–NF-09 | `04-frontend-maps` + `06-devops-operations` + `docs` §3.5 |
| NF-02, NF-06 | `06-devops-operations.md` |
| NF-03–NF-05 | `05-admin-backend.md` + `04-frontend-maps` (client) |

---

## 3. Quy ước dữ liệu & Storage (gợi ý chuẩn hoá — có thể đổi tên nếu team thống nhất khác)

### 3.1 Firestore collections

| Collection | Document ID | Field tối thiểu (gợi ý) |
|------------|-------------|---------------------------|
| `regions` | auto hoặc slug | `name`, `slug`, `order?`, `defaultCenter?: { lat, lng }`, `defaultBounds?: { ne, sw }`, `createdAt` |
| `spots` | auto | `regionId`, `name`, `lat`, `lng`, `imageUrl?`, `galleryUrls?: string[]`, `createdAt`, `updatedAt?` |
| `checkIns` | auto | `spotId`, `text` (string, có thể `""` nếu chỉ ảnh — **quyết định prod:** hoặc bắt buộc ít nhất một trong text/image), `imageUrl?`, `status`: `pending` \| `approved` \| `rejected`, `createdAt`, `moderatedBy?`, `moderatedAt?`, `rejectReason?` |

**Lưu ý F-06:** Nếu “chỉ text” là bắt buộc: `text` min length > 0 khi không có `imageUrl`. Nếu cho phép chỉ ảnh: rules + UI phải cho phép `text === ""`.

### 3.2 Firestore — query cần index (composite)

- `spots`: `where('regionId','==', x)` + `orderBy('createdAt')` (nếu dùng).
- `checkIns` (public feed): `where('spotId','==', x)` + `where('status','==','approved')` + `orderBy('createdAt','desc')` + `limit(N)`.

Tạo index qua link lỗi console hoặc `firestore.indexes.json`.

### 3.3 Firebase Storage paths

| Loại | Path gợi ý |
|------|------------|
| Ảnh spot (admin) | `spots/{spotId}/cover.jpg` hoặc `spots/{spotId}/gallery/{n}.jpg` |
| Ảnh check-in (user) | `checkIns/{checkInId}/photo.jpg` (**tạo doc Firestore trước** để có `checkInId`, hoặc dùng UUID client rồi upload rồi commit doc — thống nhất một luồng) |

**Luồng upload khuyến nghị:** (A) Tạo doc `checkIns` với `status: pending` + `imageUrl: null` → lấy `id` → upload Storage → `updateDoc` với `imageUrl`. Hoặc (B) UUID client cho cả path + doc id — nhất quán trong rules.

### 3.4 Admin quyền

- **Cách A:** collection `admins/{uid}` — Rules `exists(/databases/$(database)/documents/admins/$(request.auth.uid))`.
- **Cách B:** Custom claim `admin: true` (set qua script/Functions một lần).

---

## 4. Route Next.js (gợi ý)

| Route | Vai trò |
|-------|---------|
| `/` | Landing / chọn khu vực hoặc redirect `/map` |
| `/map` | Bản đồ public (F-01–F-06) |
| `/admin/login` | F-07 |
| `/admin/...` | CRUD regions/spots, moderation — guard client + Rules server |

---

## 5. Thứ tự triển khai gợi ý (Core)

1. `01-project-init.md` — Pass Evaluate.
2. `05-admin-backend.md` — Rules tối thiểu + schema `regions`/`spots`/`checkIns` + seed 1 region (prompt Create).
3. `04-frontend-maps.md` — Đọc spots theo region, map + cluster + popup đọc `approved` checkIns.
4. `04-frontend-maps.md` — Form submit check-in + upload Storage + write Firestore `pending`.
5. `05-admin-backend.md` — Admin UI moderation + CRUD (hoặc song song bước 3–4 nếu 2 người).
6. `03-ui-ux.md` — Polish UI theo Figma/style (có thể song song sớm hơn nếu có design).
7. `06-devops-operations.md` — CI/CD production, domain, Lighthouse.

---

## 6. Definition of Done — Core (tóm tắt)

- [ ] Public: chọn region → thấy đúng spots → cluster → popup tọa độ + gallery spot + feed approved.
- [ ] GPS hoạt động trên HTTPS; deny permission có UX.
- [ ] Gửi check-in (text ± ảnh) → pending; không hiện public cho đến khi approve.
- [ ] Admin: login, CRUD region/spot, approve/reject; Rules chặn user sửa `status`.
- [ ] Deploy HTTPS; `.env.example` đầy đủ; README chạy local + deploy.

---

## 7. Prompt “một lần” — đồng bộ sau khi đọc file này

```
Bạn là dev implement Core. Bắt buộc tuân thỏa:
- docs/TREASURE_HUNT_EVENT_PLATFORM.md (F-01–F-10, NF-01–NF-09)
- planning/02-implementation-traceability.md (mục 3–4: collections, Storage paths, routes)

Không tự ý đổi tên collection/path trừ khi cập nhật lại file này (`02-implementation-traceability.md`) và rules. Implement theo thứ tự mục 5 của file này.
```

---

**Liên kết:** Sau bước traceability, dùng `00-master-prompts.md` để review tổng thể; `07-bonus-backlog.md` chỉ khi có phụ lục bonus.
