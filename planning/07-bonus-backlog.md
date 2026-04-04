# Cải thiện sau Core & bonus — `07-bonus-backlog` (B-01 … B-08)

**Tham chiếu:** `docs/TREASURE_HUNT_EVENT_PLATFORM.md` mục **6** (roadmap, bảng bonus, gói Core/Plus/Pro).

**Nguyên tắc:** Không triển khai bonus trừ khi đã **chốt scope & phụ lục**; ưu tiên theo impact / effort / rủi ro (gian lận, chi phí Firebase).

---

## 1. Prompt tạo (Create) — lựa chọn & thiết kế bonus

```
Bạn là product + tech lead. Đọc docs/TREASURE_HUNT_EVENT_PLATFORM.md (mục 6) và danh sách B-01…B-08.

1) Với khách hàng mục tiêu [mô tả ngắn], chọn tối đa 3 bonus cho gói Plus và tối đa 3 cho Pro — giải thích vì sao.
2) Với mỗi mục được chọn: user story 1 dòng, phụ thuộc kỹ thuật (Firestore schema, Functions, Storage), rủi ro (gian lận leaderboard, quota FCM).
3) Leaderboard (B-01): đề xuất rule chống gian lận tối thiểu (ví dụ: chỉ đếm sau approve, giới hạn 1 check-in/spot/user, server-side validation nếu có Functions).
4) QR deep link (B-02): định dạng URL (?spotId=), fallback khi mở sai trình duyệt.
5) Đầu ra: bảng backlog với ID, effort S/M/L, phụ thuộc module (`03-ui-ux` … `06-devops`).

Ràng buộc: không phá vỡ Security Rules hiện tại; mọi tính năng public phải qua review bảo mật.
```

---

## 2. Prompt review (Review) — bonus đã implement

```
Review phần mở rộng (bonus) trong repo:

1) So khớp với phụ lục hợp đồng: chỉ những B-xx đã ký mới có trong build production.
2) Leaderboard: có bypass tăng điểm từ client không? Có race condition trên Firestore?
3) FCM (B-05): token lưu an toàn; chỉ admin nhận; không leak qua rules.
4) PWA (B-06): manifest, icons, scope; không cache sai API dynamic.
5) Watermark (B-07): xử lý trên client có OOM trên máy yếu không? có fallback tắt watermark?
6) Export CSV (B-04): không lộ PII ngoài cam kết; rate limit export.

Kết luận: Ship / Fix / Hold với lý do.
```

---

## 3. Prompt đánh giá (Evaluate) — nghiệm thu bonus

```
Nghiệm thu từng B-xx đã bán (chỉ test phần trong scope phụ lục):

1) Tiêu chí chấp nhận cụ thể (Given/When/Then) cho từng tính năng.
2) Kiểm thử thiết bị: iOS Safari + Android Chrome cho QR, PWA “Add to Home”, deep link.
3) Load nhẹ: mở leaderboard với N user ảo (hoặc staging) — không lag UI map chính.
4) BTC demo: duyệt nhanh với FCM (nếu có) — thông báo đến đúng người.

Báo cáo: Pass / Pass có điều kiện / Fail; ảnh chụp màn hình hoặc log chấp nhận.
```

---

## 4. Prompt cải thiện (Improve) — ưu tiên hóa backlog bonus

```
Sau sprint hoặc sau sự kiện, đánh giá lại bonus:

1) Metric: tỷ lệ dùng QR, số export, click leaderboard — có tính năng nào không đáng tiền?
2) Rút gọn scope B-xx cho bản tiếp theo (ví dụ: leaderboard chỉ top 10, không real-time).
3) Cập nhật docs/TREASURE_HUNT_EVENT_PLATFORM.md mục 6 và bảng giá nếu đổi gói Plus/Pro.
4) Retrospective: bonus nào nên gộp vào Core mặc định cho dự án tương lai?

Đầu ra: backlog đã sắp xếp (Must next / Nice / Drop).
```

---

## 5. Prompt tạo (Create) — chỉ “cải thiện sau Core” (không bonus)

```
Triển khai các cải thiện vận hành trong mục 6.1 tài liệu (spam, GPS UX, real-time, moderation cao điểm, status page, consent):

1) Chọn subset phù hợp budget [X ngày]: tối đa 4 hạng mục.
2) Với mỗi hạng mục: task kỹ thuật cụ thể + file/module dự kiến chạm vào.
3) EXIF strip + App Check + rate limit: mô tả triển khai tối thiểu (không over-engineer).
4) Trang status: static trên Hosting hoặc redirect — đơn giản nhất.

Không thêm B-01…B-08 trừ khi được yêu cầu rõ trong cùng prompt.
```

---

## 6. Prompt review (Review) — cải thiện 6.1

```
Review PR liên quan mục 6.1:

1) App Check / reCAPTCHA có chặn user hợp lệ không (false positive)?
2) Rate limit: có khóa cả mạng NAT sự kiện không? điều chỉnh threshold.
3) Listener Firestore: trước/sau fix — số listener khi mở/đóng popup.
4) Consent: copy pháp lý đã được khách duyệt chưa (placeholder không ship production).

Issue list theo severity.
```
