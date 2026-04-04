"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  deleteField,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import type { Region } from "@/types/models";
import { getDb } from "@/lib/firebase";
import { GEO_HINT, parseOptionalBounds, parseOptionalLatLng } from "@/lib/geo";
import { slugify } from "@/lib/slug";

type RegionDoc = Region & { id: string };

type EditForm = {
  id: string;
  name: string;
  slug: string;
  order: string;
  lat: string;
  lng: string;
  neLat: string;
  neLng: string;
  swLat: string;
  swLng: string;
};

function regionToEdit(r: RegionDoc): EditForm {
  const c = r.defaultCenter;
  const b = r.defaultBounds;
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    order: String(r.order ?? 0),
    lat: c ? String(c.lat) : "",
    lng: c ? String(c.lng) : "",
    neLat: b ? String(b.ne.lat) : "",
    neLng: b ? String(b.ne.lng) : "",
    swLat: b ? String(b.sw.lat) : "",
    swLng: b ? String(b.sw.lng) : "",
  };
}

export default function AdminRegionsPage() {
  const db = useMemo(() => getDb(), []);
  const [rows, setRows] = useState<RegionDoc[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [orderStr, setOrderStr] = useState("0");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [neLat, setNeLat] = useState("");
  const [neLng, setNeLng] = useState("");
  const [swLat, setSwLat] = useState("");
  const [swLng, setSwLng] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);

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

  function validateAndBuildRegionPayload(): Record<string, unknown> | null {
    const s = slug.trim() || slugify(name);
    if (!s) {
      setError("Cần tên hoặc slug.");
      return null;
    }
    const center = parseOptionalLatLng(lat, lng);
    if (center === "partial") {
      setError("defaultCenter: nhập đủ lat và lng, hoặc để trống cả hai.");
      return null;
    }
    if (center === "invalid") {
      setError(`defaultCenter không hợp lệ. ${GEO_HINT}`);
      return null;
    }
    const bounds = parseOptionalBounds(neLat, neLng, swLat, swLng);
    if (bounds === "partial") {
      setError("defaultBounds: nhập đủ 4 ô (NE lat/lng, SW lat/lng) hoặc để trống cả bốn.");
      return null;
    }
    if (bounds === "invalid") {
      setError(`defaultBounds không hợp lệ. ${GEO_HINT}`);
      return null;
    }
    const orderNum = Number.parseInt(orderStr.trim(), 10);
    const order = Number.isFinite(orderNum) ? orderNum : 0;
    const payload: Record<string, unknown> = {
      name: name.trim(),
      slug: s,
      order,
      createdAt: serverTimestamp(),
    };
    if (center) payload.defaultCenter = center;
    if (bounds) payload.defaultBounds = bounds;
    return payload;
  }

  async function createRegion(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = validateAndBuildRegionPayload();
    if (!payload) return;
    try {
      await addDoc(collection(db, "regions"), payload);
      setName("");
      setSlug("");
      setOrderStr("0");
      setLat("");
      setLng("");
      setNeLat("");
      setNeLng("");
      setSwLat("");
      setSwLng("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tạo được.");
    }
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!edit) return;
    setError(null);
    setSaving(true);
    try {
      const s = edit.slug.trim();
      if (!s) {
        setError("Slug không được để trống.");
        return;
      }
      const center = parseOptionalLatLng(edit.lat, edit.lng);
      if (center === "partial") {
        setError("defaultCenter: nhập đủ lat và lng, hoặc để trống cả hai.");
        return;
      }
      if (center === "invalid") {
        setError(`defaultCenter không hợp lệ. ${GEO_HINT}`);
        return;
      }
      const bounds = parseOptionalBounds(edit.neLat, edit.neLng, edit.swLat, edit.swLng);
      if (bounds === "partial") {
        setError("defaultBounds: nhập đủ 4 ô hoặc để trống cả bốn.");
        return;
      }
      if (bounds === "invalid") {
        setError(`defaultBounds không hợp lệ. ${GEO_HINT}`);
        return;
      }
      const orderNum = Number.parseInt(edit.order.trim(), 10);
      const order = Number.isFinite(orderNum) ? orderNum : 0;

      const payload: Record<string, unknown> = {
        name: edit.name.trim(),
        slug: s,
        order,
        updatedAt: serverTimestamp(),
      };
      if (center) payload.defaultCenter = center;
      else payload.defaultCenter = deleteField();
      if (bounds) payload.defaultBounds = bounds;
      else payload.defaultBounds = deleteField();

      await updateDoc(doc(db, "regions", edit.id), payload);
      setEdit(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Khu vực (regions)</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          CRUD đầy đủ — <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">defaultCenter</code>,{" "}
          <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">defaultBounds</code>,{" "}
          <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">order</code>. {GEO_HINT}
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
        <label className="block text-sm">
          Thứ tự hiển thị (order)
          <input
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
            type="number"
            value={orderStr}
            onChange={(e) => setOrderStr(e.target.value)}
          />
        </label>
        <p className="text-xs font-medium text-zinc-500">defaultCenter (tuỳ chọn)</p>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-sm">
            Lat
            <input
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              inputMode="decimal"
            />
          </label>
          <label className="block text-sm">
            Lng
            <input
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              inputMode="decimal"
            />
          </label>
        </div>
        <p className="text-xs font-medium text-zinc-500">defaultBounds — góc Đông Bắc &amp; Tây Nam (tuỳ chọn)</p>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-sm">
            NE lat
            <input
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
              value={neLat}
              onChange={(e) => setNeLat(e.target.value)}
              inputMode="decimal"
            />
          </label>
          <label className="block text-sm">
            NE lng
            <input
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
              value={neLng}
              onChange={(e) => setNeLng(e.target.value)}
              inputMode="decimal"
            />
          </label>
          <label className="block text-sm">
            SW lat
            <input
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
              value={swLat}
              onChange={(e) => setSwLat(e.target.value)}
              inputMode="decimal"
            />
          </label>
          <label className="block text-sm">
            SW lng
            <input
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
              value={swLng}
              onChange={(e) => setSwLng(e.target.value)}
              inputMode="decimal"
            />
          </label>
        </div>
        {error && !edit ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          className="rounded bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Tạo
        </button>
      </form>

      <ul className="divide-y divide-zinc-200 rounded border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {rows.map((r) => (
          <li key={r.id} className="p-4">
            {edit?.id === r.id ? (
              <form onSubmit={saveEdit} className="space-y-3">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Sửa khu vực</h3>
                <label className="block text-sm">
                  Tên
                  <input
                    className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
                    value={edit.name}
                    onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                    required
                  />
                </label>
                <label className="block text-sm">
                  Slug
                  <input
                    className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
                    value={edit.slug}
                    onChange={(e) => setEdit({ ...edit, slug: e.target.value })}
                    required
                  />
                </label>
                <label className="block text-sm">
                  Order
                  <input
                    className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
                    type="number"
                    value={edit.order}
                    onChange={(e) => setEdit({ ...edit, order: e.target.value })}
                  />
                </label>
                <p className="text-xs text-zinc-500">defaultCenter</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
                    placeholder="lat"
                    value={edit.lat}
                    onChange={(e) => setEdit({ ...edit, lat: e.target.value })}
                  />
                  <input
                    className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
                    placeholder="lng"
                    value={edit.lng}
                    onChange={(e) => setEdit({ ...edit, lng: e.target.value })}
                  />
                </div>
                <p className="text-xs text-zinc-500">defaultBounds (NE / SW)</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
                    placeholder="NE lat"
                    value={edit.neLat}
                    onChange={(e) => setEdit({ ...edit, neLat: e.target.value })}
                  />
                  <input
                    className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
                    placeholder="NE lng"
                    value={edit.neLng}
                    onChange={(e) => setEdit({ ...edit, neLng: e.target.value })}
                  />
                  <input
                    className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
                    placeholder="SW lat"
                    value={edit.swLat}
                    onChange={(e) => setEdit({ ...edit, swLat: e.target.value })}
                  />
                  <input
                    className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
                    placeholder="SW lng"
                    value={edit.swLng}
                    onChange={(e) => setEdit({ ...edit, swLng: e.target.value })}
                  />
                </div>
                {error && edit ? <p className="text-sm text-red-600">{error}</p> : null}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    {saving ? "Đang lưu…" : "Lưu"}
                  </button>
                  <button
                    type="button"
                    className="rounded border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-600"
                    onClick={() => {
                      setEdit(null);
                      setError(null);
                    }}
                  >
                    Huỷ
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">{r.name}</p>
                  <p className="text-xs text-zinc-500">
                    slug: {r.slug} · order: {r.order ?? 0} · id: {r.id}
                  </p>
                  {r.defaultCenter ? (
                    <p className="text-xs text-zinc-500">
                      center: {r.defaultCenter.lat}, {r.defaultCenter.lng}
                    </p>
                  ) : null}
                  {r.defaultBounds ? (
                    <p className="text-xs text-zinc-500">
                      bounds: NE {r.defaultBounds.ne.lat},{r.defaultBounds.ne.lng} / SW {r.defaultBounds.sw.lat},
                      {r.defaultBounds.sw.lng}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="text-sm font-medium text-amber-700 dark:text-amber-400"
                    onClick={() => {
                      setError(null);
                      setEdit(regionToEdit(r));
                    }}
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    className="text-sm text-red-600"
                    onClick={() => {
                      if (confirm(`Xóa khu vực “${r.name}”? Spots gắn region vẫn giữ regionId cũ.`)) {
                        void deleteDoc(doc(db, "regions", r.id));
                      }
                    }}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
