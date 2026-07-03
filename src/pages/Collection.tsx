import { useEffect, useMemo, useState } from "react";
import type { DayType, Occasion, SavedUniverse } from "../lib/types";
import { DAY_TYPES } from "../lib/types";
import { getCollection, getLocalCollection } from "../lib/collection";
import CollectionCard from "../components/CollectionCard";
import CollectionEmpty from "../components/CollectionEmpty";
import StreakBadge from "../components/StreakBadge";

const OCCASION_LABEL: Record<Occasion, string> = {
  birthday: "생일",
  anniversary: "기념일",
  today: "오늘",
  custom: "특별한 날",
};

const DAYTYPE_LABEL: Record<DayType, string> = Object.fromEntries(
  DAY_TYPES.map((d) => [d.key, `${d.emoji} ${d.label}`])
) as Record<DayType, string>;

interface Props {
  onBack: () => void;
  onAdd: () => void;
  onOpen: (u: SavedUniverse) => void;
  onConstellation: () => void;
  onRetrospective: () => void;
}

export default function Collection({
  onBack,
  onAdd,
  onOpen,
  onConstellation,
  onRetrospective,
}: Props) {
  // 즉시 미러로 첫 렌더 → 원격(로그인 시) 로드로 갱신
  const [all, setAll] = useState<SavedUniverse[]>(() => getLocalCollection());
  const [filter, setFilter] = useState<Occasion | "all">("all");
  const [dayFilter, setDayFilter] = useState<DayType | "all">("all");

  useEffect(() => {
    let alive = true;
    void getCollection().then((list) => {
      if (alive) setAll(list);
    });
    return () => {
      alive = false;
    };
  }, []);

  // 컬렉션에 실제로 존재하는 occasion / dayType만 필터 칩으로
  const occasions = useMemo(
    () => Array.from(new Set(all.map((u) => u.occasion))),
    [all]
  );
  const dayTypes = useMemo(
    () =>
      Array.from(
        new Set(all.map((u) => u.dayType).filter((d): d is DayType => !!d))
      ),
    [all]
  );

  const shown = all.filter(
    (u) =>
      (filter === "all" || u.occasion === filter) &&
      (dayFilter === "all" || u.dayType === dayFilter)
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-5 py-10">
      <button
        onClick={onBack}
        className="mb-6 self-start text-sm text-slate-400 transition hover:text-slate-200"
      >
        ← 오늘의 우주로
      </button>

      <header className="mb-6 flex items-end justify-between gap-4">
        <h1 className="text-3xl font-bold text-slate-50">내 우주</h1>
        <StreakBadge />
      </header>

      {all.length === 0 ? (
        <CollectionEmpty onAdd={onAdd} />
      ) : (
        <>
          <div className="mb-5 flex gap-2">
            <button
              onClick={onConstellation}
              className="flex-1 rounded-control border border-cosmos-accent/30 bg-cosmos-accent/10 px-4 py-3 text-sm font-medium text-cosmos-glow transition hover:bg-cosmos-accent/15 active:animate-jelly"
            >
              ✨ 감정 성좌
            </button>
            <button
              onClick={onRetrospective}
              className="flex-1 rounded-control border border-cosmos-star/30 bg-cosmos-star/10 px-4 py-3 text-sm font-medium text-cosmos-star transition hover:bg-cosmos-star/15 active:animate-jelly"
            >
              🔭 우주적 회고
            </button>
          </div>

          {occasions.length > 1 && (
            <div className="mb-3 flex flex-wrap gap-2">
              <FilterChip
                active={filter === "all"}
                label="전체"
                onClick={() => setFilter("all")}
              />
              {occasions.map((o) => (
                <FilterChip
                  key={o}
                  active={filter === o}
                  label={OCCASION_LABEL[o]}
                  onClick={() => setFilter(o)}
                />
              ))}
            </div>
          )}

          {dayTypes.length > 0 && (
            <div className="mb-5 flex flex-wrap gap-2">
              <FilterChip
                active={dayFilter === "all"}
                label="모든 하루"
                onClick={() => setDayFilter("all")}
              />
              {dayTypes.map((d) => (
                <FilterChip
                  key={d}
                  active={dayFilter === d}
                  label={DAYTYPE_LABEL[d]}
                  onClick={() => setDayFilter(d)}
                />
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {shown.map((u, i) => (
              <CollectionCard
                key={u.id}
                universe={u}
                index={i}
                onOpen={() => onOpen(u)}
              />
            ))}
            <button
              onClick={onAdd}
              className="flex aspect-square flex-col items-center justify-center gap-2 rounded-card border border-dashed border-white/20 text-slate-400 transition hover:border-cosmos-accent/50 hover:text-slate-200 active:animate-jelly"
            >
              <span className="text-2xl">⭐</span>
              <span className="text-xs">우주 추가</span>
            </button>
          </div>
        </>
      )}
    </main>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3.5 py-1.5 text-sm transition ${
        active
          ? "bg-cosmos-accent text-white"
          : "border border-white/15 text-slate-300 hover:bg-white/10"
      }`}
    >
      {label}
    </button>
  );
}
