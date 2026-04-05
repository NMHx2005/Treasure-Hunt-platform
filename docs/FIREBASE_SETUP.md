# Hướng dẫn: Firebase, `.env`, Auth, Admin, Deploy

Tài liệu này mô tả từng bước cấu hình môi trường cho **Treasure Hunt Event Platform** (Next.js + Firebase + Google Maps), khớp `README.md` và `planning/02-implementation-traceability.md`.

---

## 1. Điền `.env` (Firebase + Google Maps)

### 1.1 Tạo / chọn project Firebase

1. Vào [Firebase Console](https://console.firebase.google.com/).
2. **Add project** (hoặc chọn project **staging** đã có).
3. Bật các sản phẩm (nếu chưa):
   - **Authentication**
   - **Firestore Database** (chế độ production, chọn region gần người dùng — ví dụ `asia-southeast1`).
   - **Storage** (cùng region với Firestore nếu được gợi ý).

### 1.2 Đăng ký app Web và lấy cấu hình client

1. Trong project Firebase: biểu tượng **Web** (`</>`) → đặt tên app (ví dụ `treasure-hunt-web`) → **Register app** (không bắt buộc bật Hosting ở bước này).
2. Firebase hiển thị object `firebaseConfig` gồm các key: `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`.

### 1.3 Tạo file `.env` từ `.env.example`

Trong thư mục root repo:

```bash
cp .env.example .env
```

Điền **từng dòng** (không có dấu ngoặc kép thừa, không commit file `.env`):

| Biến | Lấy ở đâu |
|------|-----------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `apiKey` trong firebaseConfig |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain` (thường dạng `PROJECT_ID.firebaseapp.com`) |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `projectId` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `storageBucket` (thường dạng `PROJECT_ID.firebasestorage.app` hoặc `.appspot.com`) |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `appId` |

Các biến `NEXT_PUBLIC_*` được đưa vào bundle client — đây là **cấu hình web công khai** theo thiết kế Firebase Web; **không** đặt service account JSON hay private key vào đây.

### 1.4 Google Maps — `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

1. Vào [Google Cloud Console](https://console.cloud.google.com/) → chọn **cùng project** được liên kết với Firebase (hoặc project chứa billing cho Maps — thường là project Firebase).
2. **APIs & Services** → **Enabled APIs** → **+ ENABLE APIS AND SERVICES** → tìm và bật **Maps JavaScript API**.
3. **APIs & Services** → **Credentials** → **Create credentials** → **API key**.
4. Giới hạn key (khuyến nghị trước khi public):
   - **Application restrictions**: *HTTP referrers (web sites)* — thêm `http://localhost:3000/*`, domain production (ví dụ `https://your-domain.web.app/*`).
   - **API restrictions**: chỉ chọn **Maps JavaScript API** (và các API Maps khác nếu sau này dùng thêm).
5. Copy key vào `.env`:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...your-key...
```

6. Khởi động lại `npm run dev` sau khi sửa `.env`.

#### Deploy Hosting mà map báo “Thiếu NEXT_PUBLIC_GOOGLE_MAPS_API_KEY”

Các biến `NEXT_PUBLIC_*` được **ghép vào bundle lúc `next build`**. Trang production **không đọc** file `.env` trên máy người xem — nếu bản build thiếu key thì Hosting vẫn báo thiếu.

**Cách xử lý:**

1. **Luôn deploy từ máy có file `.env` đầy đủ** trong **thư mục gốc repo** (cùng cấp `package.json`), rồi chạy `firebase deploy` (hoặc `npx firebase deploy --only hosting`). Repo đã cấu hình `next.config.ts` để nạp `.env` / `.env.production` sớm khi build; sau khi cập nhật code, chạy lại deploy.
2. **Firebase CLI** (luồng Next) còn có thể merge file **`.env.<PROJECT_ID>`** (ví dụ `.env.treasure-hunt-staging-7e873` nếu trùng Project ID trong `.firebaserc`) vào môi trường khi build — có thể tạo file này **copy nội dung `NEXT_PUBLIC_*` từ `.env`** nếu build vẫn thiếu biến.
3. Trước khi deploy, kiểm tra local: `npm run build` xong tìm trong thư mục `.next` chuỗi `NEXT_PUBLIC_GOOGLE` hoặc mở bản production (`npm run start`) xem map có lên không.
4. **Không** kỳ vọng máy khác / CI pull git rồi deploy **tự có** `.env` — file đó thường **gitignore**; cần copy `.env` hoặc đặt biến môi trường trên máy build / trong cấu hình CI.

### 1.5 Tại sao phải vào Google Cloud? Sao không “tạo project mới”? Billing bị lẫn?

**Firebase và Google Cloud dùng chung một project**

- Mỗi project trên [Firebase Console](https://console.firebase.google.com/) **chính là** một project trên [Google Cloud Console](https://console.cloud.google.com/) — cùng **Project ID** (ví dụ `my-app-staging`).
- Việc bật **Maps JavaScript API** và tạo **API key** nằm ở GCP vì đó là dịch vụ Google Maps Platform; Firebase Console không có màn hình đầy đủ cho Maps API.

**Bạn không cần (và không nên) tạo project Google Cloud “mới” riêng** cho Maps nếu mục tiêu là map cùng app Firebase:

1. Mở [Google Cloud Console](https://console.cloud.google.com/).
2. Ở **thanh trên cùng**, bấm vào **tên project** (dropdown) → tìm và chọn **đúng Project ID** trùng với Firebase (xem Firebase → **Project settings** → **Project ID**).
3. Sau khi project đúng, mới vào **APIs & Services** → bật **Maps JavaScript API** và tạo key như mục 1.4.

**Nếu giao diện cứ đưa bạn vào “Create project”**

- Thường do bạn **chưa chọn project** trong dropdown hoặc đăng nhập **nhầm tài khoản Google** khác với tài khoản tạo project Firebase.  
  *(Lưu ý: chữ **“No organization”** cạnh tên project là **bình thường** với nhiều project cá nhân / Firebase — **không** có nghĩa là project sai.)*
- Cách nhanh: trong **Firebase Console** → **Project settings** → tìm liên kết **Open in Google Cloud Console** / **Google Cloud Platform** (nếu có) — nó mở GCP **đã gắn sẵn** đúng project.

**Thanh toán (billing) — không phải “tạo project Firebase mới”**

- Google Maps Platform (Maps JavaScript API) **yêu cầu** project GCP có **gắn Billing account** (thẻ/thông tin thanh toán). Đó là **gắn billing vào project hiện có**, không phải tạo app Firebase mới.
- Google có **hạn mức miễn phí / credit hàng tháng** cho Maps (chi tiết và điều khoản xem [Google Maps Platform pricing](https://developers.google.com/maps/billing-and-pricing/pricing)); vẫn cần bước “Enable billing” trên project.
- Nếu màn hình billing nhìn giống “tạo mới”, đọc kỹ tiêu đề: thường là **Link a billing account** hoặc **Manage billing accounts** cho **project đã chọn** — kiểm tra lại project ở thanh trên cùng trước khi bấm tiếp.

**Nếu chính sách tổ chức / trường học không cho bật billing cá nhân**

- Cần **billing account** do admin tổ chức tạo và gán quyền cho project của bạn, hoặc dùng project GCP trong cùng **Organization** do công ty quản lý.

### 1.6 Ấn Độ: popup “Set up account to enable Maps API” và chuyện Organization

Nếu tài khoản/billing của bạn thuộc **Ấn Độ**, khi bấm **Enable** cho **Maps JavaScript API** Google có thể hiện popup kiểu:

> *Because Google Maps Platform services are billed separately from Google Cloud services in India, you'll have to set up a Maps billing account… After setup, you can use Maps APIs for **any existing apps and sites**…*

**Ý chính:**

1. **Không phải vì “No organization” nên không link được Firebase**  
   Project hiển thị `treasure-hunt-staging` trong **No organization** vẫn là **đúng project** Firebase/GCP của bạn. “No organization” chỉ nghĩa project chưa nằm dưới một **Google Cloud Organization** (tài nguyên quản trị cấp cao hơn project) — rất phổ biến với project cá nhân.

2. **Popup là về Maps billing (Ấn Độ), không phải “tạo project mới” thay thế**  
   Ở Ấn Độ, Google **tách hóa đơn / luồng billing** của Maps Platform khới các dịch vụ Cloud khác. Bấm **Set up** thường là để **mở / liên kết một Maps billing account** theo đúng quy định thị trường — câu *existing apps and sites* nghĩa là sau đó bạn vẫn dùng Maps cho **ứng dụng hiện tại** (cùng project đang chọn), chứ không hàm ý phải đổi sang một Firebase project khác.

3. **Sao lại bắt chọn / tạo Organization?**  
   Một số bước onboarding Maps + billing (nhất là khi Google yêu cầu org) là **quy tắc phía Google** cho billing hoặc quản trị tài khoản. **Organization** ở đây là **lớp quản trị & billing** trong GCP, **khác** với **Project ID** (`treasure-hunt-staging`). Sau khi hoàn tất, bạn vẫn quay lại **đúng project** đó để bật API và tạo API key — nên kiểm tra lại thanh project trên cùng sau mỗi bước.

4. **Nếu wizard không cho “không dùng organization”**  
   Đó có thể là giới hạn của luồng Ấn Độ hiện tại: bạn có thể phải **tạo Organization** theo hướng dẫn trong popup (link **Learn more**) hoặc **chuyển project vào Organization** (Google có tài liệu *migrating projects* sang org — vẫn là **cùng một project**, chỉ thay đổi chỗ “thuộc về” trong cây resource). Trường hợp công ty: nên dùng **Organization do doanh nghiệp** quản lý và nhờ admin billing gán quyền.

5. **Khi nào cần hỗ trợ Google**  
   Nếu không hoàn tất được bước Set up (bị kẹt org, billing, hoặc không khớp project), nên mở ticket **Google Cloud Billing / Maps Platform support** kèm Project ID `treasure-hunt-staging` và mô tả đúng popup Ấn Độ.

### 1.7 Wizard “Create new billing account and project” (3 bước — bước 3: Create project)

Khi bấm **Set up** / **Enable** Maps, Google đôi khi mở wizard **Create new billing account and project** với các bước kiểu: (1) Create billing account → (2) Payment profile → (3) **Create project**. URL thường có `maps-backend.googleapis.com`.

**Vì sao không nên Next hết luồng này nếu mục tiêu chỉ dùng project Firebase cũ**

- Bước 3 **Create project** thường tạo **một GCP project mới** gắn với billing vừa tạo — **không** thay thế cho việc gắn billing vào `treasure-hunt-staging` trừ khi bước cuối có tùy chọn rõ ràng “chọn project có sẵn” (thường không có).
- Dropdown **Organization** (ví dụ `xxx-org`) trong bước 1 là **ngữ cảnh của billing account / tổ chức**, khác với chuyện project cũ đang **No organization** — không tự giải thích là project Firebase sẽ “nhảy” vào org.

**Cách làm chuẩn hơn**

1. Bấm **Cancel** để thoát wizard.
2. Kiểm tra billing cho đúng app:
   - [Billing → Your projects](https://console.cloud.google.com/billing/projects) (hoặc **Billing** → tab quản lý project).
   - Xác nhận **`treasure-hunt-staging`** đã gắn **một** billing account (ví dụ *My Billing Account*). Nếu **chưa**: dùng **Actions** (⋮) trên dòng project → **Change billing** → chọn account.
3. Nếu Maps yêu cầu **Maps billing** tách biệt (bạn đã có *My Maps Billing Account* ở project khác):
   - Cùng trang **Your projects** → chọn dòng **`treasure-hunt-staging`** → **Change billing** → chọn **My Maps Billing Account** (hoặc account Maps phù hợp), **không** cần tạo project mới.
4. Chọn **đúng project** `treasure-hunt-staging` ở thanh trên cùng → **APIs & Services** → **Library** → **Maps JavaScript API** → **Enable** (không đi qua shortcut “create project” nếu đã link billing đủ).
5. **Credentials** → tạo **API key** → restrict → copy vào `.env` (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`).

**Khi nào mới “Next” trong wizard?** Chỉ khi bạn **chủ đích** tạo billing account mới **và** chấp nhận đọc kỹ bước 3 (tránh tạo project trùng tên với app chính). Nếu không chắc, ưu tiên luồng **Cancel → Billing → Change billing trên project cũ → Enable API**.

---

## 2. Bật Anonymous (Authentication) cho check-in public

Ứng dụng map gọi `signInAnonymously` để user có `uid` khi tạo document `checkIns` và upload Storage theo rules.

1. Firebase Console → **Build** → **Authentication** → tab **Sign-in method**.
2. Trong **Providers**, mở **Anonymous** → bật **Enable** → **Save**.

Nếu Anonymous tắt, check-in / upload có thể lỗi permission hoặc auth.

---

## 3. Tạo user admin (email/password) và document `admins/{uid}`

Quy ước trong `firestore.rules`: user chỉ là admin nếu tồn tại document `admins/{uid}` với `uid` trùng **User UID** trong Firebase Authentication.

### 3.1 Tạo tài khoản Email/Password

1. **Authentication** → **Users** → **Add user**.
2. Nhập **Email** và **Password** (mật khẩu mạnh; lưu an toàn — không commit vào git).
3. Sau khi tạo, mở user đó và **sao chép UID** (chuỗi dài, ví dụ `AbCdEf123...`).

Hoặc đăng ký qua tab **Sign-in method** → bật **Email/Password**, rồi tự đăng ký lần đầu từ app (nếu đã có flow); UID lấy từ Console như trên.

### 3.2 Tạo document Firestore `admins/{uid}`

1. **Firestore Database** → **Start collection** (hoặc thêm document vào collection có sẵn).
2. **Collection ID**: `admins` (đúng chữ, số nhiều).
3. **Document ID**: dán **chính xác UID** vừa copy (không dùng auto-ID).
4. Có thể để document **trống** `{}` hoặc thêm field phụ (ví dụ `email`, `createdAt`) — rules hiện tại chỉ kiểm tra `exists(...)`.

Sau bước này, đăng nhập tại `/admin/login` bằng email/password vừa tạo sẽ được phép vào các route `/admin/*`.

---

## 4. Firebase CLI: liên kết project và deploy

Cài CLI (nếu chưa): `npm install -g firebase-tools` hoặc dùng `npx firebase`.

### 4.1 Đăng nhập và chọn project

```bash
firebase login
cd /path/to/repo
firebase use --add
```

Chọn project Firebase (staging), đặt alias ví dụ `staging`. File `.firebaserc` sẽ được tạo/cập nhật (nên commit `.firebaserc` nếu team thống nhất alias).

### 4.2 Deploy **Firestore rules** và **indexes**

Từ root repo (nơi có `firebase.json`, `firestore.rules`, `firestore.indexes.json`):

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

- **Rules**: áp dụng ngay cho Firestore.
- **Indexes**: các index composite trong `firestore.indexes.json` có thể ở trạng thái *building* vài phút; xem tab **Firestore → Indexes** trong Console.

### 4.3 Deploy **Storage rules**

```bash
firebase deploy --only storage
```

### 4.4 Deploy **Hosting** (Next.js — F-10, khi sẵn sàng)

Hosting trong `firebase.json` dùng `"source": "."` (Web Frameworks + Next.js). Cần:

1. Bật experiment (một lần trên máy):

```bash
firebase experiments:enable webframeworks
```

2. Đảm bảo Blaze billing nếu Firebase yêu cầu cho chức năng Hosting kết hợp framework (theo [tài liệu Firebase Hosting cho Next.js](https://firebase.google.com/docs/hosting/frameworks/nextjs)).

3. Deploy:

```bash
firebase deploy --only hosting
```

Hoặc gom một lần (ví dụ trước sự kiện):

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage,hosting
```

### 4.5 Kiểm tra sau deploy

- Mở URL Hosting (Console → **Hosting**).
- Xác nhận HTTPS (SSL do Firebase/Google).
- Test `/map` (Maps + Firestore) và `/admin/login` trên domain thật; cập nhật **HTTP referrer** của Maps API key cho domain production.

---

## 5. Checklist nhanh

- [ ] `.env` đủ biến Firebase + `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `npm run dev` chạy được.
- [ ] Maps JavaScript API đã bật; key có referrer phù hợp.
- [ ] Anonymous đã bật trong Authentication.
- [ ] User admin + document `admins/{uid}` đúng UID.
- [ ] `firebase deploy` rules + indexes (+ storage); Hosting khi đủ điều kiện F-10.

---

## Tham chiếu nội bộ

- Quy ước collection/path: `planning/02-implementation-traceability.md`
- Yêu cầu nghiệp vụ: `docs/TREASURE_HUNT_EVENT_PLATFORM.md`
