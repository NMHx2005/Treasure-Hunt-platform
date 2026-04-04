"use client";

import dynamic from "next/dynamic";

const TreasureMap = dynamic(() => import("@/components/map/TreasureMap"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[50vh] items-center justify-center p-8 text-zinc-500">Đang tải bản đồ…</div>
  ),
});

export function MapPageClient() {
  return <TreasureMap />;
}
