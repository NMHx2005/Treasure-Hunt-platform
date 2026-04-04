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
} from "firebase/firestore";
import type { Region } from "@/types/models";
import { getDb } from "@/lib/firebase";
import { slugify } from "@/lib/slug";

type RegionDoc = Region & { id: string };

export default function AdminRegionsPage() {
  const db = useMemo(() => getDb(), []);
  const [rows, setRows] = useState<RegionDoc[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "regions"), orderBy("name"));
    const unsub = onSnapshot(q, (snap) => {
      setRows(
        snap.docs.map((d) => {
          const data = d.data() as Region;
          return { id: d.id, ...data };
        }),
      );
    });
    return () => unsub();
  }, [db]);

  async function createRegion(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const s = slug.trim() || slugify(name);
    if (!s) {
      setError("Cần tên hoặc slug.");
      return;
    }
    const latN = lat.trim() ? Number.parseFloat(lat) : NaN;
    const lngN = lng.trim() ? Number.parseFloat(lng) : NaN;
    await addDoc(collection(db, "regions"), {
      name: name.trim(),
      slug: s,
      order: 0,
      ...(Number.isFinite(latN) && Number.isFinite(lngN)
        ? { defaultCenter: { lat: latN, lng: lngN } }
        : {}),
      createdAt: serverTimestamp(),
    });
    setName("");
    setSlug("");
    setLat("");
    setLng("");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Khu vực (regions)</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Collection <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">regions</code> — đối chiếu{" "}
          <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">02-implementation-traceability</code>.
        </p>
      </div>

      <form onSubmit={createRegion} className="space-y-3 rounded border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="font-medium text-zinc-900 dark:text-zinc-50">Thêm khu vực</h2>
        <label className="block text-sm">
          Tên
          <input
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          Slug
          <input
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="tu-dong-tu-ten"
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-sm">
            defaultCenter.lat (tuỳ chọn)
            <input
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              inputMode="decimal"
            />
          </label>
          <label className="block text-sm">
            defaultCenter.lng (tuỳ chọn)
            <input
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              inputMode="decimal"
            />
          </label>
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          className="rounded bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Tạo
        </button>
      </form>

      <ul className="divide-y divide-zinc-200 rounded border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-50">{r.name}</p>
              <p className="text-xs text-zinc-500">
                slug: {r.slug} · id: {r.id}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="text-sm text-red-600"
                onClick={() => deleteDoc(doc(db, "regions", r.id))}
              >
                Xóa
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
