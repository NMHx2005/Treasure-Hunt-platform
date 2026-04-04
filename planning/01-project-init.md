# Khởi tạo dự án (Day 0) — `01-project-init`

**Mục đích:** prompt dùng **một lần** (hoặc lặp khi reset repo) để tạo khung codebase + Firebase + biến môi trường, **trước** các module nghiệp vụ `03`–`06` (sau `02-implementation-traceability`).

**Tham chiếu:** `docs/TREASURE_HUNT_EVENT_PLATFORM.md` (stack §3.1, bảo mật §3.4, hiệu năng §3.5).

---

## 1. Prompt tạo (Create) — khởi tạo repo & công cụ

```
Bạn là dev đang khởi tạo repo cho "Treasure Hunt Event Platform" (Next.js + Firebase + Google Maps).

**Mặc định dự án:** Next.js **App Router** + **TypeScript** + ESLint; cấu trúc gợi ý `src/app/`, `src/components/`, `src/lib/`, `src/types/`. (Chỉ dùng Pages Router nếu team ghi rõ lý do trong README.)

Thực hiện / hướng dẫn từng bước có thể lặp lại:

1) **Tạo app:** `create-next-app` (tuỳ phiên bản hiện tại), bật TS + ESLint; ghi **Node** khuyến nghị (vd. 20 LTS) trong README hoặc `.nvmrc` tùy chọn.
2) **Firebase CLI:** `firebase login`, `firebase init` — chọn project **staging**; bật **Hosting**, **Firestore**, **Storage**; tạo `firestore.rules`, `storage.rules`, `firebase.json`; thêm `firestore.indexes.json` (có thể rỗng `{}`/mảng rỗng — index chi tiết sẽ bổ sung ở `05-admin-backend`). Thư mục config ở **root** hoặc `firebase/` — chọn một và ghi trong README.
3) **Env:** file `.env.example` (không commit `.env`): ít nhất `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, và `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (hoặc tên team thống nhất). Ghi chú: Maps key bật **Maps JavaScript API** + **HTTP referrer restrictions** khi lên production.
4) **Git:** `.gitignore` gồm `.env`, `.firebase`, `node_modules`, `.next`, `*.log`; README: một package manager (`npm` hoặc `pnpm`) — lệnh `install`, `dev`, `build`; tùy chọn `firebase emulators:start` để test rules local.
5) **SDK client:** cài `firebase` (modular v9+), file `src/lib/firebase.ts` khởi tạo `getApp`/`initializeApp` chỉ từ biến `NEXT_PUBLIC_*` (không đưa service account / private key vào client).
6) **Smoke routes:** `src/app/page.tsx` placeholder + `src/app/map/page.tsx` trống hoặc text “Map sẽ dynamic import” — đủ để `next build` pass.
7) **Hiệu năng:** README một dòng: Google Maps sẽ **dynamic import** trong module `04-frontend-maps` (đối chiếu docs §3.5).

**Sau bước này:** không triển khai F-01–F-10; chỉ **khung** + kết nối được Firebase staging khi copy `.env` từ console. Bước tiếp theo bắt buộc: đọc **`planning/02-implementation-traceability.md`** rồi mới code schema/feature.

Đầu ra: lệnh đã chạy + diff + checklist từng mục (1→7) đã xong hay chưa.
```

---

## 2. Prompt review (Review) — sau khi khởi tạo

```
Review repo vừa bootstrap cho Treasure Hunt Event Platform:

1) Secret có lọt vào git không (.env committed)?
2) `firebase.json` và rules có path đúng không?
3) Firebase config client có gọi được từ browser không (không dùng private key server trong client)?
4) Next.js version và lockfile có nhất quán không?
5) README có đủ cho dev mới clone trong 15 phút không?

Đầu ra: danh sách fix bắt buộc trước khi merge nhánh init.
```

---

## 3. Prompt đánh giá (Evaluate) — nghiệm thu khung dự án

```
Checklist "khung sẵn sàng" trước khi code feature:

1) `npm run build` (hoặc `pnpm build` / `yarn build` tương ứng README) pass — không lỗi TypeScript/ESLint blocking.
2) Lệnh `dev` mở được `/` và route map placeholder.
3) Firebase project staging: deploy Hosting thử **hoặc** emulator chạy được Firestore + Storage rules tối thiểu (allow deny test).
4) `.env.example` đầy đủ key cần thiết; tài liệu chỗ lấy Maps key + bật API Maps JavaScript.
5) Branch `main` (hoặc `develop`) có tag/commit rõ "chore: initial project setup".

Pass / Fail và việc còn thiếu.
```

---

## 4. Prompt cải thiện (Improve) — sau vài tuần

```
Repo đã có code feature; xem lại phần init:

1) Có nên tách `apps/web` trong monorepo không? (chỉ nếu team lớn)
2) CI: thêm job `npm run build` + lint trên PR từ đầu.
3) Firebase: staging vs production project — document rõ trong README.
4) Cập nhật `01-project-init.md` nếu quy trình thay đổi (để lần sau clone đúng).

Không refactor lớn trừ khi có lý do.
```

---

**Tiếp theo:** sau khi Pass mục **3**, đọc **`planning/02-implementation-traceability.md`**, rồi chuyển sang `05-admin-backend.md` (schema/rules) và/hoặc `03-ui-ux.md` tùy team.
