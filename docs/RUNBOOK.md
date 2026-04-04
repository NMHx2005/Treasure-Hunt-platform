# Runbook vận hành — Treasure Hunt Event Platform

Một trang tham chiếu nhanh khi sự kiện / production gặp sự cố. Đối chiếu `planning/06-devops-operations.md`.

---

## Thông tin cần có sẵn (bàn giao)

| Mục | Ghi chú |
|-----|--------|
| **Firebase Project ID** | Ví dụ `treasure-hunt-staging-7e873` — xem Console → Project settings |
| **Hosting URL** | `https://<project-id>.web.app` hoặc custom domain |
| **Domain / DNS** | Nhà cung cấp domain; bản ghi trỏ theo Firebase Hosting |
| **Billing** | Firebase Blaze, Google Maps billing — tài khoản thanh toán & người liên hệ |
| **GitHub repo** | Remote code; branch `main` = deploy tự động (nếu đã bật Actions) |
| **Maps API key** | GCP Credentials; HTTP referrer khớp domain production |

---

## Liên hệ khi sự cố

1. **Owner Firebase / GCP:** người có quyền Owner trên project (Console → IAM). Khuyến nghị **2FA** cho tài khoản Google.
2. **GitHub:** maintainer repo để xem Actions, rollback commit, cập nhật secrets.
3. **BTC sự kiện:** hotline / nhóm chat nội bộ để thông báo người chơi khi downtime kéo dài.

---

## Map không tải / lỗi Google Maps

| Triệu chứng | Việc làm |
|-------------|----------|
| Console trình duyệt: API key / RefererNotAllowedMapError | GCP → Credentials → API key → **Application restrictions** → thêm referrer `https://<domain>/*` |
| Billing Maps tắt hoặc hết hạn mức | Kiểm tra billing Maps Platform, email cảnh báo Google |
| Lỗi chung “can’t load Maps” | Thử mạng khác; xem [Google Maps Platform status](https://status.cloud.google.com/maps-platform/products/i3CZYPyLB1zevsm2AV6M/history) |

HTTPS bắt buộc cho Geolocation — Hosting Firebase đã có SSL.

---

## Firestore / Storage / quota

| Triệu chứng | Việc làm |
|-------------|----------|
| Writes/reads từ chối, quota | Firebase Console → Usage; nâng plan Blaze; giảm listener/query nếu có spike |
| Rules permission-denied | Kiểm tra deploy rules gần nhất: `firebase deploy --only firestore:rules,storage` |
| Index thiếu | Console → Firestore → Indexes hoặc deploy `firestore.indexes.json` |

Mục tiêu tải **~1.000–2.000 CCU** (NF-02): cần load test staging + giám sát ngày sự kiện; không có SLA cứng nếu chưa đo.

---

## Deploy & rollback

### Deploy tay (máy local)

```bash
cd /path/to/repo
npx firebase experiments:enable webframeworks   # một lần trên máy
npx firebase deploy --only hosting              # hoặc gom rules + hosting
```

Rules / indexes / storage:

```bash
npx firebase deploy --only firestore:rules,firestore:indexes,storage
```

### CI (GitHub Actions)

- Push `main` → workflow **CI & Deploy Hosting** (lint → build → deploy).
- **Secrets** không được in ra log; nếu job fail, xem tab Actions → bước lỗi (không mở raw secret).
- Lỗi **`Failed to authenticate, have you run firebase login?`** trên runner: **chưa có** hoặc **sai** secret `FIREBASE_TOKEN`. Tạo token: `npx firebase login:ci` trên máy local → thêm secret `FIREBASE_TOKEN` trong GitHub (Repository secrets, không phải Environment nếu workflow không gắn environment). Chi tiết từng bước: `README.md` mục GitHub Actions.

### Rollback nhanh

1. **Git:** `git revert <commit>` rồi push `main` → CI deploy bản trước (nếu CI bật).
2. **Firebase Console:** Hosting → **Release history** → chọn bản cũ → **Rollback**.
3. **Chỉ rules:** deploy lại file `firestore.rules` / `storage.rules` từ commit đã biết an toàn.

---

## Hiệu năng & Lighthouse (NF-09 / §3.5)

Sau mỗi release production nên:

1. Chạy **Lighthouse (mobile)** trên URL thật (Chrome DevTools hoặc PageSpeed Insights).
2. Ghi lại **LCP, INP, CLS** vào bảng dưới (cập nhật tay).

| Ngày | URL | LCP | INP | CLS | Ghi chú |
|------|-----|-----|-----|-----|--------|
| _ví dụ 2026-04-05_ | …web.app | — | — | — | baseline |

Bundle budget trên CI: tùy chọn (chưa bật mặc định).

---

## Preview trước production

- Workflow **Hosting preview (PR)** tạo channel `pr-<số>` (hết hạn 7 ngày) cho PR **trong cùng repo** (không chạy trên fork để tránh lộ secret).
- URL preview xem trong log job **Deploy preview channel** trên GitHub Actions.

---

## Staging vs production

- Hiện `.firebaserc` trong repo có thể trỏ **một** project (thường staging).
- Production riêng: tạo project Firebase thứ hai, thêm alias trong `.firebaserc`, workflow tách bằng branch hoặc environment secrets — mở rộng theo nhu cầu hợp đồng.

---

## Sau sự kiện (cải tiến)

- Thu thập peak concurrent, reads/writes Firestore, egress Storage.
- Tối ưu CI cache; cân nhắc load test k6 cho lần sau.
- Cập nhật bảng Lighthouse và runbook này với số liệu thực tế.
