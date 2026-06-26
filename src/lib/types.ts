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
