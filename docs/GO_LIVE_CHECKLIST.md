# Checklist nghiệm thu & go-live — Treasure Hunt Event Platform

Đối chiếu `planning/00-master-prompts.md` (go-live), `docs/TREASURE_HUNT_EVENT_PLATFORM.md` (F-xx, NF-xx, NF-02 CCU).

**Cách dùng:** BTC / dev tick ☐ → ☐ sau khi hoàn thành; cột **Người ký / Ngày** ghi tay khi bàn giao.

---

## A. Chức năng (F-01–F-10)

| # | Mục | ☐ | Người ký / Ngày |
|---|-----|---|-----------------|
| A1 | F-01: Map có custom style, không lỗi tải Maps | ☐ | |
| A2 | F-02: Cluster khi zoom out | ☐ | |
| A3 | F-03: “Vị trí của tôi” + thông báo khi từ chối GPS | ☐ | |
| A4 | F-04b: Chọn region, spots đúng vùng, bounds/center | ☐ | |
| A5 | F-04/05: Popup/panel tọa độ, ảnh spot + gallery, feed **chỉ approved** | ☐ | |
| A6 | F-06: Check-in chỉ text hoặc text+ảnh; ảnh nén; pending không hiện public | ☐ | |
| A7 | F-07: Admin đăng nhập Email/Password; user không admin không vào CRUD | ☐ | |
| A8 | F-08: CRUD region (center/bounds/order) + CRUD spot + cover + gallery | ☐ | |
| A9 | F-09: Pending hiện admin; Approve → hiện map; Reject → không hiện | ☐ | |
| A10 | F-10: URL HTTPS production; SSL Firebase/custom domain | ☐ | |

---

## B. Hiệu năng & NF-02 (~1k–2k CCU — mục tiêu dự án)

| # | Mục | ☐ | Người ký / Ngày |
|---|-----|---|-----------------|
| B1 | Đo Lighthouse **mobile** `/` và `/map` — ghi LCP/INP/CLS vào `docs/RUNBOOK.md` | ☐ | |
| B2 | Stress/hosting smoke: chạy `scripts/k6/hosting-smoke.js` (xem `docs/PERFORMANCE_AND_LOAD_TEST.md`) với URL staging/production | ☐ | |
| B3 | Quy mô dữ liệu theo **BTC**: số spot / region / comment tối đa ước lượng — đã thử trên staging | ☐ | |
| B4 | Firebase Console: xem Usage (reads/writes) trong buổi rehearsal | ☐ | |
| B5 | Maps + Firebase billing: cảnh báo / hạn mức đã kiểm tra | ☐ | |

---

## C. Thiết bị & mạng

| # | Mục | ☐ | Người ký / Ngày |
|---|-----|---|-----------------|
| C1 | **iOS Safari**: HTTPS, map, GPS allow/deny, check-in + upload ảnh | ☐ | |
| C2 | **Chrome Android**: tương tự C1 | ☐ | |
| C3 | Mất mạng giữa chừng upload: thông báo lỗi + thử lại được (chấp nhận không retry tự động) | ☐ | |

---

## D. Bàn giao & vận hành

| # | Mục | ☐ | Người ký / Ngày |
|---|-----|---|-----------------|
| D1 | `.env` / biến build production đã ghi (không commit secret) — ai giữ bản đầy đủ | ☐ | |
| D2 | Firebase Project ID, owner, 2FA khuyến nghị | ☐ | |
| D3 | Domain + DNS + referrer Maps API key khớp domain | ☐ | |
| D4 | `docs/RUNBOOK.md` đã đọc; liên hệ khi sự cố đã thống nhất | ☐ | |
| D5 | `docs/FIREBASE_SETUP.md` — Auth Anonymous + admin `admins/{uid}` đã cấu hình | ☐ | |

---

## E. Phụ lục B-xx (chỉ khi hợp đồng có)

| # | Mục | ☐ | Người ký / Ngày |
|---|-----|---|-----------------|
| E1 | Các B-xx đã ký đã nghiệm thu theo `planning/07-bonus-backlog.md` | ☐ | N/A nếu không có |

---

## Quyết định go-live (tổng)

| Tiêu chí | Pass / Pass có điều kiện / Fail |
|----------|----------------------------------|
| **Chức năng (A)** | |
| **Hiệu năng & tải (B)** | |
| **Thiết bị (C)** | |
| **Bàn giao (D)** | |
| **B-xx (E)** | |

**Chữ ký BTC (ghi rõ họ tên):** _________________________ **Ngày:** __________  

**Chữ ký kỹ thuật:** _________________________ **Ngày:** __________  

---

*Sau sự kiện: cập nhật RUNBOOK (Lighthouse, số liệu Usage) và rút kinh nghiệm NF-02.*
