/**
 * 북극성 지표(F1.5) — "저장 → 7일 내 재방문" 경량 계측.
 * Phase 1은 클라이언트(localStorage)만. 서버 집계는 Phase 3(F3.3).
 * 모두 try/catch — 프라이빗 모드에서도 앱은 죽지 않는다.
 */
const VISITS = "starborn:visitDays:v1";
const SAVES = "starborn:saveEvents:v1";
const LAST = "starborn:lastSeen:v1";

function dayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 앱 진입 시 1회 — 오늘 방문일 기록 + 마지막 접속 스탬프. */
export function touchLastSeen(): void {
  try {
    const set = new Set<string>(JSON.parse(localStorage.getItem(VISITS) ?? "[]"));
    set.add(dayKey());
    localStorage.setItem(VISITS, JSON.stringify([...set].slice(-120)));
    localStorage.setItem(LAST, new Date().toISOString());
  } catch {
    // 무시
  }
}

/** 저장(활성화) 이벤트 기록. */
export function recordSave(): void {
  try {
    const list: string[] = JSON.parse(localStorage.getItem(SAVES) ?? "[]");
    list.push(new Date().toISOString());
    localStorage.setItem(SAVES, JSON.stringify(list.slice(-200)));
  } catch {
    // 무시
  }
}

/** 저장 후 7일 내 재방문이 한 번이라도 있었는지(지표 근사). */
export function returnedWithin7DaysOfSave(): boolean {
  try {
    const saves: string[] = JSON.parse(localStorage.getItem(SAVES) ?? "[]");
    const visits: string[] = JSON.parse(localStorage.getItem(VISITS) ?? "[]");
    return saves.some((s) => {
      const start = new Date(s).getTime();
      return visits.some((v) => {
        const diff = (new Date(`${v}T00:00:00`).getTime() - start) / 86400000;
        return diff > 0 && diff <= 7;
      });
    });
  } catch {
    return false;
  }
}
