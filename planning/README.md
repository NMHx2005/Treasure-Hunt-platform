# Thư mục kế hoạch dự án

Mục đích: chia nhỏ công việc theo **phân hệ**, mỗi file có **prompt chuẩn** (tạo → review → đánh giá → cải thiện). **Đánh số 00→07** theo thứ tự đọc / triển khai thực tế (không còn lệch “06 trước 01”).

## Thứ tự nên làm

1. **`01-project-init.md`** — Scaffold Next.js + Firebase + env (Day 0); nghiệm thu **Evaluate** trong file này trước khi feature.
2. **`02-implementation-traceability.md`** — **Bắt buộc** trước khi code nghiệp vụ: collections, Storage paths, routes, sprint, DoD.
3. **`03-ui-ux.md`** … **`06-devops-operations.md`** — Theo sprint mục 5 của file `02` (thường: **05 backend** + **04 map** song song một phần → **03** polish → **06** deploy); có thể điều chỉnh theo team.
4. **`00-master-prompts.md`** — Khi cần **một vòng** tech lead: roadmap 8 ngày, dependency, rủi ro (đọc bất kỳ lúc nào, thường sau khi đã có `01` + `02`).
5. **`07-bonus-backlog.md`** — Sau Core hoặc khi có phụ lục Plus/Pro.

### Preflight (đủ để triển khai?)

- [ ] Đã đọc `docs/TREASURE_HUNT_EVENT_PLATFORM.md` (F/NF).
- [ ] Repo pass bước **Evaluate** của `01-project-init`.
- [ ] Đã đọc kỹ `02-implementation-traceability` (mục 3–6) và **không** tự đổi tên collection/path khác file đó.
- [ ] Cả team thống nhất package manager + Next Hosting strategy (ghi trong README; chi tiết deploy ở `06-devops-operations`).
- [ ] Mục tiêu tải **~1.000–2.000 CCU** (docs **NF-02**): đã lên kế hoạch **load test** trước sự kiện và gói Firebase **Blaze** nếu cần.

## Cách dùng từng file

- Copy khối **Prompt tạo** vào AI khi implement; **Prompt review** cho PR; **Prompt đánh giá** nghiệm thu; **Prompt cải thiện** sau UAT/sự kiện.

## Danh sách file (theo số)

| File | Nội dung |
|------|----------|
| `00-master-prompts.md` | Prompt tổng: phạm vi, rủi ro, đồng bộ module |
| `01-project-init.md` | Khởi tạo repo: Next.js + Firebase + env + smoke route |
| `02-implementation-traceability.md` | Ma trận F/NF → prompt, quy ước Firestore/Storage/routes, sprint, DoD |
| `03-ui-ux.md` | Wireframe, user flow, map style Figma, responsive |
| `04-frontend-maps.md` | Maps SDK, GPS, check-in, real-time |
| `05-admin-backend.md` | Firestore, rules, auth admin, CRUD, moderation |
| `06-devops-operations.md` | CI/CD, domain SSL, hiệu năng, vận hành sự kiện |
| `07-bonus-backlog.md` | Bonus B-01…B-08, cải thiện sau Core, gói Plus/Pro |

Sau khi chốt **Core**, dùng `07-bonus-backlog.md` để lên backlog **Plus/Pro** hoặc mục **6.1** trong `docs/TREASURE_HUNT_EVENT_PLATFORM.md`.

## Tham chiếu tài liệu chính

`docs/TREASURE_HUNT_EVENT_PLATFORM.md` (business, requirements, tech, mục 6 bonus).
