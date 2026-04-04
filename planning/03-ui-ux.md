# Kế hoạch: UI/UX — `03-ui-ux` (design trước / song song dev)

**Deliverables:** User flow + wireframe, Google Map custom style, Figma (marker, popup, form), hướng dẫn responsive ngoài trời.

---

## 1. Prompt tạo (Create)

```
Thiết kế UI/UX cho web app sự kiện trên mobile (ưu tiên ngoài trời):

1) Vẽ user flow: mở web → **chọn khu vực (region)** hoặc mặc định → xem map → chọn điểm → (optional) GPS → check-in (**chỉ text hoặc text+ảnh**) → xác nhận / pending.
2) Wireframe low-fi: màn hình map fullscreen, bottom sheet/popup điểm, form upload.
3) Tạo JSON style Google Maps: giảm nhãn đường thừa, màu theo brand (cần palette từ khách).
4) Figma: icon marker “hộp kho báu”, popup thông tin điểm, form upload (trạng thái loading/error).
5) Responsive: nút tối thiểu 44px, contrast cao, chống chói nắng (test nhanh trên nền sáng).

Đầu ra: link Figma + file JSON map style + 1 trang note “design token” (màu, font, spacing).
```

---

## 2. Prompt review (Review)

```
Review deliverable UI/UX (`03-ui-ux`):

1) User flow có dead-end không (từ chối GPS, upload fail)?
2) Map style có làm mất khả năng đọc đường/tòa nhà quan trọng cho BTC không?
3) Marker cluster có phân biệt được với marker đơn không?
4) Form có trạng thái: chưa chọn ảnh, ảnh quá lớn, đang nén, đang upload?
5) Có conflict giữa “tối giản map” và “người chơi cần định hướng” không?

Kết luận: Approve / Revise với danh sách chỉnh sửa cụ thể.
```

---

## 3. Prompt đánh giá (Evaluate)

```
Nghiệm thu UI/UX trước khi dev lên màu pixel-perfect:

1) BTC đã chốt user flow bằng văn bản (sign-off).
2) Figma đủ component cho dev: marker, popup, form, nút GPS, toast/error.
3) Map style JSON import được vào Google Maps Platform Styling (smoke test).
4) Checklist contrast cơ bản (WCAG AA nếu có thể) cho text chính trên map overlay.

Ghi nhận mọi thay đổi sau nghiệm thu vào changelog thiết kế.
```

---

## 4. Prompt cải thiện (Improve)

```
Sau UAT hoặc sau sự kiện ngày 1:

1) Thu thập feedback: khó bấm, chói màn hình, nhầm nút.
2) Đề xuất iteration: kích thước hit area, vị trí FAB GPS, dark mode overlay (nếu cần).
3) Cập nhật Figma và JSON map style; ghi version (v1.1).

Không thay đổi flow đã sign-off mà không có xác nhận BTC.
```

---

**Mở rộng (bonus / roadmap):** `docs/TREASURE_HUNT_EVENT_PLATFORM.md` mục 6; prompt chi tiết `planning/07-bonus-backlog.md`. Gợi ý liên quan UI: **B-06** (PWA, icon), **B-08** (hai map style sáng/tối). **Hiệu năng:** font subset/`swap`, asset nhẹ — đối chiếu **§3.5**.
