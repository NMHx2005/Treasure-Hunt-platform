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
import { compressCheckInImage } from "@/lib/image-compress";

type SpotDoc = Spot & { id: string };
type RegionDoc = Region & { id: string };

const FEED_PAGE = 20;

export default function TreasureMap() {
  const db = useMemo(() => getDb(), []);
  const firebaseAuth = useMemo(() => getFirebaseAuth(), []);
  const firebaseStorage = useMemo(() => getFirebaseStorage(), []);

  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

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
  const [submitState, setSubmitState] = useState<"idle" | "sending" | "done" | "err">("idle");
  const [geoMsg, setGeoMsg] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    void signInAnonymously(firebaseAuth).catch(() => {
      /* Anonymous auth có thể chưa bật trên project */
    });
  }, [firebaseAuth]);

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
        const map = new google.maps.Map(mapEl.current, {
          center: { lat: 10.7769, lng: 106.7009 },
          zoom: 12,
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

    const markers = spots.map((s) => {
      const marker = new google.maps.Marker({
        map,
        position: { lat: s.lat, lng: s.lng },
        title: s.name,
      });
      marker.addListener("click", () => {
        setSelected(s);
        const iw = infoWindowRef.current;
        if (!iw) return;
        iw.setContent(`<div style="padding:8px;max-width:220px;font-weight:600">${escapeHtml(s.name)}</div>`);
        iw.open({ map, anchor: marker });
      });
      return marker;
    });

    markersRef.current = markers;
    clustererRef.current = new MarkerClusterer({ map, markers });
  }, [spots, mapReady]);

  async function submitCheckIn() {
    if (!selected) return;
    if (!checkText.trim() && !file) {
      setSubmitState("err");
      return;
    }
    setSubmitState("sending");
    try {
      const user = firebaseAuth.currentUser;
      if (!user) {
        await signInAnonymously(firebaseAuth);
      }
      const uid = firebaseAuth.currentUser?.uid;
      if (!uid) throw new Error("Chưa đăng nhập ẩn danh.");

      const refDoc = await addDoc(collection(db, "checkIns"), {
        spotId: selected.id,
        text: checkText.trim(),
        status: "pending",
        userId: uid,
        createdAt: serverTimestamp(),
      });

      if (file) {
        const compressed = await compressCheckInImage(file);
        const storageRef = ref(firebaseStorage, `checkIns/${refDoc.id}/photo.jpg`);
        await uploadBytes(storageRef, compressed, { contentType: compressed.type || "image/jpeg" });
        const url = await getDownloadURL(storageRef);
        await updateDoc(doc(db, "checkIns", refDoc.id), { imageUrl: url });
      }

      setCheckText("");
      setFile(null);
      setSubmitState("done");
    } catch {
      setSubmitState("err");
    }
  }

  function myLocation() {
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
        setGeoMsg(`Không lấy được vị trí (${err.code}). Hãy cấp quyền trong cài đặt trình duyệt.`);
      },
      { enableHighAccuracy: true, timeout: 12_000 },
    );
  }

  if (!apiKey) {
    return (
      <p className="p-6 text-center text-amber-700">
        Thiếu NEXT_PUBLIC_GOOGLE_MAPS_API_KEY trong .env — không thể tải bản đồ.
      </p>
    );
  }

  if (mapError) {
    return <p className="p-6 text-center text-red-600">{mapError}</p>;
  }

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
        <label className="text-sm text-zinc-600 dark:text-zinc-400">
          Khu vực
          <select
            className="ml-2 rounded border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-600 dark:bg-zinc-900"
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
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          onClick={() => myLocation()}
        >
          Vị trí của tôi
        </button>
        {geoMsg ? <span className="text-sm text-amber-700">{geoMsg}</span> : null}
      </header>

      <div className="relative grid flex-1 grid-cols-1 lg:grid-cols-[1fr_380px]">
        <div ref={mapEl} className="min-h-[50vh] w-full bg-zinc-100 lg:min-h-0" />

        <aside className="max-h-[50vh] overflow-y-auto border-t border-zinc-200 p-4 dark:border-zinc-800 lg:max-h-none lg:border-l lg:border-t-0">
          {!selected ? (
            <p className="text-sm text-zinc-500">Chọn một điểm trên bản đồ để xem chi tiết và check-in.</p>
          ) : (
            <SpotPanel
              spot={selected}
              feed={feed}
              hasMore={hasMore}
              onLoadMore={() => lastDoc && void loadFeedPage(selected, lastDoc)}
              checkText={checkText}
              setCheckText={setCheckText}
              file={file}
              setFile={setFile}
              submitState={submitState}
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

function SpotPanel({
  spot,
  feed,
  hasMore,
  onLoadMore,
  checkText,
  setCheckText,
  file,
  setFile,
  submitState,
  onSubmit,
}: {
  spot: SpotDoc;
  feed: (CheckIn & { id: string })[];
  hasMore: boolean;
  onLoadMore: () => void;
  checkText: string;
  setCheckText: (v: string) => void;
  file: File | null;
  setFile: (f: File | null) => void;
  submitState: "idle" | "sending" | "done" | "err";
  onSubmit: () => void;
}) {
  const coord = `${spot.lat.toFixed(6)}, ${spot.lng.toFixed(6)}`;

  async function copyCoord() {
    try {
      await navigator.clipboard.writeText(coord);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{spot.name}</h2>
        <p className="mt-1 font-mono text-sm text-zinc-600 dark:text-zinc-400">
          {coord}{" "}
          <button type="button" className="ml-2 text-xs underline" onClick={() => void copyCoord()}>
            Copy
          </button>
        </p>
        {spot.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={spot.imageUrl} alt="" className="mt-2 max-h-48 w-full rounded object-cover" loading="lazy" />
        ) : null}
      </div>

      <div>
        <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Đã duyệt</h3>
        <ul className="mt-2 space-y-3">
          {feed.map((c) => (
            <li key={c.id} className="rounded border border-zinc-200 p-2 text-sm dark:border-zinc-800">
              {c.text ? <p className="whitespace-pre-wrap">{c.text}</p> : null}
              {c.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.imageUrl} alt="" className="mt-1 max-h-40 rounded object-contain" loading="lazy" />
              ) : null}
            </li>
          ))}
        </ul>
        {hasMore ? (
          <button type="button" className="mt-2 text-sm text-blue-600 underline" onClick={onLoadMore}>
            Tải thêm
          </button>
        ) : null}
      </div>

      <div className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
        <h3 className="text-sm font-medium">Check-in</h3>
        <textarea
          className="mt-2 w-full rounded border border-zinc-300 px-2 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
          rows={3}
          placeholder="Bình luận (có thể chỉ text)"
          value={checkText}
          onChange={(e) => setCheckText(e.target.value)}
        />
        <input
          type="file"
          accept="image/*"
          className="mt-2 block w-full text-sm"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        {file ? <p className="mt-1 text-xs text-zinc-500">Đã chọn: {file.name}</p> : null}
        <button
          type="button"
          disabled={submitState === "sending"}
          className="mt-3 w-full rounded bg-zinc-900 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
          onClick={onSubmit}
        >
          {submitState === "sending" ? "Đang gửi…" : "Gửi (pending duyệt)"}
        </button>
        {submitState === "done" ? (
          <p className="mt-2 text-sm text-emerald-700">Đã gửi — chờ BTC duyệt.</p>
        ) : null}
        {submitState === "err" ? (
          <p className="mt-2 text-sm text-red-600">Lỗi — thử lại hoặc kiểm tra Firebase Auth (Anonymous).</p>
        ) : null}
      </div>
    </div>
  );
}
