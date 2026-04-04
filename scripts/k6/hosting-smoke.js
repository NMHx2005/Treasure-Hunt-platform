/**
 * Smoke load: GET trang tĩnh Hosting (/, /map) — hỗ trợ đánh giá sơ bộ NF-02.
 *
 * Chạy: BASE_URL=https://your-project.web.app k6 run scripts/k6/hosting-smoke.js
 *
 * Tuỳ chỉnh: stages / vus theo kịch bản BTC.
 */
import http from "k6/http";
import { check, sleep } from "k6";

const base = __ENV.BASE_URL || "https://example.web.app";

export const options = {
  stages: [
    { duration: "30s", target: 50 },
    { duration: "1m", target: 100 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<8000"],
  },
};

export default function hostingSmoke() {
  const paths = ["/", "/map"];
  for (const p of paths) {
    const res = http.get(`${base.replace(/\/$/, "")}${p}`, {
      tags: { name: p },
    });
    check(res, {
      [`${p} status 200`]: (r) => r.status === 200,
    });
  }
  sleep(1);
}
