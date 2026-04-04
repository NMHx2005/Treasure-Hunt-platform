"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import type { Spot } from "@/types/models";
import { getDb, getFirebaseStorage } from "@/lib/firebase";

type SpotDoc = Spot & { id: string };

type RegionRow = { id: string; name: string };

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

  async function createSpot(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const la = Number.parseFloat(lat);
    const ln = Number.parseFloat(lng);
    if (!Number.isFinite(la) || !Number.isFinite(ln)) {
      setError("Lat/lng không hợp lệ.");
      return;
    }
    if (!newRegionId) {
      setError("Chọn khu vực.");
      return;
    }
    const refDoc = await addDoc(collection(db, "spots"), {
      regionId: newRegionId,
      name: name.trim(),
      lat: la,
      lng: ln,
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
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Điểm (spots)</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Ảnh minh họa: Storage <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">spots/{"{spotId}"}/cover.jpg</code>
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
          Ảnh minh họa (tuỳ chọn)
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
            <li key={s.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:justify-between">
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-xs text-zinc-500">
                  {s.lat.toFixed(5)}, {s.lng.toFixed(5)} · regionId: {s.regionId}
                </p>
              </div>
              <button
                type="button"
                className="text-sm text-red-600"
                onClick={() => deleteDoc(doc(db, "spots", s.id))}
              >
                Xóa
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
