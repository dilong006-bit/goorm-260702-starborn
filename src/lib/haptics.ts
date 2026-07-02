import { getCalm } from "./calm";

/**
 * 촉각 피드백 — progressive enhancement.
 * 사용자가 햅틱을 켠 경우에만, 그리고 Vibration API를 지원하는 기기에서만 진동한다.
 * iOS Safari는 navigator.vibrate 미노출 → 무해 no-op(핵심 기능은 햅틱에 의존하지 않음).
 */
export function tap(pattern: number | number[] = 10): void {
  if (!getCalm().haptics) return;
  try {
    if ("vibrate" in navigator) navigator.vibrate(pattern);
  } catch {
    // 일부 브라우저는 예외를 던질 수 있다 — 무시
  }
}
