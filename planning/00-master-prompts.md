# Kế hoạch tổng — Master prompts

**Phạm vi:** Web app sự kiện “truy tìm kho báu”: bản đồ Google Maps (mobile-first), check-in ảnh + comment (duyệt), admin CRUD điểm + moderation, Firebase + Next.js, deploy Firebase Hosting.

**Khởi tạo repo (Day 0):** `planning/01-project-init.md` — scaffold Next.js + Firebase + env; **chạy trước** prompt tổng bên dưới nếu chưa có code.

**Triển khai Core kỹ thuật:** `planning/02-implementation-traceability.md` — ma trận F/NF, tên collection, path Storage, route app, thứ tự sprint; dev **phải** thống nhất với file này trước khi implement `04-frontend-maps` / `05-admin-backend`.

**Mở rộng (tùy hợp đồng):** `planning/07-bonus-backlog.md` — bonus B-01…B-08 và cải thiện mục **6.1** trong `docs/TREASURE_HUNT_EVENT_PLATFORM.md`.

---

## 1. Prompt tạo (Create) — đồng bộ toàn dự án

```
Bạn là tech lead. Đọc theo thứ tự: docs/TREASURE_HUNT_EVENT_PLATFORM.md → `planning/01-project-init.md` nếu repo chưa có khung → `planning/02-implementation-traceability.md` (chuẩn bắt buộc: collections, Storage paths, routes, thứ tự sprint mục 5) → `planning/03–06` cho từng phân hệ (UI → Frontend → Admin → DevOps). Hãy:

1) Liệt kê dependency giữa module (03 UI → 04 Frontend/map → 05 Admin/backend → 06 DevOps); roadmap **không** mâu thuẫn thứ tự sprint trong file `02-implementation-traceability.md`; nếu có phụ lục Plus/Pro, map từng B-xx sang module.
2) Đề xuất cấu trúc thư mục repo Next.js + Firebase (env, rules, `firestore.indexes.json`, Storage rules, functions nếu cần) — **khớp** quy ước mục 3–4 file `02-implementation-traceability.md` trừ khi ghi rõ lý do đổi tên và cập nhật đồng bộ.
3) Checklist khởi tạo: Firebase project (staging/prod), bật API Maps JavaScript, Maps API key + **HTTP referrer restrictions**, biến môi trường (đối chiếu `.env.example` trong **`01-project-init`**).
4) Xác định rủi ro: quota Maps, spam check-in, cold start, Safari geolocation; với bonus: FCM, leaderboard gian lận, PWA cache.
5) **Khu vực & quy mô:** giữ mô hình `regions` + `regionId` trên spot; mở rộng tỉnh/thành không hard-code; clustering + pagination/lazy cho điểm và feed — không cam kết SLA số lượng cứng.
6) **Hiệu năng web:** docs **§3.5** / **NF-09** (code-split Maps, ảnh/font, CWV baseline sau đo).
7) Đầu ra: roadmap **8 ngày** Core (ghi rõ task song song: UI + schema), milestone nghiệm thu theo F-xx; roadmap ngắn bonus chỉ khi hợp đồng có B-xx/Plus/Pro.

Ràng buộc: không triển khai B-xx hoặc Plus/Pro trừ khi có trong hợp đồng; ưu tiên chi phí Firebase và trải nghiệm 4G ngoài trời.
```

---

## 2. Prompt review (Review) — nhất quán & lỗ hổng

```
Review toàn bộ thiết kế và code đã có cho dự án Treasure Hunt Event Platform:

1) Requirements F-01–F-10 và NF-01–NF-09 có được đáp ứng không? Chỉ ra chỗ thiếu (gồm §3.5 hiệu năng web).
2) Nếu phụ lục có B-xx: từng B-xx đã đúng spec và không lộ dữ liệu (leaderboard, export CSV, FCM)?
3) Firestore rules có lỗ hổng (đọc/ghi trái phép, enum status bypass) không?
4) Frontend có lộ secret, gọi API thừa, listener real-time dư thừa không?
5) Admin panel có XSS qua comment/preview ảnh không? Có validate input?
6) DevOps: branch strategy, preview deploy, secrets trên CI.

Đầu ra: bảng issue (Critical / Major / Minor) + đề xuất fix ngắn gọn.
```

---

## 3. Prompt đánh giá (Evaluate) — nghiệm thu

```
Đánh giá khả năng go-live cho sự kiện (mục tiêu **~1.000–2.000 CCU** — đối chiếu docs **NF-02**, đã load test chưa):

1) Checklist nghiệm thu chức năng theo từng F-xx.
2) Đo hiệu năng: FCP/LCP/INP/CLS (hoặc Lighthouse mobile), số request Firestore khi mở popup, kích thước ảnh sau compress; stress theo **quy mô BTC cung cấp** (không bắt buộc một con số điểm/comment cố định).
3) Kiểm tra HTTPS + Geolocation trên iOS Safari & Chrome Android.
4) Kiểm tra luồng: từ chối GPS, mất mạng giữa chừng upload, moderation reject.
5) Tài liệu bàn giao: env, domain, tài khoản Firebase, runbook sự cố.
6) Nếu trong scope: nghiệm thu từng B-xx theo tiêu chí trong planning/07-bonus-backlog.md (mục Prompt đánh giá).

Cho điểm từng nhóm: Pass / Pass có điều kiện / Fail và lý do.
```

---

## 4. Prompt cải thiện (Improve) — sau sự kiện hoặc bản tiếp theo

```
Sau khi có dữ liệu thực tế (log, feedback BTC, metric Firebase/Maps), hãy:

1) Ưu tiên hóa backlog cải thiện (chi phí vs impact), gồm cả mục 6.1 tài liệu và bonus B-xx chưa làm.
2) Đề xuất: App Check, rate limit, EXIF strip, audit moderation, backup; với sản phẩm tiếp theo: gói Plus/Pro trong mục 6.3.
3) Cập nhật docs/TREASURE_HUNT_EVENT_PLATFORM.md và planning/07-bonus-backlog.md nếu scope thay đổi.
4) Chuẩn bị retrospective ngắn (What went well / wrong / next).

Giữ nguyên triết lý: mobile-first, bảo mật dữ liệu, kiểm soát chi phí cloud.
```
