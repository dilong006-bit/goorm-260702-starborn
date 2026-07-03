import { useEffect, useMemo, useState } from "react";
import type { DayType, MoodKey, SavedUniverse } from "../lib/types";
import { MOODS, DAY_TYPES } from "../lib/types";
import { getCollection, getLocalCollection } from "../lib/collection";
import CollectionEmpty from "../components/CollectionEmpty";

// SVG fill용 mood hex (토큰과 동일 값)
const MOOD_HEX: Record<MoodKey, string> = {
  radiant: "#ffd479",
  calm: "#a8b5ff",
  drift: "#7c6cff",
  cloudy: "#4f7cff",
  storm: "#5b4b9f",
};
const DEFAULT_HEX = "#a8b5ff";

interface Props {
  onBack: () => void;
  onOpen: (u: SavedUniverse) => void;
  onAdd: () => void;
}

const GOLDEN = Math.PI * (3 - Math.sqrt(5)); // 황금각 — 자연스러운 분산(피로택시스)
const CX = 200;
const CY = 200;
const MAX_R = 175;

export default function Constellation({ onBack, onOpen, onAdd }: Props) {
  const [all, setAll] = useState<SavedUniverse[]>(() => getLocalCollection());
  const [mood, setMood] = useState<MoodKey | "all">("all");
  const [dayType, setDayType] = useState<DayType | "all">("all");

  useEffect(() => {
    let alive = true;
    void getCollection().then((list) => {
      if (alive) setAll(list);
    });
    return () => {
      alive = false;
    };
  }, []);

  const moods = useMemo(
    () =>
      Array.from(new Set(all.map((u) => u.mood).filter((m): m is MoodKey => !!m))),
    [all]
  );
  const dayTypes = useMemo(
    () =>
      Array.from(
        new Set(all.map((u) => u.dayType).filter((d): d is DayType => !!d))
      ),
    [all]
  );

  // 시간순(오래된→최근) 배치 + 필터
  const stars = useMemo(() => {
    const items = all
      .filter((u) => mood === "all" || u.mood === mood)
      .filter((u) => dayType === "all" || u.dayType === dayType)
      .slice()
      .sort((a, b) => a.savedAt.localeCompare(b.savedAt));
    const n = items.length;
    return items.map((u, i) => {
      const r = MAX_R * Math.sqrt((i + 0.5) / Math.max(n, 1));
      const a = i * GOLDEN;
      return {
        u,
        x: CX + r * Math.cos(a),
        y: CY + r * Math.sin(a),
        color: u.mood ? MOOD_HEX[u.mood] : DEFAULT_HEX,
        radius: u.feelingNote ? 5 : 3.4,
      };
    });
  }, [all, mood, dayType]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-5 py-10">
      <button
        onClick={onBack}
        className="mb-6 self-start text-sm text-slate-400 transition hover:text-slate-200"
      >
        ← 내 우주로
      </button>

      <header className="mb-4">
        <h1 className="text-3xl font-bold text-slate-50">감정 성좌</h1>
        <p className="mt-1 text-sm text-slate-400">
          저장한 우주가 별이 되어 이어집니다. 별을 누르면 그날의 우주로.
        </p>
      </header>

      {all.length === 0 ? (
        <CollectionEmpty onAdd={onAdd} />
      ) : (
        <>
          {/* 필터 */}
          {(moods.length > 1 || dayTypes.length > 1) && (
            <div className="mb-4 flex flex-wrap gap-2">
              <Chip active={mood === "all" && dayType === "all"} label="전체" onClick={() => { setMood("all"); setDayType("all"); }} />
              {moods.map((m) => (
                <Chip
                  key={m}
                  active={mood === m}
                  label={MOODS.find((x) => x.key === m)?.label ?? m}
                  onClick={() => setMood(mood === m ? "all" : m)}
                />
              ))}
              {dayTypes.map((d) => (
                <Chip
                  key={d}
                  active={dayType === d}
                  label={DAY_TYPES.find((x) => x.key === d)?.label ?? d}
                  onClick={() => setDayType(dayType === d ? "all" : d)}
                />
              ))}
            </div>
          )}

          {/* 성좌 */}
          <div className="glass overflow-hidden rounded-card bg-cosmos-radial p-2">
            <svg
              viewBox="0 0 400 400"
              className="h-auto w-full"
              role="img"
              aria-label={`${stars.length}개의 별로 이루어진 감정 성좌`}
            >
              {/* 연결선(인접 시각) */}
              {stars.length > 1 && (
                <polyline
                  points={stars.map((s) => `${s.x},${s.y}`).join(" ")}
                  fill="none"
                  stroke="rgba(168,181,255,.22)"
                  strokeWidth="0.6"
                />
              )}
              {/* 별 */}
              {stars.map((s, i) => (
                <g
                  key={s.u.id}
                  className="animate-twinkle cursor-pointer"
                  style={{ animationDelay: `${(i % 8) * 0.2}s` }}
                  onClick={() => onOpen(s.u)}
                >
                  {/* 탭 영역(투명, 넉넉하게) */}
                  <circle cx={s.x} cy={s.y} r={10} fill="transparent" />
                  <circle
                    cx={s.x}
                    cy={s.y}
                    r={s.radius}
                    fill={s.color}
                    stroke="rgba(255,255,255,.5)"
                    strokeWidth="0.5"
                  >
                    <title>{s.u.title}</title>
                  </circle>
                </g>
              ))}
            </svg>
          </div>

          {/* 범례 */}
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
            {MOODS.map((m) => (
              <span key={m.key} className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: MOOD_HEX[m.key] }}
                />
                {m.label}
              </span>
            ))}
          </div>
        </>
      )}
    </main>
  );
}

function Chip({
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
