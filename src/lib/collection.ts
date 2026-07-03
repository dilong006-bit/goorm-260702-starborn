import type { SavedUniverse } from "./types";
import { supabase } from "./supabaseClient";

const KEY = "starborn:collection:v1";
const MIGRATED_KEY = "starborn:migrated:v1";

/**
 * 컬렉션 데이터 계층 (D2·D6).
 * - 익명: localStorage(`starborn:collection:v1`)만 사용 — 오늘과 동일.
 * - 로그인: Supabase `universes`가 진실원. localStorage는 즉시 읽기용 **미러**로 계속 유지
 *   (hasCollection/streakDays/isSaved의 동기 접근을 위해).
 * - get/save/remove는 async(Promise). 동기 헬퍼(hasCollection·streakDays·isSaved)는 미러를 읽는다.
 *
 * setCurrentUser(userId)로 세션을 주입한다. userId가 있고 supabase가 있으면 원격을 쓴다.
 */

let currentUserId: string | null = null;

/** 세션 주입 — App이 로그인/로그아웃 시 호출. */
export function setCurrentUser(userId: string | null): void {
  currentUserId = userId;
}

function useRemote(): boolean {
  return !!supabase && !!currentUserId;
}

// ── localStorage 미러 (동기) ────────────────────────────
function getLocal(): SavedUniverse[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as SavedUniverse[]) : [];
  } catch {
    return [];
  }
}

function setLocal(list: SavedUniverse[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // 프라이빗 모드 등 — 앱은 죽지 않는다
  }
}

/** 즉시(동기) 읽기용 미러 스냅샷. 초기 렌더/첫화면 분기·스트릭에 사용. */
export function getLocalCollection(): SavedUniverse[] {
  return getLocal();
}

export function hasCollection(): boolean {
  return getLocal().length > 0;
}

export function isSaved(id: string): boolean {
  return getLocal().some((x) => x.id === id);
}

// ── Supabase 행 매핑 ────────────────────────────────────
/* eslint-disable @typescript-eslint/no-explicit-any */
function toRow(u: SavedUniverse, userId: string): Record<string, any> {
  return {
    id: u.id,
    user_id: userId,
    apod_date: u.apodDate,
    input_date: u.inputDate,
    occasion: u.occasion,
    label: u.label ?? null,
    name: u.name ?? null,
    tone: u.tone,
    title: u.title,
    image_url: u.imageUrl,
    story: u.story,
    mood: u.mood ?? null,
    feeling_note: u.feelingNote ?? null,
    day_type: u.dayType ?? null,
    reactions: u.reactions ?? [],
    saved_at: u.savedAt || new Date().toISOString(),
    // stickers/drawing은 값이 있을 때만 포함 → 마이그레이션 전에도 장식 없는 저장은 깨지지 않음
    ...(u.stickers?.length ? { stickers: u.stickers } : {}),
    ...(u.drawing?.length ? { drawing: u.drawing } : {}),
  };
}

function fromRow(r: Record<string, any>): SavedUniverse {
  return {
    id: r.id,
    apodDate: r.apod_date,
    inputDate: r.input_date,
    occasion: r.occasion,
    label: r.label ?? undefined,
    name: r.name ?? undefined,
    tone: r.tone,
    title: r.title,
    imageUrl: r.image_url ?? null,
    story: r.story,
    mood: r.mood ?? undefined,
    feelingNote: r.feeling_note ?? undefined,
    dayType: r.day_type ?? undefined,
    reactions: Array.isArray(r.reactions) ? r.reactions : [],
    stickers: Array.isArray(r.stickers) ? r.stickers : undefined,
    drawing: Array.isArray(r.drawing) ? r.drawing : undefined,
    savedAt: r.saved_at,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ── 공개 async API ──────────────────────────────────────
/** 컬렉션 전체(최신순). 로그인 시 원격 조회 후 미러 갱신, 아니면 로컬. */
export async function getCollection(): Promise<SavedUniverse[]> {
  if (useRemote()) {
    const { data, error } = await supabase!
      .from("universes")
      .select("*")
      .eq("user_id", currentUserId!)
      .order("saved_at", { ascending: false });
    if (!error && data) {
      const list = data.map(fromRow);
      setLocal(list); // 미러 갱신
      return list;
    }
    // 원격 실패 → 로컬 폴백(오프라인 등)
  }
  return getLocal();
}

/** upsert — 같은 id는 덮어쓰고 최신순 유지. 로컬 미러는 항상 기록, 로그인 시 원격도 기록. */
export async function saveUniverse(u: SavedUniverse): Promise<void> {
  const stamped: SavedUniverse = {
    ...u,
    savedAt: u.savedAt || new Date().toISOString(),
  };
  // 로컬 미러(즉시 반영)
  setLocal([stamped, ...getLocal().filter((x) => x.id !== stamped.id)]);
  // 원격
  if (useRemote()) {
    await supabase!
      .from("universes")
      .upsert(toRow(stamped, currentUserId!), { onConflict: "user_id,id" });
  }
}

export async function removeUniverse(id: string): Promise<void> {
  setLocal(getLocal().filter((x) => x.id !== id));
  if (useRemote()) {
    await supabase!
      .from("universes")
      .delete()
      .eq("user_id", currentUserId!)
      .eq("id", id);
  }
}

/**
 * 로그인 직후 1회 — 로컬 항목을 원격으로 bulk upsert하고, 원격 전체를 미러로 되읽는다.
 * (id 충돌 시 서버 우선은 별도 정책 없이 upsert; 로컬을 올려 dedupe)
 */
export async function migrateLocalToRemote(userId: string): Promise<void> {
  if (!supabase) return;
  if (localStorage.getItem(MIGRATED_KEY) === "true") return;
  const local = getLocal();
  if (local.length > 0) {
    const rows = local.map((u) => toRow(u, userId));
    const { error } = await supabase
      .from("universes")
      .upsert(rows, { onConflict: "user_id,id" });
    if (error) return; // 실패 시 플래그 미설정 → 다음 로그인에 재시도
  }
  try {
    localStorage.setItem(MIGRATED_KEY, "true");
  } catch {
    // 무시
  }
}

/** Date → 로컬 기준 YYYY-MM-DD */
function localDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * On This Day(F2.2) — 오늘과 (월,일)이 같은 과거 저장분(연도 무관, 오늘 날짜 제외).
 * 미러 기준(동기). 최신 inputDate 순.
 */
export function getOnThisDay(): SavedUniverse[] {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const today = localDayKey(now);
  return getLocal()
    .filter((u) => {
      const p = u.inputDate?.split("-");
      return p?.length === 3 && p[1] === mm && p[2] === dd && u.inputDate !== today;
    })
    .sort((a, b) => b.inputDate.localeCompare(a.inputDate));
}

/**
 * 연속 저장일(스트릭) — 미러 기준(동기).
 * 오늘 저장이 없어도 어제까지 이어졌으면 유지(하루 유예).
 */
export function streakDays(): number {
  const days = new Set(getLocal().map((u) => localDayKey(new Date(u.savedAt))));
  if (days.size === 0) return 0;

  const cursor = new Date();
  if (!days.has(localDayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(localDayKey(cursor))) return 0;
  }

  let count = 0;
  while (days.has(localDayKey(cursor))) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}
