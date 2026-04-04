import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Treasure Hunt Event Platform</h1>
        <p className="mt-2 max-w-lg text-zinc-600 dark:text-zinc-400">
          Bản đồ công khai, check-in chờ duyệt, admin CRUD khu vực/điểm — đối chiếu{" "}
          <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">planning/02-implementation-traceability.md</code>.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        <Link
          href="/map"
          className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Mở bản đồ (/map)
        </Link>
        <Link
          href="/admin/login"
          className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium dark:border-zinc-600"
        >
          Admin (/admin/login)
        </Link>
      </div>
    </main>
  );
}
