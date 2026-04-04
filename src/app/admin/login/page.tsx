"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getDb, getFirebaseAuth } from "@/lib/firebase";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const adminSnap = await getDoc(doc(getDb(), "admins", cred.user.uid));
      if (!adminSnap.exists()) {
        await signOut(getFirebaseAuth());
        setError("Tài khoản không có trong collection admins.");
        return;
      }
      router.replace("/admin/regions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Đăng nhập BTC</h1>
      <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-3">
        <label className="text-sm text-zinc-600 dark:text-zinc-400">
          Email
          <input
            type="email"
            autoComplete="username"
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="text-sm text-zinc-600 dark:text-zinc-400">
          Mật khẩu
          <input
            type="password"
            autoComplete="current-password"
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {loading ? "Đang đăng nhập…" : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
}
