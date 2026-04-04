"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

const REJECT_REASON_MAX = 500;

export default function AdminModerationPage() {
  const db = useMemo(() => getDb(), []);
  const spotNameCache = useRef<Map<string, string>>(new Map());
  const [rows, setRows] = useState<Row[]>([]);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

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
            const cached = spotNameCache.current.get(r.spotId);
            if (cached !== undefined) {
              return { ...r, spotName: cached };
            }
            const spotSnap = await getDoc(doc(db, "spots", r.spotId));
            const spotName = spotSnap.exists()
              ? (spotSnap.data() as { name: string }).name
              : r.spotId;
            spotNameCache.current.set(r.spotId, spotName);
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
    if (!uid || busyId) return;
    setBusyId(id);
    try {
      await updateDoc(doc(db, "checkIns", id), {
        status: "approved",
        moderatedBy: uid,
        moderatedAt: serverTimestamp(),
      });
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    const uid = getFirebaseAuth().currentUser?.uid;
    if (!uid || busyId) return;
    let reason = rejectReason[id]?.trim() ?? "";
    if (reason.length > REJECT_REASON_MAX) {
      reason = reason.slice(0, REJECT_REASON_MAX);
    }
    setBusyId(id);
    try {
      await updateDoc(doc(db, "checkIns", id), {
        status: "rejected",
        moderatedBy: uid,
        moderatedAt: serverTimestamp(),
        rejectReason: reason || "—",
      });
    } finally {
      setBusyId(null);
    }
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
                disabled={busyId !== null}
                className="rounded bg-emerald-700 px-3 py-1.5 text-sm text-white disabled:opacity-50"
                onClick={() => void approve(r.id)}
              >
                {busyId === r.id ? "Đang xử lý…" : "Approve"}
              </button>
              <input
                type="text"
                placeholder="Lý do từ chối (tuỳ chọn)"
                maxLength={REJECT_REASON_MAX}
                className="min-w-48 flex-1 rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-900"
                value={rejectReason[r.id] ?? ""}
                onChange={(e) =>
                  setRejectReason((prev) => ({ ...prev, [r.id]: e.target.value.slice(0, REJECT_REASON_MAX) }))
                }
              />
              <span className="self-center text-xs text-zinc-400">
                {(rejectReason[r.id] ?? "").length}/{REJECT_REASON_MAX}
              </span>
              <button
                type="button"
                disabled={busyId !== null}
                className="rounded bg-red-700 px-3 py-1.5 text-sm text-white disabled:opacity-50"
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
