import type { ApodResponse, StoryResponse, Tone } from "./types";

async function parse<T>(res: Response): Promise<T> {
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* 비-JSON 응답 */
  }
  if (!res.ok) {
    const code =
      (data as { error?: string })?.error || `http_${res.status}`;
    throw new Error(code);
  }
  return data as T;
}

/** 오늘(date 생략) 또는 특정 날짜의 APOD 조회. 서버가 클램프·폴백 처리. */
export async function getApod(date?: string): Promise<ApodResponse> {
  const qs = date ? `?date=${encodeURIComponent(date)}` : "";
  const res = await fetch(`/api/apod${qs}`);
  return parse<ApodResponse>(res);
}

/** (date+tone) 스토리 생성/조회. name은 서버에서 템플릿 치환(캐시 키 제외). */
export async function getStory(
  date: string,
  tone: Tone,
  name?: string
): Promise<StoryResponse> {
  const res = await fetch("/api/story", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ date, tone, name }),
  });
  return parse<StoryResponse>(res);
}
