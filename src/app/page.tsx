import Link from "next/link";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(251,191,36,0.25),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(245,158,11,0.12),transparent)]"
        aria-hidden
      />
      <div className="relative max-w-lg text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">
          Treasure Hunt
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          Nền tảng sự kiện truy tìm kho báu
        </h1>
        <p className="mt-4 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          Bản đồ công khai, check-in chờ duyệt, admin quản lý khu vực và điểm — Next.js, Firebase, Google Maps.
        </p>
      </div>
      <div className="relative mt-10 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/map"
          className="flex min-h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 px-8 text-sm font-bold text-white shadow-lg shadow-amber-600/25 transition hover:from-amber-500 hover:to-orange-500 dark:shadow-amber-900/40"
        >
          Mở bản đồ
        </Link>
        <Link
          href="/admin/login"
          className="flex min-h-12 items-center justify-center rounded-2xl border-2 border-zinc-300 bg-white/80 px-8 text-sm font-bold text-zinc-800 backdrop-blur-sm transition hover:border-amber-400 hover:bg-amber-50/80 dark:border-zinc-600 dark:bg-zinc-900/80 dark:text-zinc-100 dark:hover:border-amber-500 dark:hover:bg-zinc-800"
        >
          Khu vực admin
        </Link>
      </div>
    </main>
  );
}
