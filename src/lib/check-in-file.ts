/** MIME types accepted before client-side compression (check-in photo). */
export const CHECK_IN_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

/** Max file size before compression (bytes) — avoids OOM on weak devices. */
export const CHECK_IN_MAX_RAW_BYTES = 20 * 1024 * 1024;

export function validateCheckInImageFile(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "Chỉ chấp nhận file ảnh.";
  }
  if (!CHECK_IN_IMAGE_TYPES.includes(file.type as (typeof CHECK_IN_IMAGE_TYPES)[number])) {
    return "Định dạng ảnh chưa hỗ trợ. Dùng JPG, PNG, WebP hoặc GIF.";
  }
  if (file.size > CHECK_IN_MAX_RAW_BYTES) {
    return "Ảnh quá lớn (tối đa 20MB trước khi nén). Chọn ảnh nhỏ hơn.";
  }
  return null;
}

export function formatCheckInSubmitError(e: unknown): string {
  if (typeof e === "object" && e !== null && "code" in e) {
    const code = String((e as { code?: string }).code ?? "");
    if (code === "storage/unauthorized") {
      return "Không có quyền tải ảnh lên. Kiểm tra đăng nhập ẩn danh và Storage rules.";
    }
    if (code === "storage/canceled") {
      return "Tải lên bị hủy. Thử lại.";
    }
    if (code.includes("network") || code === "unavailable" || code === "deadline-exceeded") {
      return "Mạng không ổn định. Kiểm tra kết nối và thử lại.";
    }
    if (code === "permission-denied") {
      return "Bị từ chối quyền ghi. Kiểm tra Firestore rules.";
    }
  }
  if (e instanceof Error) {
    if (/network|failed to fetch|load failed/i.test(e.message)) {
      return "Lỗi mạng. Thử lại sau vài giây.";
    }
    if (e.message.includes("Chưa đăng nhập")) {
      return e.message;
    }
  }
  return "Không gửi được. Thử lại hoặc kiểm tra Firebase Auth (Anonymous).";
}
