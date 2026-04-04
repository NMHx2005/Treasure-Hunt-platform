# Kế hoạch: Frontend & bản đồ — `04-frontend-maps`

**Stack:** Next.js/React, Google Maps JS API, clustering, custom style, Geolocation, nén ảnh client, Firestore real-time (đọc đã duyệt). **Khu vực:** đa `region` mở rộng (không cố định thành phố). **Hiệu năng:** đối chiếu `docs/...` **§3.5** & **NF-07–NF-09** (không gắn số lượng điểm/comment cứng).

---

## 1. Prompt tạo (Create)

```
Implement frontend cho Treasure Hunt Event Platform:

1) Tích hợp Google Maps: render map, áp dụng custom style từ design, clustering khi zoom out.
2) Nút "Vị trí của tôi": watchPosition hoặc getCurrentPosition; UX khi user deny permission; fallback hướng dẫn bật quyền.
3) Load spots lọc theo **region** đang chọn (danh sách khu vực do dữ liệu/admin định nghĩa — **có thể thêm tỉnh/thành bất kỳ**); render markers; click mở popup; center/bounds mặc định theo metadata region nếu có.
4) Popup: **tọa độ** + ảnh minh họa/gallery điểm (nếu có) + luồng ảnh & text đã approved; subscribe/query tối thiểu; **pagination / cursor / lazy / virtual list** tùy quy mô thực tế (NF-08 — không giả định số comment cố định).
5) Form check-in: **cho phép chỉ text** hoặc **text + ảnh** (ảnh không bắt buộc); nén/resize ảnh trên browser trước khi upload Storage; giới hạn kích thước rõ ràng.
6) Xử lý lỗi mạng khi upload; hiển thị trạng thái pending sau khi gửi.
7) **Quy ước dữ liệu:** bắt buộc khớp `planning/02-implementation-traceability.md` (mục 3–4): collections `regions`, `spots`, `checkIns`; query spots theo `regionId`; query feed theo `spotId` + `status=='approved'` + `orderBy(createdAt desc)` + `limit`.
8) **Clustering:** dùng thư viện chính thức (`@googlemaps/markerclusterer` hoặc API tương đương được Google khuyến nghị) — không tự viết cluster na ná nếu tránh được.
9) **Upload ảnh check-in:** thống nhất **một** luồng với Firestore Rules (ví dụ: tạo doc `checkIns` `pending` trước → upload Storage path `checkIns/{id}/...` → cập nhật `imageUrl`) — mô tả trong PR nếu lệch **mục 3.1–3.3** file `02-implementation-traceability.md`.
10) **Routes:** `/map` (public), tách `/admin/*` (không nhét admin vào cùng bundle map nếu có thể code-split).

Ràng buộc: tối ưu số request/listener; không bundle secret server-side vào client sai cách; tuân thủ HTTPS cho GPS. Áp dụng **§3.5**: lazy load Maps bundle, ảnh lazy, giảm re-render; đo Lighthouse mobile sau mốc quan trọng.
```

---

## 2. Prompt review (Review)

```
Code review frontend & maps:

1) API key Maps: restrictions (HTTP referrer), không commit key thật vào git.
2) Clustering: performance theo **stress test với số điểm BTC dự kiến** (không coi một con số là chuẩn cố định); có cleanup listener/map on unmount?
3) Geolocation: xử lý insecure context, timeout, error codes.
4) Image pipeline: MIME validation, kích thước tối đa, memory spike trên mobile thấp?
5) Firestore: query/indexes; tránh N+1; security không dựa vào “ẩn” collection.
6) Real-time: có unsubscribe khi đóng popup?
7) Popup feed: cuộn mượt trên Android/iOS thật với **volume dữ liệu lớn** (lazy/virtual/pagination — không hardcode ngưỡng)?
8) Core Web Vitals / kích thước chunk Maps: có regression rõ so với baseline không?

Đưa ra diff-level suggestions, ưu tiên bảo mật và hiệu năng.
```

---

## 3. Prompt đánh giá (Evaluate)

```
Kiểm thử chấp nhận frontend:

1) Map load trên 4G (đo thực tế hoặc throttling) — ghi số liệu; **LCP/INP** (hoặc Lighthouse mobile) tham chiếu NF-09.
2) Marker + cluster hoạt động khi zoom in/out nhiều lần; thử với **dataset gần quy mô thực tế** BTC cung cấp (không bắt buộc một con số SLA).
3) GPS: allow/deny; chuyển tab/background không làm crash.
4) Upload: ảnh lớn được nén; Firestore chỉ nhận metadata hợp lệ.
5) Popup chỉ hiển thị nội dung approved; không lộ pending của user khác.

Pass criteria: không có lỗi blocking; mọi F-xx frontend được cover.
```

---

## 4. Prompt cải thiện (Improve)

```
Tối ưu sau đo metric:

1) Code-split map library; lazy load khi vào trang map.
2) Prefetch spots; cache tĩnh nếu dữ liệu ít thay đổi trong giờ sự kiện.
3) Retry upload với exponential backoff; queue offline (nếu ROI cao).
4) Giảm re-render React (memo, stable callbacks) nếu profiler chỉ ra.
5) Ảnh UI: `loading="lazy"`, kích thước phù hợp; font subset + swap.
6) So sánh Lighthouse / Web Vitals trước–sau mỗi đợt tối ưu (ghi vào doc kỹ thuật).

Cập nhật README kỹ thuật với số liệu trước/sau.
```

---

**Mở rộng (bonus / roadmap):** `docs/TREASURE_HUNT_EVENT_PLATFORM.md` mục 6; `planning/07-bonus-backlog.md`. Gợi ý liên quan frontend: **B-01** leaderboard, **B-02** QR deep link, **B-06** PWA, **B-07** watermark ảnh; cải thiện **6.1** (EXIF, UX từ chối GPS, tối ưu listener).
