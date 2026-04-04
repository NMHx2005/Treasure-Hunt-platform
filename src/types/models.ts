import type { Timestamp } from "firebase/firestore";

/** `regions` — đặt tên field khớp `planning/02-implementation-traceability.md` §3.1 */
export type Region = {
  name: string;
  slug: string;
  order?: number;
  defaultCenter?: { lat: number; lng: number };
  defaultBounds?: { ne: { lat: number; lng: number }; sw: { lat: number; lng: number } };
  createdAt: Timestamp;
  updatedAt?: Timestamp;
};

/** `spots` */
export type Spot = {
  regionId: string;
  name: string;
  lat: number;
  lng: number;
  imageUrl?: string | null;
  galleryUrls?: string[];
  createdAt: Timestamp;
  updatedAt?: Timestamp;
};

export type CheckInStatus = "pending" | "approved" | "rejected";

/** `checkIns` — field `text` (F-06: có thể rỗng nếu chỉ ảnh; rules + UI thống nhất) */
export type CheckIn = {
  spotId: string;
  text: string;
  imageUrl?: string | null;
  status: CheckInStatus;
  createdAt: Timestamp;
  userId: string;
  moderatedBy?: string;
  moderatedAt?: Timestamp;
  rejectReason?: string;
};
