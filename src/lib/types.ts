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
}

/** 감각 레이어(햅틱·사운드·젠틀 모드) opt-in 설정. */
export interface CalmPrefs {
  haptics: boolean;
  ambientSound: boolean;
  gentleMode: boolean;
}
