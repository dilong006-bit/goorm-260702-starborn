import type { MoodKey, SavedUniverse } from "../lib/types";
import { DAY_TYPES } from "../lib/types";
import { proxied } from "../lib/share";
import OccasionTag from "./OccasionTag";

interface Props {
  universe: SavedUniverse;
  index: number;
  onOpen: () => void;
}

// Tailwind JIT 감지용 리터럴 매핑
const MOOD_BG: Record<MoodKey, string> = {
  radiant: "bg-mood-radiant",
  calm: "bg-mood-calm",
  drift: "bg-mood-drift",
  cloudy: "bg-mood-cloudy",
  storm: "bg-mood-storm",
};

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${y}.${m}.${d}`;
}

export default function CollectionCard({ universe, index, onOpen }: Props) {
  return (
    <button
      onClick={onOpen}
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
      className="glass animate-card-in group flex flex-col overflow-hidden rounded-card text-left shadow-e1 transition active:animate-jelly hover:shadow-glow"
    >
      <div className="relative aspect-square w-full bg-cosmos-900">
        {universe.imageUrl ? (
          <img
            src={proxied(universe.imageUrl) ?? undefined}
            alt={universe.title}
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl text-slate-500">
            🎞
          </div>
        )}
        {/* mood 점(감정 축 색) */}
        {universe.mood && (
          <span
            aria-hidden="true"
            className={`absolute left-2 top-2 h-3 w-3 rounded-full ring-2 ring-black/30 ${MOOD_BG[universe.mood]}`}
          />
        )}
        {/* 리액션 힌트 */}
        {universe.reactions && universe.reactions.length > 0 && (
          <div className="absolute bottom-2 right-2 text-sm drop-shadow">
            {universe.reactions[0]}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5 p-3">
        <span className="num text-xs text-cosmos-glow">
          {formatDate(universe.inputDate)}
        </span>
        <div className="flex items-center gap-1.5">
          <OccasionTag occasion={universe.occasion} />
          {universe.dayType && (
            <span className="text-xs text-slate-400">
              {DAY_TYPES.find((d) => d.key === universe.dayType)?.emoji}
            </span>
          )}
        </div>
        {universe.feelingNote && (
          <p className="line-clamp-1 text-xs text-slate-400">
            {universe.feelingNote}
          </p>
        )}
      </div>
    </button>
  );
}
