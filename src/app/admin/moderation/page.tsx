"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import type { CheckIn } from "@/types/models";
import { getDb, getFirebaseAuth } from "@/lib/firebase";

type Row = CheckIn & { id: string; spotName?: string };

export default function AdminModerationPage() {
  const db = useMemo(() => getDb(), []);
  const [rows, setRows] = useState<Row[]>([]);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});

  useEffect(() => {
    const q = query(
      collection(db, "checkIns"),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      void (async () => {
        const base = snap.docs.map((d) => ({ id: d.id, ...(d.data() as CheckIn) }));
        const withNames = await Promise.all(
          base.map(async (r) => {
            const spotSnap = await getDoc(doc(db, "spots", r.spotId));
            const spotName = spotSnap.exists()
              ? (spotSnap.data() as { name: string }).name
              : r.spotId;
            return { ...r, spotName };
          }),
        );
        setRows(withNames);
      })();
    });
    return () => unsub();
  }, [db]);

  async function approve(id: string) {
    const uid = getFirebaseAuth().currentUser?.uid;
    if (!uid) return;
    await updateDoc(doc(db, "checkIns", id), {
      status: "approved",
      moderatedBy: uid,
      moderatedAt: serverTimestamp(),
    });
  }

  async function reject(id: string) {
    const uid = getFirebaseAuth().currentUser?.uid;
    if (!uid) return;
    const reason = rejectReason[id]?.trim() ?? "";
    await updateDoc(doc(db, "checkIns", id), {
      status: "rejected",
      moderatedBy: uid,
      moderatedAt: serverTimestamp(),
      rejectReason: reason || "—",
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Duyệt check-in</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Collection checkIns — chỉ pending.</p>
      </div>

      <ul className="space-y-4">
        {rows.map((r) => (
          <li key={r.id} className="rounded border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-sm text-zinc-500">
              Điểm: {r.spotName} · {r.createdAt?.toDate?.().toLocaleString?.() ?? ""}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-zinc-900 dark:text-zinc-50">{r.text || "(không text)"}</p>
            {r.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.imageUrl} alt="" className="mt-2 max-h-48 rounded object-contain" />
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded bg-emerald-700 px-3 py-1.5 text-sm text-white"
                onClick={() => void approve(r.id)}
              >
                Approve
              </button>
              <input
                type="text"
                placeholder="Lý do từ chối (tuỳ chọn)"
                className="min-w-[12rem] flex-1 rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                value={rejectReason[r.id] ?? ""}
                onChange={(e) => setRejectReason((prev) => ({ ...prev, [r.id]: e.target.value }))}
              />
              <button
                type="button"
                className="rounded bg-red-700 px-3 py-1.5 text-sm text-white"
                onClick={() => void reject(r.id)}
              >
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
      {rows.length === 0 ? <p className="text-sm text-zinc-500">Không có bản ghi pending.</p> : null}
    </div>
  );
}
