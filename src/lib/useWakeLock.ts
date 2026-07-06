import { useEffect } from "react";

/**
 * Screen Wake Lock — Epic A4(opt-in).
 * 힐링 세션 중 화면 꺼짐 방지. 미지원 브라우저/거부 시 무해 no-op.
 * 탭이 백그라운드로 갔다가 돌아오면 재획득(브라우저가 자동 해제하므로).
 */
export function useWakeLock(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    // 타입: navigator.wakeLock는 아직 표준 lib.dom에 부분적 → 방어적 접근
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinel> };
    };
    if (!nav.wakeLock) return;

    let sentinel: WakeLockSentinel | null = null;
    let released = false;

    const acquire = async () => {
      try {
        sentinel = await nav.wakeLock!.request("screen");
      } catch {
        /* 거부/미지원 — 조용히 포기 */
      }
    };

    const onVisible = () => {
      if (!released && document.visibilityState === "visible") void acquire();
    };

    void acquire();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      released = true;
      document.removeEventListener("visibilitychange", onVisible);
      try {
        void sentinel?.release();
      } catch {
        /* 무시 */
      }
      sentinel = null;
    };
  }, [enabled]);
}
