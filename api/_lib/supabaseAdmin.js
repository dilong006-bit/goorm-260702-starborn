import { createClient } from "@supabase/supabase-js";

// ⚠️ 서버 전용 클라이언트 — service_role 키 사용(RLS 우회).
//    이 모듈은 api/_lib 아래에 있어 서버리스 엔드포인트로 노출되지 않는다.
//    절대 클라이언트 번들로 import 되어선 안 된다.
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 키가 없으면 캐시 비활성(null) — NASA 호출 자체는 가능하므로 graceful degrade.
const admin =
  url && serviceKey
    ? createClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

export function isCacheEnabled() {
  return admin !== null;
}

/** apod_cache 단건 조회. miss/오류/비활성 시 null. */
export async function getApodCache(date) {
  if (!admin) return null;
  const { data, error } = await admin
    .from("apod_cache")
    .select("*")
    .eq("date", date)
    .maybeSingle();
  if (error) {
    console.error("[supabaseAdmin] getApodCache error:", error.message);
    return null;
  }
  return data;
}

/** apod_cache upsert(멱등). 동시 요청 race를 conflict 무시로 흡수. */
export async function upsertApodCache(row) {
  if (!admin) return;
  const { error } = await admin
    .from("apod_cache")
    .upsert(row, { onConflict: "date", ignoreDuplicates: true });
  if (error) {
    // 캐시 실패는 사용자 경험을 막지 않는다 — 로깅만.
    console.error("[supabaseAdmin] upsertApodCache error:", error.message);
  }
}

/** story_cache 단건 조회 (date+tone). miss/오류/비활성 시 null. */
export async function getStoryCache(date, tone) {
  if (!admin) return null;
  const { data, error } = await admin
    .from("story_cache")
    .select("*")
    .eq("apod_date", date)
    .eq("tone", tone)
    .maybeSingle();
  if (error) {
    console.error("[supabaseAdmin] getStoryCache error:", error.message);
    return null;
  }
  return data;
}

/** story_cache upsert(멱등). (apod_date, tone) unique 충돌은 무시. */
export async function upsertStoryCache(date, tone, storyText, model) {
  if (!admin) return;
  const { error } = await admin.from("story_cache").upsert(
    { apod_date: date, tone, story_text: storyText, model },
    { onConflict: "apod_date,tone", ignoreDuplicates: true }
  );
  if (error) {
    console.error("[supabaseAdmin] upsertStoryCache error:", error.message);
  }
}

// ── v2 회고(F2.3) ───────────────────────────────────────
/** access_token(JWT) → user id. 유효하지 않으면 null. */
export async function getUserIdFromToken(token) {
  if (!admin || !token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user.id;
}

/** 기간 내(saved_at) 유저 우주 조회 — 회고 재료. */
export async function getUniversesInRange(userId, startISO, endISO) {
  if (!admin) return [];
  const { data, error } = await admin
    .from("universes")
    .select("input_date, mood, day_type, feeling_note, title, saved_at")
    .eq("user_id", userId)
    .gte("saved_at", startISO)
    .lte("saved_at", endISO)
    .order("saved_at", { ascending: true });
  if (error) {
    console.error("[supabaseAdmin] getUniversesInRange error:", error.message);
    return [];
  }
  return data || [];
}

/** 회고 저장. */
export async function insertRetrospective(row) {
  if (!admin) return;
  const { error } = await admin.from("retrospectives").insert(row);
  if (error) {
    console.error("[supabaseAdmin] insertRetrospective error:", error.message);
  }
}
