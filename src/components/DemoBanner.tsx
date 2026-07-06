interface Props {
  /** 데모 종료 → 내 우주 시작(활성화 브릿지). */
  onExit: () => void;
}

/**
 * 둘러보기(데모) 배너 — Epic B2.
 * 읽기 전용임을 고지하고, "내 우주 시작하기"로 활성화 전환(데모→활성화 KPI).
 */
export default function DemoBanner({ onExit }: Props) {
  return (
    <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-center gap-3 border-b border-white/10 bg-cosmos-accent/20 px-4 py-2 text-sm backdrop-blur-xl">
      <span className="text-cosmos-glow">
        🔭 샘플 우주를 둘러보는 중 · 읽기 전용
      </span>
      <button
        onClick={onExit}
        className="rounded-full bg-cosmos-accent px-3.5 py-1 text-xs font-semibold text-white shadow-e1 transition hover:shadow-glow active:animate-jelly"
      >
        ✨ 내 우주 시작하기
      </button>
    </div>
  );
}
