# Treasure Hunt Event Platform

Next.js (App Router) + TypeScript + Firebase + Google Maps. Chuẩn kỹ thuật: `planning/02-implementation-traceability.md` (collections `regions` / `spots` / `checkIns`, Storage paths, routes) và `docs/TREASURE_HUNT_EVENT_PLATFORM.md` (F-xx / NF-xx).

## Routes

| Đường dẫn | Vai trò |
|-----------|---------|
| `/` | Landing, liên kết map + admin |
| `/map` | Bản đồ public (F-01–F-06): cluster, popup, feed `approved`, form check-in `pending` |
| `/admin/login` | F-07 — Email/Password |
| `/admin/regions`, `/admin/spots`, `/admin/moderation` | CRUD khu vực/điểm (F-08), duyệt (F-09) |

## Dữ liệu & quyền (tóm tắt)

- **Firestore:** `regions`, `spots`, `checkIns` — field tối thiểu xem `src/types/models.ts` và mục 3.1 file traceability.
- **Storage:** `spots/{spotId}/cover.jpg`, `checkIns/{checkInId}/photo.jpg` (luồng: tạo doc `checkIns` trước, rồi upload — đúng §3.3).
- **Admin:** collection `admins/{uid}` (cách A trong §3.4). Tạo user **Authentication** (email/password), rồi thêm document `admins/{uid}` (uid khớp user) — sau đó đăng nhập `/admin/login`.
- **Người chơi:** bật **Anonymous** trong Firebase Authentication để check-in và upload ảnh đúng rules.
- Deploy rules + indexes: `firebase deploy --only firestore:rules,firestore:indexes,storage` (sau khi `firebase use` project staging).

## Yêu cầu môi trường

- **Node.js:** khuyến nghị **20 LTS** (xem `.nvmrc` nếu dùng nvm).

## Quick start (~15 phút)

1. Clone repo và vào thư mục dự án.
2. `nvm use` (tuỳ chọn, nếu dùng nvm) hoặc đảm bảo Node ≥ 20.
3. `npm install`
4. `cp .env.example .env` rồi điền giá trị từ Firebase Console (và Maps key nếu cần test map sau này).
5. `npm run dev` — mở [http://localhost:3000](http://localhost:3000). Thử `/`, `/map`, `/admin/login` (cần tài khoản admin + `admins/{uid}` như trên).

## Package manager

Dự án dùng **npm**.

```bash
npm install
npm run dev
npm run build
```

Tuỳ chọn — test Firestore/Storage rules local (CLI đã có qua `firebase-tools` trong repo). Lần đầu trên máy, nếu gặp lỗi *web framework* khi chạy emulator, bật experiment: `npx firebase experiments:enable webframeworks` (cần vì `firebase.json` dùng Hosting + Next.js `source`).

```bash
npm run emulators
```

## GitHub Actions (CI/CD)

- **Workflow:** [`.github/workflows/ci-deploy.yml`](.github/workflows/ci-deploy.yml) — mọi **pull request** và **push** chạy `lint` + `build`; chỉ **push lên `main`** mới **deploy Firebase Hosting** (Web Frameworks + Next.js).
- **Preview PR:** [`.github/workflows/hosting-preview.yml`](.github/workflows/hosting-preview.yml) — deploy channel `pr-<số>` (7 ngày) cho PR **trong cùng repo** (không chạy trên fork).
- **Secrets** (Repository → *Settings* → *Secrets and variables* → *Actions* → *New repository secret*), **không** commit vào git:
  - **`FIREBASE_TOKEN`** (bắt buộc để deploy từ CI — nếu thiếu sẽ lỗi *Failed to authenticate*):
    1. Trên máy đã đăng nhập Firebase (`firebase login`), chạy: `npx firebase login:ci`
    2. Mở link, chọn tài khoản Google có quyền project Firebase
    3. Sao chép **token** in ra terminal (một chuỗi dài)
    4. GitHub → repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret** → Name: `FIREBASE_TOKEN` → Secret: dán token → **Add secret**
    5. Push lại `main` hoặc **Re-run jobs** trong tab Actions
  - Cùng bộ `NEXT_PUBLIC_*` như `.env.example` (Firebase + Google Maps) để bản build trên CI có đủ cấu hình client.
- Deploy fail nếu thiếu secret — xem log tab **Actions** (GitHub không in giá trị secret).
- **Runbook** vận hành, rollback, Lighthouse: [`docs/RUNBOOK.md`](docs/RUNBOOK.md).

## Cấu hình Firebase

- **Hướng dẫn chi tiết từng bước:** [`docs/FIREBASE_SETUP.md`](docs/FIREBASE_SETUP.md) (điền `.env`, Anonymous auth, `admins/{uid}`, `firebase deploy`).
- File cấu hình Firebase nằm ở **root** repo: `firebase.json`, `firestore.rules`, `storage.rules`, `firestore.indexes.json`.
- Liên kết project **staging** sau khi cài CLI: `firebase login`, rồi `firebase use --add` và chọn project staging. Deploy Next.js lên Hosting cần bật Web Frameworks trên Firebase CLI (`firebase experiments:enable webframeworks`) — xem [tài liệu Firebase](https://firebase.google.com/docs/hosting/frameworks/nextjs).
- Biến môi trường: sao chép `.env.example` → `.env` và điền giá trị từ Firebase Console (Project settings). Không commit `.env`.
- Client SDK chỉ dùng biến `NEXT_PUBLIC_*` — không đưa service account hoặc private key vào client (xem `src/lib/firebase.ts`).

## Google Maps (hiệu năng)

Google Maps sẽ được **dynamic import** trong module maps (`planning/04-frontend-maps`, đối chiếu tài liệu dự án **§3.5**). API key: bật **Maps JavaScript API**; trên production dùng **HTTP referrer restrictions**.

## Cấu trúc gợi ý

- `src/app/` — routes App Router  
- `src/components/` — UI  
- `src/lib/` — helpers, Firebase init  
- `src/types/` — TypeScript types  

Chỉ dùng Pages Router nếu team ghi rõ lý do trong README (hiện tại: App Router).
