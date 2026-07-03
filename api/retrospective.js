import {
  getUserIdFromToken,
  getUniversesInRange,
  insertRetrospective,
} from "./_lib/supabaseAdmin.js";
import { callRetrospective } from "./_lib/claude.js";

const MOOD_KEYS = ["radiant", "calm", "drift", "cloudy", "storm"];

// POST /api/retrospective  headers: Authorization: Bearer <access_token>
// body: { period: "week" | "month" }
// JWT 검증 → 기간 내 universes 조회(service_role) → mood 분포+메모 → Claude 회고 → 저장
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const authz = req.headers.authorization || "";
  const token = authz.startsWith("Bearer ") ? authz.slice(7) : "";
  if (!token) return res.status(401).json({ error: "auth_required" });

  const userId = await getUserIdFromToken(token);
  if (!userId) return res.status(401).json({ error: "invalid_token" });

  const period = req.body?.period === "month" ? "month" : "week";
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - (period === "month" ? 29 : 6));
  const rangeStart = start.toISOString().slice(0, 10);
  const rangeEnd = now.toISOString().slice(0, 10);
  const startISO = `${rangeStart}T00:00:00.000Z`;
  const endISO = now.toISOString();

  const rows = await getUniversesInRange(userId, startISO, endISO);
  if (!rows.length) {
    return res.status(200).json({ empty: true, period, rangeStart, rangeEnd });
  }

  const moodSummary = Object.fromEntries(MOOD_KEYS.map((k) => [k, 0]));
  const notes = [];
  for (const r of rows) {
    if (r.mood && moodSummary[r.mood] !== undefined) moodSummary[r.mood] += 1;
    if (r.feeling_note) notes.push(r.feeling_note);
    else if (r.title) notes.push(r.title);
  }

  let text;
  try {
    const out = await callRetrospective({ period, moodSummary, notes });
    text = out.text;
  } catch (e) {
    if (e.code === "ANTHROPIC_API_KEY_MISSING") {
      return res.status(500).json({ error: e.code });
    }
    return res.status(502).json({ error: "retrospective_failed" });
  }

  await insertRetrospective({
    user_id: userId,
    period,
    range_start: rangeStart,
    range_end: rangeEnd,
    text,
    mood_summary: moodSummary,
  });

  return res.status(200).json({
    empty: false,
    period,
    rangeStart,
    rangeEnd,
    text,
    moodSummary,
    count: rows.length,
  });
}
