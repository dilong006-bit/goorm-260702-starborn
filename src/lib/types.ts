export type Tone = "essay" | "fortune" | "poem";

export const TONES: { key: Tone; label: string }[] = [
  { key: "essay", label: "감성 에세이" },
  { key: "fortune", label: "우주 운세" },
  { key: "poem", label: "짧은 시" },
];

export interface ApodResponse {
  date: string;
  title: string;
  explanation: string;
  imageUrl: string | null;
  mediaType: "image" | "video";
  copyright: string | null;
  /** null이 아니면 서버가 폴백/클램프했음을 의미 */
  fallback: string | null;
}

export interface StoryResponse {
  date: string;
  tone: Tone;
  story: string;
  cached: boolean;
  fallback: string | null;
}

/** 의미부여의 종류 — 저장된 우주의 성격을 구분한다. */
export type Occasion = "birthday" | "anniversary" | "today" | "custom";

/** 감정 축 — 성좌의 별 색을 결정한다(F1.3 · F2.1). */
export type MoodKey = "radiant" | "calm" | "drift" | "cloudy" | "storm";

export const MOODS: { key: MoodKey; label: string; token: string; emoji: string }[] = [
  { key: "radiant", label: "빛나는 날", token: "mood-radiant", emoji: "✨" },
  { key: "calm", label: "잔잔한 날", token: "mood-calm", emoji: "🌊" },
  { key: "drift", label: "무중력", token: "mood-drift", emoji: "🌌" },
  { key: "cloudy", label: "흐린 날", token: "mood-cloudy", emoji: "☁️" },
  { key: "storm", label: "무거운 날", token: "mood-storm", emoji: "🌑" },
];

/** 하루의 성격(선택) — 감정 축과 독립. */
export type DayType = "ordinary" | "spark" | "gravity" | "shift" | "rest";

export const DAY_TYPES: { key: DayType; label: string; emoji: string }[] = [
  { key: "ordinary", label: "평범한 하루", emoji: "🌗" },
  { key: "spark", label: "설렌 하루", emoji: "⚡" },
  { key: "gravity", label: "무거운 하루", emoji: "🪐" },
  { key: "shift", label: "전환점", emoji: "🌠" },
  { key: "rest", label: "쉬어간 날", emoji: "🌙" },
];

/** 리액션(가장 가벼운 무드 기록) — 이모지 팔레트. */
export const REACTIONS = ["⭐", "💫", "🌙", "☄️", "🌈", "🩵"] as const;

/** localStorage에 저장되는 하나의 "우주" 저널 항목. */
export interface SavedUniverse {
  /** `${inputDate}:${occasion}` 조합 키 — 무의존·중복 방지 */
  id: string;
  /** 실제 APOD 날짜(폴백/클램프 반영 후) — 캐시 정합 */
  apodDate: string;
  /** 사용자가 의미부여한 날 */
  inputDate: string;
  occasion: Occasion;
  label?: string;
  name?: string;
  tone: Tone;
  title: string;
  imageUrl: string | null;
  story: string;
  /** 저장 시각(ISO) — 스트릭 계산 기준 */
  savedAt: string;

  // ── 감정 저널 필드 (Phase 1 · 모두 선택) ──────────
  /** F1.3 — 성좌 별 색 */
  mood?: MoodKey;
  /** F1.3 — 내 마음 한 줄(≤140, 사적) */
  feelingNote?: string;
  /** F1.4 — 하루의 성격(선택) */
  dayType?: DayType;
  /** 가장 가벼운 무드 기록 — 이모지 키 배열 */
  reactions?: string[];
}

/** 기간 회고(F2.3) — Claude 생성 요약. */
export interface Retrospective {
  id: string;
  period: "week" | "month";
  rangeStart: string; // YYYY-MM-DD
  rangeEnd: string;
  text: string;
  moodSummary: Record<MoodKey, number>;
  createdAt: string;
}

/** 감각 레이어(햅틱·사운드·젠틀 모드) opt-in 설정. */
export interface CalmPrefs {
  haptics: boolean;
  ambientSound: boolean;
  gentleMode: boolean;
}
