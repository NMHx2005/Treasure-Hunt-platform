# Kế hoạch: DevOps & vận hành — `06-devops-operations`

**Deliverables:** CI/CD → Firebase Hosting, tối ưu cold start, domain + SSL, runbook & hỗ trợ sự kiện (theo gói).

---

## 1. Prompt tạo (Create)

```
Thiết lập DevOps cho Next.js + Firebase:

1) Repo: branch main/production; GitHub Actions (hoặc tương đương) build và deploy Firebase Hosting.
2) Secrets: FIREBASE_TOKEN hoặc workload identity; không lộ trong log.
3) Tối ưu first load: analyze bundle, image assets, có thể static export vs SSR tùy quyết định kiến trúc.
4) Environment: staging project vs production Firebase (khuyến nghị).
5) Domain: hướng dẫn trỏ DNS, SSL Firebase Hosting, kiểm tra HTTPS cho Geolocation.
6) Viết runbook 1 trang: ai liên hệ khi map down, khi Firestore quota, cách rollback deploy.
7) Hiệu năng: sau mỗi release production, **đo Lighthouse (mobile)** hoặc PageSpeed trên URL thật; lưu báo cáo hoặc chỉ số chính (LCP, INP, CLS) để so sánh — đối chiếu docs **§3.5** / **NF-09**; tùy chọn budget bundle trên CI.
8) **Next.js trên Firebase Hosting:** dùng **Web Frameworks** (Firebase) hoặc chiến lược **static export** — chọn một, cấu hình `firebase.json` + README; verify preview channel trước production.

Mục tiêu tham chiếu: map usable dưới ~3s trên 4G (đo và ghi chú điều kiện test) — **không** thay thế việc theo dõi CWV dài hạn.
```

---

## 2. Prompt review (Review)

```
Review pipeline & cấu hình:

1) CI có lint/test tối thiểu không? Fail có chặn deploy không?
2) Hosting: headers cache, security headers (CSP cơ bản nếu áp dụng được).
3) Firebase console: ai có quyền owner; 2FA khuyến nghị.
4) Maps billing alert đã bật chưa?
5) Rollback: có lưu artifact build hoặc tag release?
6) Có lưu ít nhất một bản ghi Lighthouse/Web Vitals gần nhất cho production không?

Liệt kê gap so với mục tiêu **~1.000–2.000 CCU** trong docs **NF-02** (chủ yếu Firebase quota, rules, burst ghi Storage/Firestore).
```

---

## 3. Prompt đánh giá (Evaluate)

```
Go-live checklist:

1) Production URL HTTPS; smoke test GPS trên thiết bị thật.
2) Deploy thử từ CI; xác nhận không cần tay chân cho mỗi lần push (trừ approve manual nếu có).
3) Giám sát: Firebase console + (optional) uptime check trang chủ.
4) Tài liệu bàn giao: domain registrar, Firebase project id, billing account, contact.

Đánh giá “sẵn sàng sự kiện”: Yes/No và việc còn lại.
```

---

## 4. Prompt cải thiện (Improve)

```
Sau sự kiện:

1) Thu thập metric: peak concurrent, reads/writes Firestore, storage egress.
2) Tối ưu CI cache, parallel jobs; preview deploy cho PR.
3) Load test k6 (hoặc tương đương) cho bản tiếp theo.
4) Rút kinh nghiệm standby support: log cần thêm, dashboard cần có.

Cập nhật planning và docs với số liệu thực tế.
```

---

**Mở rộng (bonus / roadmap):** `docs/TREASURE_HUNT_EVENT_PLATFORM.md` mục 6; `planning/07-bonus-backlog.md`. Gợi ý liên quan DevOps: trang **status** (mục 6.1), **B-06** PWA/manifest trên Hosting, giám sát quota khi bật **B-05** / leaderboard.
