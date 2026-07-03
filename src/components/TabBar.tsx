import { tap } from "../lib/haptics";

export type TabKey = "today" | "add" | "collection";

const TABS: { key: TabKey; icon: string; label: string }[] = [
  { key: "today", icon: "🌌", label: "오늘" },
  { key: "add", icon: "➕", label: "추가" },
  { key: "collection", icon: "⭐", label: "내 우주" },
];

interface Props {
  active: TabKey;
  onNavigate: (key: TabKey) => void;
}

/**
 * 하단 고정 glass 탭바 (§8 · S5)
 * - 44pt 터치 타깃, active accent, role="tablist".
 * - reduced-transparency 시 index.css의 .glass 폴백으로 solid 처리.
 */
export default function TabBar({ active, onNavigate }: Props) {
  return (
    <nav
      role="tablist"
      aria-label="주요 화면"
      className="glass fixed inset-x-0 bottom-0 z-20 flex items-stretch justify-around border-t border-white/10 pb-[env(safe-area-inset-bottom)]"
    >
      {TABS.map((t) => {
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={isActive}
            aria-label={t.label}
            onClick={() => {
              if (!isActive) tap(6);
              onNavigate(t.key);
            }}
            className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] transition-colors duration-micro active:animate-jelly ${
              isActive ? "text-cosmos-glow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className={`text-lg leading-none ${isActive ? "" : "opacity-80"}`}>
              {t.icon}
            </span>
            <span className={isActive ? "font-semibold" : ""}>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
