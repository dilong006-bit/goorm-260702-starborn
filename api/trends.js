import {
  getRecentGenerationLog,
  getRecentShareEvents,
} from "./_lib/supabaseAdmin.js";

// GET /api/trends — 내부용 추세 집계(generation_log · share_events).
// 유저 데이터 없음(톤/보이스/프로바이더/채널 카운트만). 서버리스에서 service_role로 조회.
export default async function handler(_req, res) {
  const [gen, shares] = await Promise.all([
    getRecentGenerationLog(2000),
    getRecentShareEvents(2000),
  ]);

  const countBy = (rows, key) => {
    const m = {};
    for (const r of rows) {
      const k = r[key] || "unknown";
      m[k] = (m[k] || 0) + 1;
    }
    return m;
  };
  const countByDay = (rows) => {
    const m = {};
    for (const r of rows) {
      const d = String(r.created_at || "").slice(0, 10);
      if (d) m[d] = (m[d] || 0) + 1;
    }
    return m;
  };

  res.setHeader("cache-control", "no-store");
  return res.status(200).json({
    total: gen.length,
    tone: countBy(gen, "tone"),
    voice: countBy(gen, "voice"),
    provider: countBy(gen, "provider"),
    genByDay: countByDay(gen),
    share: { total: shares.length, channel: countBy(shares, "channel") },
  });
}
