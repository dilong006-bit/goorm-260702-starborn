import type { SavedUniverse } from "./types";

const KEY = "starborn:collection:v1";

/** 저장된 컬렉션 전체(최신순). 파싱 실패 시 빈 배열. */
export function getCollection(): SavedUniverse[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as SavedUniverse[]) : [];
  } catch {
    return [];
  }
}

export function hasCollection(): boolean {
  return getCollection().length > 0;
}

/** upsert — 같은 id는 제거 후 맨 앞에 다시 넣어 중복을 막고 최신순을 유지한다. */
export function saveUniverse(u: SavedUniverse): SavedUniverse[] {
  const list = getCollection().filter((x) => x.id !== u.id);
  const next = [u, ...list];
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // 프라이빗 모드 등 저장 실패 — 앱은 죽지 않는다
  }
  return next;
}

export function removeUniverse(id: string): SavedUniverse[] {
  const next = getCollection().filter((x) => x.id !== id);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // 저장 실패 무시
  }
  return next;
}

export function isSaved(id: string): boolean {
  return getCollection().some((x) => x.id === id);
}

/** Date → 로컬 기준 YYYY-MM-DD */
function localDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * 연속 저장일(스트릭).
 * savedAt들의 로컬 날짜 집합에서, 오늘(또는 어제)부터 하루씩 거슬러 올라가며
 * 끊기지 않는 연속 길이를 센다. 오늘 저장이 없어도 어제까지 이어졌으면 유지된다.
 */
export function streakDays(): number {
  const days = new Set(
    getCollection().map((u) => localDayKey(new Date(u.savedAt)))
  );
  if (days.size === 0) return 0;

  const cursor = new Date();
  // 오늘 저장이 없으면 어제부터 세기 시작(하루 유예)
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
