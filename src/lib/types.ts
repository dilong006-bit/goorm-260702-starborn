export type Tone = "essay" | "fortune" | "poem";

export const TONES: { key: Tone; label: string }[] = [
  { key: "essay", label: "감성 에세이" },
  { key: "fortune", label: "우주 운세" },
  { key: "poem", label: "짧은 시" },
];

/** 목소리(문체) 축 — 톤과 직교(F3.1). 내부적으로 LLM 프로바이더에 매핑(사용자 비노출). */
export type Voice = "warm" | "dreamy" | "plain";

export const VOICES: { key: Voice; label: string; emoji: string }[] = [
  { key: "warm", label: "따뜻하게", emoji: "🤍" },
  { key: "dreamy", label: "몽환적으로", emoji: "🌙" },
  { key: "plain", label: "담백하게", emoji: "🍃" },
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
  voice: Voice;
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

/** 스티커(F3.2) — 카드 위 이모지 장식. x,y는 카드 대비 0..1 상대 좌표. */
export interface Sticker {
  emoji: string;
  x: number;
  y: number;
}

/** 스티커 팔레트. */
export const STICKERS = [
  "⭐", "🌙", "☄️", "🪐", "💫", "🌈", "🩵", "✨", "🌟", "🔭", "🚀", "🛸",
] as const;

/** 자유 드로잉(F3.2 stretch) — 한 획. points는 카드 대비 0..1 상대 좌표. */
export interface Stroke {
  color: string;
  width: number;
  points: { x: number; y: number }[];
}

/** 드로잉 펜 색 팔레트(토큰 값). */
export const PEN_COLORS = ["#a8b5ff", "#ffd479", "#7c6cff", "#ff9ecb", "#ffffff"] as const;

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
  /** 생성 목소리(선택) — 스토리 스냅샷과 함께. */
  voice?: Voice;
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
  /** F3.2 — 카드 위 스티커 장식(선택) */
  stickers?: Sticker[];
  /** F3.2 stretch — 자유 드로잉 획(선택) */
  drawing?: Stroke[];
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

/** 모션 강도(A2) — reduced-motion은 항상 우선(강제 정지). */
export type MotionLevel = "off" | "subtle" | "full";

/** 감각 레이어(햅틱·사운드·젠틀 모드·모션·화면유지) opt-in 설정. */
export interface CalmPrefs {
  haptics: boolean;
  ambientSound: boolean;
  gentleMode: boolean;
  /** A2 몰입 모션 강도 — 기본 subtle. */
  motionLevel: MotionLevel;
  /** A4 힐링 세션 중 화면 유지(Screen Wake Lock) — 기본 off(배터리 보호). */
  keepAwake: boolean;
}

/**
 * 몰입 감상(Epic A) 소스 — APOD 응답과 저장된 우주를 공통 형태로 승격.
 * hdurl은 있으면 대형 감상에 우선 사용(A1), 없으면 imageUrl 폴백.
 */
export interface ImmersiveSource {
  date: string;
  title: string;
  imageUrl: string | null;
  hdurl?: string | null;
  mediaType: "image" | "video";
  copyright?: string | null;
}
