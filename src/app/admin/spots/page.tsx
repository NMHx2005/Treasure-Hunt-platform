"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type Firestore,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes, type FirebaseStorage } from "firebase/storage";
import type { Spot } from "@/types/models";
import { getDb, getFirebaseStorage } from "@/lib/firebase";
import { GEO_HINT, parseRequiredLatLng } from "@/lib/geo";
import { storagePathFromDownloadUrl } from "@/lib/storage-path";

type SpotDoc = Spot & { id: string };

type RegionRow = { id: string; name: string };

const SPOT_NAME_MAX = 200;

function SpotEditPanel({
  spot,
  regions,
  db,
  storage,
  onClose,
}: {
  spot: SpotDoc;
  regions: RegionRow[];
  db: Firestore;
  storage: FirebaseStorage;
  onClose: () => void;
}) {
  const [name, setName] = useState(spot.name);
  const [regionId, setRegionId] = useState(spot.regionId);
  const [lat, setLat] = useState(String(spot.lat));
  const [lng, setLng] = useState(String(spot.lng));
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setName(spot.name);
    setRegionId(spot.regionId);
    setLat(String(spot.lat));
    setLng(String(spot.lng));
    setCoverFile(null);
    setErr(null);
  }, [spot.id, spot.name, spot.regionId, spot.lat, spot.lng]);

  const galleryList = spot.galleryUrls ?? [];

  const saveCore = useCallback(async () => {
    const n = name.trim();
    if (!n) {
      setErr("Tên điểm không được để trống.");
      return false;
    }
    if (n.length > SPOT_NAME_MAX) {
      setErr(`Tên tối đa ${SPOT_NAME_MAX} ký tự.`);
      return false;
    }
    const coords = parseRequiredLatLng(lat, lng);
    if (!coords) {
      setErr(`Tọa độ không hợp lệ. ${GEO_HINT}`);
      return false;
    }
    if (!regionId) {
      setErr("Chọn khu vực.");
      return false;
    }
    await updateDoc(doc(db, "spots", spot.id), {
      name: n,
      regionId,
      lat: coords.lat,
      lng: coords.lng,
      updatedAt: serverTimestamp(),
    });
    return true;
  }, [db, lat, lng, name, regionId, spot.id]);

  async function onSaveAll(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const ok = await saveCore();
      if (!ok) return;
      if (coverFile) {
        const path = `spots/${spot.id}/cover.jpg`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, coverFile, { contentType: coverFile.type || "image/jpeg" });
        const url = await getDownloadURL(storageRef);
        await updateDoc(doc(db, "spots", spot.id), {
          imageUrl: url,
          updatedAt: serverTimestamp(),
        });
        setCoverFile(null);
      }
      onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Lưu thất bại.");
    } finally {
      setBusy(false);
    }
  }

  async function removeCover() {
    setErr(null);
    setBusy(true);
    try {
      try {
        await deleteObject(ref(storage, `spots/${spot.id}/cover.jpg`));
      } catch {
        /* file có thể không tồn tại */
      }
      await updateDoc(doc(db, "spots", spot.id), {
        imageUrl: null,
        updatedAt: serverTimestamp(),
      });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Không xóa được ảnh bìa.");
    } finally {
      setBusy(false);
    }
  }

  async function addGalleryFiles(files: FileList | null) {
    if (!files?.length) return;
    setErr(null);
    setBusy(true);
    try {
      const list = Array.from(files);
      for (const f of list) {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        const path = `spots/${spot.id}/gallery/${id}.jpg`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, f, { contentType: f.type || "image/jpeg" });
        const url = await getDownloadURL(storageRef);
        await updateDoc(doc(db, "spots", spot.id), {
          galleryUrls: arrayUnion(url),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Tải gallery thất bại.");
    } finally {
      setBusy(false);
    }
  }

  async function removeGalleryUrl(url: string) {
    setErr(null);
    setBusy(true);
    try {
      const path = storagePathFromDownloadUrl(url);
      if (path?.startsWith(`spots/${spot.id}/`)) {
        try {
          await deleteObject(ref(storage, path));
        } catch {
          /* ignore */
        }
      }
      await updateDoc(doc(db, "spots", spot.id), {
        galleryUrls: arrayRemove(url),
        updatedAt: serverTimestamp(),
      });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Không xóa được ảnh gallery.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSaveAll} className="mt-4 space-y-4 rounded-lg border border-amber-200/80 bg-amber-50/40 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Sửa điểm</h3>
      <label className="block text-sm">
        Khu vực
        <select
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
          value={regionId}
          onChange={(e) => setRegionId(e.target.value)}
          required
        >
          {regions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Tên điểm
        <input
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={SPOT_NAME_MAX}
          required
        />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-sm">
          Lat
          <input
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            required
          />
        </label>
        <label className="text-sm">
          Lng
          <input
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            required
          />
        </label>
      </div>
      <p className="text-xs text-zinc-500">{GEO_HINT}</p>

      <div className="border-t border-zinc-200 pt-3 dark:border-zinc-700">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Ảnh bìa (cover)</p>
        {spot.imageUrl ? (
          <div className="mt-2 flex flex-wrap items-end gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={spot.imageUrl} alt="" className="h-24 rounded-lg object-cover ring-1 ring-zinc-200 dark:ring-zinc-600" />
            <button
              type="button"
              disabled={busy}
              className="text-sm text-red-600 disabled:opacity-50"
              onClick={() => void removeCover()}
            >
              Gỡ ảnh bìa
            </button>
          </div>
        ) : (
          <p className="mt-1 text-xs text-zinc-500">Chưa có ảnh bìa.</p>
        )}
        <label className="mt-2 block text-sm">
          Thay / thêm ảnh bìa
          <input
            type="file"
            accept="image/*"
            className="mt-1 w-full text-sm"
            disabled={busy}
            onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      <div className="border-t border-zinc-200 pt-3 dark:border-zinc-700">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Gallery (thêm nhiều ảnh)</p>
        <p className="text-xs text-zinc-500">Storage: spots/{`{id}`}/gallery/*.jpg</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {galleryList.map((u) => (
            <div key={u} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" className="h-20 w-20 rounded-lg object-cover ring-1 ring-zinc-200 dark:ring-zinc-600" />
              <button
                type="button"
                disabled={busy}
                className="mt-1 block w-full text-xs text-red-600 disabled:opacity-50"
                onClick={() => void removeGalleryUrl(u)}
              >
                Xóa
              </button>
            </div>
          ))}
        </div>
        <label className="mt-2 block text-sm">
          Thêm ảnh vào gallery
          <input
            type="file"
            accept="image/*"
            multiple
            className="mt-1 w-full text-sm"
            disabled={busy}
            onChange={(e) => void addGalleryFiles(e.target.files)}
          />
        </label>
      </div>

      {err ? <p className="text-sm text-red-600">{err}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {busy ? "Đang xử lý…" : "Lưu thông tin & ảnh bìa"}
        </button>
        <button type="button" className="rounded border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-600" onClick={onClose}>
          Đóng
        </button>
      </div>
    </form>
  );
}

export default function AdminSpotsPage() {
  const db = useMemo(() => getDb(), []);
  const storage = useMemo(() => getFirebaseStorage(), []);
  const [regions, setRegions] = useState<RegionRow[]>([]);
  const [spots, setSpots] = useState<SpotDoc[]>([]);
  const [newRegionId, setNewRegionId] = useState("");
  const [filterRegionId, setFilterRegionId] = useState("");
  const [name, setName] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "regions"), orderBy("name")), (snap) => {
      setRegions(snap.docs.map((d) => ({ id: d.id, name: (d.data() as { name: string }).name })));
    });
    return () => unsub();
  }, [db]);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "spots"), orderBy("createdAt", "desc")), (snap) => {
      setSpots(
        snap.docs.map((d) => {
          const data = d.data() as Spot;
          return { id: d.id, ...data };
        }),
      );
    });
    return () => unsub();
  }, [db]);

  const filtered = useMemo(() => {
    if (!filterRegionId) return spots;
    return spots.filter((s) => s.regionId === filterRegionId);
  }, [spots, filterRegionId]);

  const editingSpot = editingId ? spots.find((s) => s.id === editingId) : undefined;

  async function createSpot(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const n = name.trim();
    if (!n) {
      setError("Nhập tên điểm.");
      return;
    }
    if (n.length > SPOT_NAME_MAX) {
      setError(`Tên tối đa ${SPOT_NAME_MAX} ký tự.`);
      return;
    }
    const coords = parseRequiredLatLng(lat, lng);
    if (!coords) {
      setError(`Lat/lng không hợp lệ. ${GEO_HINT}`);
      return;
    }
    if (!newRegionId) {
      setError("Chọn khu vực.");
      return;
    }
    try {
      const refDoc = await addDoc(collection(db, "spots"), {
        regionId: newRegionId,
        name: n,
        lat: coords.lat,
        lng: coords.lng,
        createdAt: serverTimestamp(),
      });
      if (file) {
        const path = `spots/${refDoc.id}/cover.jpg`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file, { contentType: file.type || "image/jpeg" });
        const url = await getDownloadURL(storageRef);
        await updateDoc(doc(db, "spots", refDoc.id), {
          imageUrl: url,
          updatedAt: serverTimestamp(),
        });
      }
      setName("");
      setLat("");
      setLng("");
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tạo được điểm.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Điểm (spots)</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          CRUD đầy đủ — cover <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">spots/{"{id}"}/cover.jpg</code>, gallery{" "}
          <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">spots/{"{id}"}/gallery/*.jpg</code>. {GEO_HINT}
        </p>
      </div>

      <form onSubmit={createSpot} className="space-y-3 rounded border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="font-medium">Thêm điểm</h2>
        <label className="block text-sm">
          Khu vực
          <select
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
            value={newRegionId}
            onChange={(e) => setNewRegionId(e.target.value)}
            required
          >
            <option value="">— chọn —</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Tên điểm
          <input
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={SPOT_NAME_MAX}
            required
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-sm">
            Lat
            <input
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              required
            />
          </label>
          <label className="text-sm">
            Lng
            <input
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              required
            />
          </label>
        </div>
        <label className="block text-sm">
          Ảnh bìa (tuỳ chọn)
          <input
            type="file"
            accept="image/*"
            className="mt-1 w-full text-sm"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">
          Tạo điểm
        </button>
      </form>

      <div>
        <label className="mb-2 block text-sm text-zinc-600 dark:text-zinc-400">
          Lọc theo khu vực
          <select
            className="mt-1 w-full max-w-xs rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
            value={filterRegionId}
            onChange={(e) => setFilterRegionId(e.target.value)}
          >
            <option value="">Tất cả</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <ul className="divide-y divide-zinc-200 rounded border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {filtered.map((s) => (
            <li key={s.id} className="p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                <div className="flex gap-3">
                  {s.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.imageUrl}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-lg object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
                    />
                  ) : null}
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-zinc-500">
                      {s.lat.toFixed(5)}, {s.lng.toFixed(5)} · regionId: {s.regionId}
                    </p>
                    {(s.galleryUrls?.length ?? 0) > 0 ? (
                      <p className="text-xs text-zinc-500">gallery: {s.galleryUrls?.length} ảnh</p>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="text-sm font-medium text-amber-700 dark:text-amber-400"
                    onClick={() => setEditingId(editingId === s.id ? null : s.id)}
                  >
                    {editingId === s.id ? "Thu gọn" : "Sửa"}
                  </button>
                  <button
                    type="button"
                    className="text-sm text-red-600"
                    onClick={() => {
                      if (
                        confirm(
                          `Xóa điểm “${s.name}”? Ảnh trên Storage (cover + gallery) có thể cần xóa tay nếu muốn dọn bucket.`,
                        )
                      ) {
                        void deleteDoc(doc(db, "spots", s.id));
                        setEditingId((id) => (id === s.id ? null : id));
                      }
                    }}
                  >
                    Xóa
                  </button>
                </div>
              </div>
              {editingSpot && editingSpot.id === s.id ? (
                <SpotEditPanel spot={editingSpot} regions={regions} db={db} storage={storage} onClose={() => setEditingId(null)} />
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
