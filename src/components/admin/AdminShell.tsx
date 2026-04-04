"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { getDb, getFirebaseAuth } from "@/lib/firebase";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (isLogin) {
      return;
    }

    const auth = getFirebaseAuth();
    const db = getDb();
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/admin/login");
        setAllowed(false);
        setReady(true);
        return;
      }
      const snap = await getDoc(doc(db, "admins", user.uid));
      if (!snap.exists()) {
        router.replace("/admin/login");
        setAllowed(false);
        setReady(true);
        return;
      }
      setAllowed(true);
      setReady(true);
    });
    return () => unsub();
  }, [isLogin, router]);

  if (isLogin) {
    return <>{children}</>;
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-zinc-600 dark:text-zinc-400">
        Đang kiểm tra phiên đăng nhập…
      </div>
    );
  }

  if (!allowed) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950 md:w-56 md:border-b-0 md:border-r">
        <p className="mb-4 font-semibold text-zinc-900 dark:text-zinc-50">Admin</p>
        <nav className="flex flex-col gap-2 text-sm">
          <Link className="rounded px-2 py-1 hover:bg-zinc-200 dark:hover:bg-zinc-800" href="/admin/regions">
            Khu vực (regions)
          </Link>
          <Link className="rounded px-2 py-1 hover:bg-zinc-200 dark:hover:bg-zinc-800" href="/admin/spots">
            Điểm (spots)
          </Link>
          <Link className="rounded px-2 py-1 hover:bg-zinc-200 dark:hover:bg-zinc-800" href="/admin/moderation">
            Duyệt check-in
          </Link>
          <Link className="rounded px-2 py-1 hover:bg-zinc-200 dark:hover:bg-zinc-800" href="/map">
            Xem map public
          </Link>
        </nav>
        <button
          type="button"
          className="mt-6 w-full rounded border border-zinc-300 px-2 py-2 text-sm dark:border-zinc-600"
          onClick={() => signOut(getFirebaseAuth()).then(() => router.push("/admin/login"))}
        >
          Đăng xuất
        </button>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
