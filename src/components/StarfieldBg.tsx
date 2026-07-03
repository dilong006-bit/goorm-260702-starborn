import { useMemo } from "react";

/**
 * 숨쉬는 우주 배경 (§5.1 · C2)
 * cosmos-950 void → nebula 오브(breathe) → starfield(로드 0) → 콘텐츠.
 * - 절대배치 레이어, pointer-events 없음, aria-hidden (장식).
 * - 별점은 box-shadow 다중으로 이미지/네트워크 로드 0.
 * - reduced-motion: breathe/twinkle는 index.css의 미디어쿼리로 정지.
 */

// 결정적 PRNG (mulberry32) — 렌더마다 별 위치가 흔들리지 않도록 고정 시드
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// n개 별의 box-shadow 문자열 (2000x2000 가상 캔버스, background-repeat로 타일)
function starShadow(rng: () => number, n: number, color: string) {
  const parts: string[] = [];
  for (let i = 0; i < n; i++) {
    const x = Math.round(rng() * 2000);
    const y = Math.round(rng() * 2000);
    parts.push(`${x}px ${y}px ${color}`);
  }
  return parts.join(", ");
}

export default function StarfieldBg() {
  const { small, mid, twinkling } = useMemo(() => {
    const rng = mulberry32(0x5760b0); // "STARBORN" 느낌의 고정 시드
    return {
      small: starShadow(rng, 140, "rgba(255,255,255,.55)"),
      mid: starShadow(rng, 40, "rgba(168,181,255,.8)"),
      // 반짝이는 소수 별 — 개별 span으로 twinkle
      twinkling: Array.from({ length: 18 }, () => ({
        top: `${rng() * 100}%`,
        left: `${rng() * 100}%`,
        delay: `${rng() * 1.6}s`,
        gold: rng() > 0.7,
      })),
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* 성운 오브 — glass가 굴절할 빛샘, 아주 느리게 숨쉼 */}
      <div
        className="absolute -left-24 -top-24 h-[26rem] w-[26rem] animate-breathe rounded-full bg-nebula-orb blur-2xl"
        style={{ animationDuration: "11s" }}
      />
      <div
        className="absolute -bottom-32 -right-20 h-[30rem] w-[30rem] animate-breathe rounded-full bg-nebula-orb-blue blur-2xl"
        style={{ animationDuration: "13s", animationDelay: "1.5s" }}
      />
      <div
        className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 animate-breathe rounded-full bg-nebula-orb blur-3xl opacity-60"
        style={{ animationDuration: "9s", animationDelay: "0.8s" }}
      />

      {/* starfield — box-shadow 다중 (로드 0), 화면에 타일 반복 */}
      <div
        className="absolute inset-0 h-px w-px"
        style={{ boxShadow: small, backgroundRepeat: "repeat" }}
      />
      <div
        className="absolute inset-0 h-0.5 w-0.5 rounded-full"
        style={{ boxShadow: mid }}
      />

      {/* 반짝이는 소수 별 */}
      {twinkling.map((s, i) => (
        <span
          key={i}
          className={`absolute h-[3px] w-[3px] animate-twinkle rounded-full ${
            s.gold ? "bg-cosmos-star" : "bg-cosmos-glow"
          }`}
          style={{ top: s.top, left: s.left, animationDelay: s.delay }}
        />
      ))}
    </div>
  );
}
