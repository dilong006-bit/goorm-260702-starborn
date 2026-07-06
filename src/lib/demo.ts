import type { SavedUniverse, MoodKey } from "./types";
import type { RetrospectiveResult } from "./api";
import { SEED_UNIVERSES, type SeedUniverse } from "../data/seedUniverse";

/**
 * 데모(둘러보기) 모드 — Epic B2.
 *
 * 원칙(§7 분리):
 *  - 실 사용자 데이터(localStorage·Supabase)와 **완전 분리**. 인메모리 전용, 저장 불가.
 *  - metrics·share_events 오염 없음(recordSave/recordShareEvent/touchLastSeen가 isDemo()면 no-op).
 *  - 시드는 정적 로컬 번들(seedUniverse.ts) — 오프라인 열람 가능.
 *
 * 활성화 시 collection.ts의 모든 동기/비동기 리더가 이 인메모리 컬렉션을 진실원으로 사용한다.
 */

let demoActive = false;
let demoData: SavedUniverse[] | null = null;

// hdurl/copyright(몰입 감상 전용 메타)를 apodDate로 조회
const seedMeta: Record<string, { hdurl: string | null; copyright: string | null }> =
  Object.fromEntries(
    SEED_UNIVERSES.map((s) => [s.apodDate, { hdurl: s.hdurl, copyright: s.copyright }])
  );

export function isDemo(): boolean {
  return demoActive;
}

/** SeedUniverse → 순수 SavedUniverse(hdurl/copyright 메타 제거). */
function toSaved(s: SeedUniverse): SavedUniverse {
  const copy: Partial<SeedUniverse> = { ...s };
  delete copy.hdurl;
  delete copy.copyright;
  return copy as SavedUniverse;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
function ymd(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * 데모 컬렉션 빌드:
 *  1) 시드 저장일(savedAt)을 '오늘' 기준으로 상대화 — 최근 7개 연속(스트릭), 나머지는 4개월 분포가
 *     실행 시점과 무관하게 항상 "현재진행형"으로 보이게.
 *  2) On This Day(F2.2) 히트 2건을 오늘의 (월,일)에 앵커링 — 어느 날 실행해도 On This Day가 살아있게.
 */
function buildDemoCollection(): SavedUniverse[] {
  const now = new Date();
  // 시드에서 가장 최근 savedAt(= days:0, 2026-07-06 기준) → 오늘로 당기는 오프셋
  const newest = SEED_UNIVERSES.reduce(
    (max, s) => Math.max(max, new Date(s.savedAt).getTime()),
    0
  );
  const shift = now.getTime() - newest;

  const shifted: SavedUniverse[] = SEED_UNIVERSES.map((s) => ({
    ...toSaved(s),
    savedAt: new Date(new Date(s.savedAt).getTime() + shift).toISOString(),
  }));

  // On This Day 앵커 — 오늘과 같은 월/일의 과거 저장분(1·2년 전)
  const mmdd = `${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  // 시선을 끄는 이미지로 2건 앵커 — 아이슬란드 드래곤 오로라(radiant) · 산그림자 위 보름달(calm)
  const anchorSources = [SEED_UNIVERSES[26], SEED_UNIVERSES[10]];
  const anchors: SavedUniverse[] = anchorSources.map((src, i) => {
    const yearsAgo = i + 1;
    const inputDate = `${now.getFullYear() - yearsAgo}-${mmdd}`;
    // 저장일은 그해 당일로(오래된 별) — 스트릭엔 영향 없음
    const savedAt = new Date(
      Date.UTC(now.getFullYear() - yearsAgo, now.getMonth(), now.getDate(), 12)
    ).toISOString();
    return {
      ...toSaved(src),
      id: `demo:onthisday:${yearsAgo}`,
      inputDate,
      occasion: i === 0 ? "anniversary" : "birthday",
      label: i === 0 ? "우리가 처음 별을 세던 날" : undefined,
      savedAt,
    };
  });

  // 최신순 정렬(getCollection 계약과 동일)
  return [...shifted, ...anchors].sort((a, b) =>
    b.savedAt.localeCompare(a.savedAt)
  );
}

export function enterDemo(): void {
  demoActive = true;
  demoData = buildDemoCollection();
}

export function exitDemo(): void {
  demoActive = false;
  demoData = null;
}

/** 데모 컬렉션 스냅샷(동기). collection.ts가 리더에서 사용. */
export function getDemoCollection(): SavedUniverse[] {
  return demoData ?? [];
}

/** 몰입 감상용 hd 이미지/저작권 조회(데모 전용). 없으면 null. */
export function seedMetaFor(apodDate: string): {
  hdurl: string | null;
  copyright: string | null;
} {
  return seedMeta[apodDate] ?? { hdurl: null, copyright: null };
}

/** 데모 회고 프리뷰(B3) — 최근 주간을 완성 형태로 시연(읽기 전용). */
export function getDemoRetrospective(period: "week" | "month"): RetrospectiveResult {
  const now = new Date();
  const span = period === "week" ? 7 : 30;
  const start = new Date(now.getTime() - span * 86400000);
  const list = getDemoCollection().filter(
    (u) => new Date(u.savedAt).getTime() >= start.getTime()
  );

  const moodSummary = { radiant: 0, calm: 0, drift: 0, cloudy: 0, storm: 0 } as Record<
    MoodKey,
    number
  >;
  for (const u of list) if (u.mood) moodSummary[u.mood] += 1;

  const text =
    period === "week"
      ? "이번 주의 당신은, 무거운 날과 빛나는 날 사이를 조용히 오갔습니다.\n" +
        "블랙홀의 소용돌이 앞에서 “무거운 것에도 무늬가 있다”고 적었고,\n" +
        "며칠 뒤 태양의 코로나 앞에서는 “활짝 펴도 좋다”고 스스로를 다독였지요.\n\n" +
        "어두워졌던 날들은 어긋남이 아니라, 무언가 완벽히 맞아떨어지기 직전의 정렬이었습니다.\n" +
        "당신은 이번 주에도 하늘을 올려다보는 사람이었어요. 그거면 충분합니다."
      : "지난 한 달, 당신의 별들은 봄의 혜성처럼 각자의 궤도를 돌아 제자리로 왔습니다.\n" +
        "오로라가 용처럼 휘던 밤에는 설렘을, 원뿔 성운의 그늘 앞에서는 “어두운 부분이 있어야 모양이 생긴다”는 문장을 남겼지요.\n\n" +
        "느린 날도, 소란한 날도 모두 나선을 감는 과정이었습니다.\n" +
        "한 달치 별을 이어보니, 그건 이미 하나의 성좌였어요.";

  return {
    empty: list.length === 0,
    period,
    rangeStart: ymd(start),
    rangeEnd: ymd(now),
    text,
    moodSummary,
    count: list.length,
  };
}
