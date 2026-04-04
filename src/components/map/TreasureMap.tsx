"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { signInAnonymously } from "firebase/auth";
import type { CheckIn, Region, Spot } from "@/types/models";
import { getDb, getFirebaseAuth, getFirebaseStorage } from "@/lib/firebase";
import { compressCheckInImage, CHECK_IN_MAX_EDGE_PX, CHECK_IN_MAX_SIZE_MB } from "@/lib/image-compress";
import {
  CHECK_IN_MAX_RAW_BYTES,
  formatCheckInSubmitError,
  validateCheckInImageFile,
} from "@/lib/check-in-file";
import treasureMapStyle from "@/config/treasure-map-style.json";

type SpotDoc = Spot & { id: string };
type RegionDoc = Region & { id: string };

const FEED_PAGE = 20;
const TEXT_MAX = 2000;

export type CheckInSubmitPhase = "idle" | "compressing" | "uploading" | "done" | "err";

function treasureMarkerIcon(): google.maps.Icon {
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="0 0 40 52"><path fill="#ea580c" stroke="#9a3412" stroke-width="1.2" d="M20 4C11 4 4 11.2 4 19.5c0 9.5 16 28.5 16 28.5s16-19 16-28.5C36 11.2 29 4 20 4z"/><rect x="13" y="14" width="14" height="11" rx="1.5" fill="#fde68a" stroke="#b45309" stroke-width="0.8"/></svg>`,
  );
  return {
    url: `data:image/svg+xml;charset=utf-8,${svg}`,
    scaledSize: new google.maps.Size(40, 52),
    anchor: new google.maps.Point(20, 50),
  };
}

export default function TreasureMap() {
  const db = useMemo(() => getDb(), []);
  const firebaseAuth = useMemo(() => getFirebaseAuth(), []);
  const firebaseStorage = useMemo(() => getFirebaseStorage(), []);

  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const [mapReady, setMapReady] = useState(false);
  const [regions, setRegions] = useState<RegionDoc[]>([]);
  const [regionId, setRegionId] = useState<string>("");
  const [spots, setSpots] = useState<SpotDoc[]>([]);
  const [selected, setSelected] = useState<SpotDoc | null>(null);
  const [feed, setFeed] = useState<(CheckIn & { id: string })[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [checkText, setCheckText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileHint, setFileHint] = useState<string | null>(null);
  const [submitPhase, setSubmitPhase] = useState<CheckInSubmitPhase>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [geoMsg, setGeoMsg] = useState<string | null>(null);
  const [followingGps, setFollowingGps] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    void signInAnonymously(firebaseAuth).catch(() => {
      /* Anonymous auth có thể chưa bật trên project */
    });
  }, [firebaseAuth]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    setSubmitPhase("idle");
    setSubmitError(null);
    setFile(null);
    setFileHint(null);
    setCheckText("");
  }, [selected?.id]);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "regions"), orderBy("name")), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Region) }));
      setRegions(list);
      setRegionId((prev) => prev || list[0]?.id || "");
    });
    return () => unsub();
  }, [db]);

  useEffect(() => {
    if (!regionId) {
      setSpots([]);
      return;
    }
    const q = query(
      collection(db, "spots"),
      where("regionId", "==", regionId),
      orderBy("createdAt", "asc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      setSpots(
        snap.docs.map((d) => {
          const data = d.data() as Spot;
          return { id: d.id, ...data };
        }),
      );
    });
    return () => unsub();
  }, [db, regionId]);

  const loadFeedPage = useCallback(async (spot: SpotDoc, cursor: QueryDocumentSnapshot<DocumentData> | null) => {
    const q = cursor
      ? query(
          collection(db, "checkIns"),
          where("spotId", "==", spot.id),
          where("status", "==", "approved"),
          orderBy("createdAt", "desc"),
          startAfter(cursor),
          limit(FEED_PAGE),
        )
      : query(
          collection(db, "checkIns"),
          where("spotId", "==", spot.id),
          where("status", "==", "approved"),
          orderBy("createdAt", "desc"),
          limit(FEED_PAGE),
        );
    const snap = await getDocs(q);
    const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as CheckIn) }));
    if (cursor) {
      setFeed((prev) => [...prev, ...rows]);
    } else {
      setFeed(rows);
    }
    setLastDoc(snap.docs[snap.docs.length - 1] ?? null);
    setHasMore(snap.docs.length === FEED_PAGE);
  }, [db]);

  useEffect(() => {
    if (!selected) {
      setFeed([]);
      setLastDoc(null);
      setHasMore(false);
      return;
    }
    void loadFeedPage(selected, null);
  }, [selected, loadFeedPage]);

  useEffect(() => {
    if (!apiKey || !mapEl.current) return;

    let cancelled = false;
    setOptions({ key: apiKey, v: "weekly" });

    void importLibrary("maps")
      .then(() => {
        if (cancelled || !mapEl.current) return;
        const styles = treasureMapStyle as google.maps.MapTypeStyle[];
        const map = new google.maps.Map(mapEl.current, {
          center: { lat: 10.7769, lng: 106.7009 },
          zoom: 12,
          styles,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });
        mapRef.current = map;
        infoWindowRef.current = new google.maps.InfoWindow();
        setMapReady(true);
      })
      .catch((e: unknown) => {
        setMapError(e instanceof Error ? e.message : "Không tải được Maps.");
      });

    return () => {
      cancelled = true;
      clustererRef.current = null;
      mapRef.current = null;
      setMapReady(false);
    };
  }, [apiKey]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;
    const region = regions.find((r) => r.id === regionId);
    if (region?.defaultBounds) {
      const b = region.defaultBounds;
      map.fitBounds(
        new google.maps.LatLngBounds(
          new google.maps.LatLng(b.sw.lat, b.sw.lng),
          new google.maps.LatLng(b.ne.lat, b.ne.lng),
        ),
      );
    } else if (region?.defaultCenter) {
      map.setCenter(region.defaultCenter);
      map.setZoom(12);
    }
  }, [mapReady, regionId, regions]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    clustererRef.current?.clearMarkers();
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const icon = treasureMarkerIcon();
    const markers = spots.map((s) => {
      const marker = new google.maps.Marker({
        map,
        position: { lat: s.lat, lng: s.lng },
        title: s.name,
        icon,
      });
      marker.addListener("click", () => {
        setSelected(s);
        const iw = infoWindowRef.current;
        if (!iw) return;
        iw.setContent(
          `<div style="padding:10px 12px;max-width:240px;border-left:4px solid #ea580c;font:600 14px system-ui,sans-serif;color:#18181b">${escapeHtml(s.name)}</div>`,
        );
        iw.open({ map, anchor: marker });
      });
      return marker;
    });

    markersRef.current = markers;
    clustererRef.current = new MarkerClusterer({ map, markers });
  }, [spots, mapReady]);

  function stopFollowGps() {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setFollowingGps(false);
  }

  async function submitCheckIn() {
    if (!selected) return;
    setSubmitError(null);
    if (!checkText.trim() && !file) {
      setSubmitPhase("err");
      setSubmitError("Nhập bình luận hoặc chọn ảnh.");
      return;
    }
    if (file) {
      const v = validateCheckInImageFile(file);
      if (v) {
        setSubmitPhase("err");
        setSubmitError(v);
        return;
      }
    }

    try {
      const user = firebaseAuth.currentUser;
      if (!user) {
        await signInAnonymously(firebaseAuth);
      }
      const uid = firebaseAuth.currentUser?.uid;
      if (!uid) throw new Error("Chưa đăng nhập ẩn danh.");

      let photo: File | null = null;
      if (file) {
        setSubmitPhase("compressing");
        photo = await compressCheckInImage(file);
      }

      setSubmitPhase("uploading");
      const refDoc = await addDoc(collection(db, "checkIns"), {
        spotId: selected.id,
        text: checkText.trim(),
        status: "pending",
        userId: uid,
        createdAt: serverTimestamp(),
      });

      if (photo) {
        const storageRef = ref(firebaseStorage, `checkIns/${refDoc.id}/photo.jpg`);
        await uploadBytes(storageRef, photo, { contentType: photo.type || "image/jpeg" });
        const url = await getDownloadURL(storageRef);
        await updateDoc(doc(db, "checkIns", refDoc.id), { imageUrl: url });
      }

      setCheckText("");
      setFile(null);
      setFileHint(null);
      setSubmitPhase("done");
    } catch (e: unknown) {
      setSubmitPhase("err");
      setSubmitError(formatCheckInSubmitError(e));
    }
  }

  function myLocationOnce() {
    if (!mapRef.current) return;
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setGeoMsg("Cần HTTPS để dùng GPS.");
      return;
    }
    if (!navigator.geolocation) {
      setGeoMsg("Trình duyệt không hỗ trợ định vị.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const posLatLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        mapRef.current?.panTo(posLatLng);
        mapRef.current?.setZoom(15);
        setGeoMsg(null);
      },
      (err) => {
        setGeoMsg(
          err.code === 1
            ? "Đã từ chối quyền vị trí. Mở cài đặt trình duyệt → Quyền → cho phép Vị trí cho trang này."
            : `Không lấy được vị trí (mã ${err.code}). Thử lại hoặc bật GPS.`,
        );
      },
      { enableHighAccuracy: true, timeout: 12_000 },
    );
  }

  function toggleFollowGps() {
    if (followingGps) {
      stopFollowGps();
      setGeoMsg(null);
      return;
    }
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setGeoMsg("Cần HTTPS để dùng GPS.");
      return;
    }
    if (!navigator.geolocation) {
      setGeoMsg("Trình duyệt không hỗ trợ định vị.");
      return;
    }
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const posLatLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        mapRef.current?.panTo(posLatLng);
        setGeoMsg(null);
      },
      (err) => {
        setGeoMsg(
          err.code === 1
            ? "Theo dõi GPS: quyền bị từ chối. Bật quyền vị trí trong cài đặt."
            : `Theo dõi GPS lỗi (mã ${err.code}).`,
        );
        stopFollowGps();
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20_000 },
    );
    setFollowingGps(true);
  }

  function onFilePick(files: FileList | null) {
    const f = files?.[0] ?? null;
    setFile(f);
    if (!f) {
      setFileHint(null);
      return;
    }
    const v = validateCheckInImageFile(f);
    setFileHint(v);
  }

  if (!apiKey) {
    return (
      <p className="p-6 text-center text-amber-800 dark:text-amber-200">
        Thiếu NEXT_PUBLIC_GOOGLE_MAPS_API_KEY trong .env — không thể tải bản đồ.
      </p>
    );
  }

  if (mapError) {
    return <p className="p-6 text-center text-red-600">{mapError}</p>;
  }

  const btnBase =
    "inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl px-4 text-sm font-semibold shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500";

  return (
    <div className="flex min-h-[100dvh] flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="flex flex-wrap items-center gap-3 border-b border-amber-900/10 bg-gradient-to-r from-amber-50 via-white to-orange-50/80 px-3 py-3 dark:border-amber-500/20 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900">
        <div className="flex min-h-11 flex-1 flex-wrap items-center gap-2 sm:gap-3">
          <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
            <span className="hidden sm:inline">Khu vực</span>
            <select
              className="min-h-11 min-w-[8rem] rounded-xl border border-amber-200/80 bg-white/90 px-3 py-2 text-sm font-medium text-zinc-900 shadow-sm dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              value={regionId}
              onChange={(e) => setRegionId(e.target.value)}
            >
              {regions.length === 0 ? <option value="">— chưa có regions —</option> : null}
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className={`${btnBase} bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400`}
            onClick={() => myLocationOnce()}
          >
            Vị trí của tôi
          </button>
          <button
            type="button"
            className={
              followingGps
                ? `${btnBase} border-2 border-amber-600 bg-amber-100 text-amber-950 dark:border-amber-400 dark:bg-amber-950/40 dark:text-amber-100`
                : `${btnBase} border border-amber-300/80 bg-white text-amber-950 hover:bg-amber-50 dark:border-amber-700 dark:bg-zinc-800 dark:text-amber-100 dark:hover:bg-zinc-700`
            }
            onClick={() => toggleFollowGps()}
          >
            {followingGps ? "Dừng theo dõi GPS" : "Theo dõi GPS"}
          </button>
        </div>
        {geoMsg ? (
          <p className="w-full text-sm font-medium text-amber-900 dark:text-amber-200 sm:max-w-xl">{geoMsg}</p>
        ) : null}
      </header>

      <div className="relative grid flex-1 grid-cols-1 lg:grid-cols-[1fr_min(420px,100%)]">
        <div ref={mapEl} className="min-h-[52vh] w-full bg-zinc-200 lg:min-h-0" />

        <aside className="max-h-[48vh] overflow-y-auto border-t border-amber-900/10 bg-white/95 p-4 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:border-amber-500/15 dark:bg-zinc-900/95 lg:max-h-none lg:border-l lg:border-t-0 lg:shadow-none">
          {!selected ? (
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Chọn một <strong className="text-amber-700 dark:text-amber-400">điểm kho báu</strong> trên bản đồ để xem
              chi tiết, ảnh và gửi check-in.
            </p>
          ) : (
            <SpotPanel
              spot={selected}
              feed={feed}
              hasMore={hasMore}
              onLoadMore={() => lastDoc && void loadFeedPage(selected, lastDoc)}
              checkText={checkText}
              setCheckText={setCheckText}
              file={file}
              onFilePick={onFilePick}
              fileHint={fileHint}
              submitPhase={submitPhase}
              submitError={submitError}
              onSubmit={() => void submitCheckIn()}
            />
          )}
        </aside>
      </div>
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function spotGalleryUrls(spot: SpotDoc): string[] {
  const urls: string[] = [];
  if (spot.imageUrl) urls.push(spot.imageUrl);
  for (const u of spot.galleryUrls ?? []) {
    if (u && !urls.includes(u)) urls.push(u);
  }
  return urls;
}

function SpotPanel({
  spot,
  feed,
  hasMore,
  onLoadMore,
  checkText,
  setCheckText,
  file,
  onFilePick,
  fileHint,
  submitPhase,
  submitError,
  onSubmit,
}: {
  spot: SpotDoc;
  feed: (CheckIn & { id: string })[];
  hasMore: boolean;
  onLoadMore: () => void;
  checkText: string;
  setCheckText: (v: string) => void;
  file: File | null;
  onFilePick: (files: FileList | null) => void;
  fileHint: string | null;
  submitPhase: CheckInSubmitPhase;
  submitError: string | null;
  onSubmit: () => void;
}) {
  const coord = `${spot.lat.toFixed(6)}, ${spot.lng.toFixed(6)}`;
  const gallery = spotGalleryUrls(spot);
  const busy = submitPhase === "compressing" || submitPhase === "uploading";

  async function copyCoord() {
    try {
      await navigator.clipboard.writeText(coord);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{spot.name}</h2>
        <p className="mt-1.5 font-mono text-sm text-zinc-600 dark:text-zinc-400">
          {coord}{" "}
          <button
            type="button"
            className="ml-1 min-h-8 rounded-lg px-2 text-xs font-semibold text-amber-700 underline decoration-amber-400 underline-offset-2 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300"
            onClick={() => void copyCoord()}
          >
            Copy
          </button>
        </p>
        {gallery.length > 0 ? (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {gallery.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt=""
                className="aspect-square w-full rounded-xl object-cover shadow-sm ring-1 ring-zinc-200/80 dark:ring-zinc-700"
                loading="lazy"
              />
            ))}
          </div>
        ) : null}
      </div>

      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Đã duyệt</h3>
        <ul className="mt-2 space-y-3">
          {feed.map((c) => (
            <li
              key={c.id}
              className="rounded-xl border border-zinc-200/90 bg-zinc-50/80 p-3 text-sm dark:border-zinc-700 dark:bg-zinc-800/50"
            >
              {c.text ? <p className="whitespace-pre-wrap text-zinc-800 dark:text-zinc-200">{c.text}</p> : null}
              {c.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.imageUrl}
                  alt=""
                  className="mt-2 max-h-44 w-full rounded-lg object-contain"
                  loading="lazy"
                />
              ) : null}
            </li>
          ))}
        </ul>
        {hasMore ? (
          <button
            type="button"
            className="mt-3 min-h-11 text-sm font-semibold text-amber-700 underline decoration-2 underline-offset-4 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300"
            onClick={onLoadMore}
          >
            Tải thêm
          </button>
        ) : null}
      </div>

      <div className="rounded-2xl border border-amber-200/60 bg-gradient-to-b from-amber-50/50 to-white p-4 dark:border-amber-900/40 dark:from-amber-950/20 dark:to-zinc-900">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Check-in</h3>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Chỉ text hoặc text + ảnh. Ảnh sẽ được nén (~{CHECK_IN_MAX_SIZE_MB}MB, tối đa cạnh {CHECK_IN_MAX_EDGE_PX}px). Tối đa{" "}
          {Math.round(CHECK_IN_MAX_RAW_BYTES / 1024 / 1024)}MB trước khi nén.
        </p>
        <textarea
          className="mt-3 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-inner dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
          rows={3}
          placeholder="Bình luận (có thể chỉ text)"
          maxLength={TEXT_MAX}
          value={checkText}
          onChange={(e) => setCheckText(e.target.value)}
          disabled={busy}
        />
        <p className="mt-1 text-right text-xs text-zinc-400">{checkText.length}/{TEXT_MAX}</p>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
          className="mt-2 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-amber-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-amber-900 hover:file:bg-amber-200 dark:file:bg-amber-950 dark:file:text-amber-200 dark:hover:file:bg-amber-900"
          disabled={busy}
          onChange={(e) => onFilePick(e.target.files)}
        />
        {file ? (
          <p className="mt-2 text-xs font-medium text-zinc-600 dark:text-zinc-300">
            Đã chọn: {file.name} ({(file.size / 1024).toFixed(0)} KB)
          </p>
        ) : (
          <p className="mt-2 text-xs text-zinc-500">Chưa chọn ảnh — hoàn toàn tuỳ chọn.</p>
        )}
        {fileHint ? <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{fileHint}</p> : null}
        <button
          type="button"
          disabled={busy || !!fileHint}
          className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 text-sm font-bold text-white shadow-md hover:from-amber-500 hover:to-orange-500 disabled:cursor-not-allowed disabled:opacity-50 dark:from-amber-500 dark:to-orange-500 dark:hover:from-amber-400 dark:hover:to-orange-400"
          onClick={onSubmit}
        >
          {submitPhase === "compressing"
            ? "Đang nén ảnh…"
            : submitPhase === "uploading"
              ? "Đang gửi…"
              : "Gửi (chờ duyệt)"}
        </button>
        {submitPhase === "done" ? (
          <p className="mt-3 text-sm font-semibold text-emerald-700 dark:text-emerald-400">Đã gửi — chờ BTC duyệt.</p>
        ) : null}
        {submitPhase === "err" && submitError ? (
          <p className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">{submitError}</p>
        ) : null}
      </div>
    </div>
  );
}
