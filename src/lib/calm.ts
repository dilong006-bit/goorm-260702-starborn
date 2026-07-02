import type { CalmPrefs } from "./types";

const CALM_KEY = "starborn:calm:v1";

/** 기본값: 햅틱 on, 사운드 off(정숙), 젠틀 모드 off. */
const DEFAULT_CALM: CalmPrefs = {
  haptics: true,
  ambientSound: false,
  gentleMode: false,
};

/** 저장된 감각 설정을 읽는다. 파싱 실패·미설정 시 기본값. */
export function getCalm(): CalmPrefs {
  try {
    const raw = localStorage.getItem(CALM_KEY);
    if (!raw) return { ...DEFAULT_CALM };
    // 부분 저장/구버전 대비 기본값 병합
    return { ...DEFAULT_CALM, ...(JSON.parse(raw) as Partial<CalmPrefs>) };
  } catch {
    return { ...DEFAULT_CALM };
  }
}

/** 감각 설정 일부를 갱신하고 저장한다(프라이빗 모드에서도 안전). */
export function setCalm(patch: Partial<CalmPrefs>): CalmPrefs {
  const next = { ...getCalm(), ...patch };
  try {
    localStorage.setItem(CALM_KEY, JSON.stringify(next));
  } catch {
    // 프라이빗 모드 등 저장 실패 — 앱은 죽지 않는다
  }
  return next;
}
