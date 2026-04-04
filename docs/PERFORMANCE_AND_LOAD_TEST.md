# Hiệu năng web & load test — NF-09 / mục 3.5 / NF-02

Tài liệu thực hành bổ sung cho `docs/RUNBOOK.md`. **Không** thay thế đo tay trên URL thật và mạng 4G thật nếu cần.

---

## 1. Lighthouse (mobile) — LCP, INP, CLS

### Cách 1: Chrome DevTools

1. Mở site production trên Chrome → F12 → tab **Lighthouse**.
2. Chọn **Mobile** → chỉ **Performance** (hoặc thêm Accessibility nếu cần).
3. Chạy trên `/` và `/map`; ghi **LCP, INP, CLS** vào bảng trong `docs/RUNBOOK.md`.

### Cách 2: CLI (máy có Node)

```bash
cd /path/to/repo
npx -y lighthouse@11 "https://YOUR-PROJECT.web.app/map" \
  --only-categories=performance \
  --form-factor=mobile \
  --screenEmulation.mobile=true \
  --output=html \
  --output-path=./lighthouse-map-mobile.html
```

Mở file HTML để đọc chỉ số; **không** commit file báo cáo nếu chứa URL nội bộ nhạy cảm (tuỳ chính sách team).

### Cách 3: PageSpeed Insights

[https://pagespeed.web.dev/](https://pagespeed.web.dev/) — nhập URL public → tab mobile → copy LCP / INP / CLS vào RUNBOOK.

---

## 2. k6 — smoke hosting (song song nhiều user đọc trang)

**Mục đích:** kiểm tra CDN/Hosting chịu nhiều request GET đồng thời (một phần NF-02). **Không** mô phỏng đầy đủ Firestore/Auth từ trình duyệt — cần thêm kịch bản riêng hoặc rehearsal thật.

### Cài k6

- macOS: `brew install k6`
- Hoặc: [https://k6.io/docs/get-started/installation/](https://k6.io/docs/get-started/installation/)

### Chạy

```bash
export BASE_URL="https://YOUR-PROJECT.web.app"
npm run k6:hosting-smoke
# tương đương: k6 run scripts/k6/hosting-smoke.js
```

Tuỳ chỉnh tải trong file `scripts/k6/hosting-smoke.js` (`vus`, `duration`).

### Đọc kết quả

- `http_req_failed` gần 0% là tốt.
- HTTP 429/5xx tăng đột biến → xem quota Hosting / Cloudflare (nếu có) / Firebase.

---

## 3. Firestore / Storage trong ngày sự kiện

- **Console → Usage:** theo dõi reads/writes/storage trong giờ cao điểm.
- **Rehearsal:** mở nhiều máy thật cùng map + vài admin duyệt — gần với thực tế hơn k6 GET.

---

## 4. Ảnh sau compress (F-06)

- Trên app: giới hạn trước nén ~20MB; sau nén mục tiêu ~1MB/cạnh 1920px (xem `src/lib/image-compress.ts`).
- Kiểm tra nhanh: upload ảnh 12MP từ điện thoại → xem kích thước file trên Storage (Console) sau khi duyệt.
