import { useRef, useState } from "react";
import type { ApodResponse, MoodKey, SavedUniverse } from "../lib/types";
import { MOODS, DAY_TYPES } from "../lib/types";
import { removeUniverse } from "../lib/collection";
import CosmicCard from "../components/CosmicCard";
import ShareActionBar from "../components/ShareActionBar";

const MOOD_BG: Record<MoodKey, string> = {
  radiant: "bg-mood-radiant",
  calm: "bg-mood-calm",
  drift: "bg-mood-drift",
  cloudy: "bg-mood-cloudy",
  storm: "bg-mood-storm",
};

interface Props {
  universe: SavedUniverse;
  onBack: () => void;
  /** 삭제 후 컬렉션으로 */
  onRemoved: () => void;
}

export default function Detail({ universe, onBack, onRemoved }: Props) {
  const cardRef = useRef<HTMLElement>(null);
  const [confirming, setConfirming] = useState(false);

  // 저장된 데이터로 CosmicCard 복원 — 재생성/재현성 0
  const apod: ApodResponse = {
    date: universe.apodDate,
    title: universe.title,
    explanation: "",
    imageUrl: universe.imageUrl,
    mediaType: universe.imageUrl ? "image" : "video",
    copyright: null,
    fallback: null,
  };

  async function onDelete() {
    await removeUniverse(universe.id);
    onRemoved();
  }

  const mood = universe.mood
    ? MOODS.find((m) => m.key === universe.mood)
    : null;
  const dayType = universe.dayType
    ? DAY_TYPES.find((d) => d.key === universe.dayType)
    : null;
  const hasJournal =
    !!mood || !!universe.feelingNote || !!dayType || !!universe.reactions?.length;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center px-5 py-10">
      <button
        onClick={onBack}
        className="mb-6 self-start text-sm text-slate-400 transition hover:text-slate-200"
      >
        ← 내 우주로
      </button>

      <div className="flex w-full flex-col items-center gap-5">
        <CosmicCard
          ref={cardRef}
          apod={apod}
          story={universe.story}
          storyLoading={false}
          storyError={null}
        />

        {/* 감정 저널(mood·한 줄·dayType·리액션) */}
        {hasJournal && (
          <div className="glass w-full max-w-md space-y-2 rounded-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              {mood && (
                <span className="inline-flex items-center gap-1.5 text-sm text-slate-200">
                  <span className={`h-2.5 w-2.5 rounded-full ${MOOD_BG[mood.key]}`} />
                  {mood.label}
                </span>
              )}
              {dayType && (
                <span className="rounded-full border border-cosmos-accent/40 bg-cosmos-accent/10 px-2.5 py-0.5 text-xs text-cosmos-glow">
                  {dayType.emoji} {dayType.label}
                </span>
              )}
              {universe.reactions?.map((r) => (
                <span key={r} className="text-sm">
                  {r}
                </span>
              ))}
            </div>
            {universe.feelingNote && (
              <p className="text-sm leading-relaxed text-slate-300">
                “{universe.feelingNote}”
              </p>
            )}
          </div>
        )}

        <ShareActionBar saved={universe} getNode={() => cardRef.current} />

        {confirming ? (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-300">이 우주를 지울까요?</span>
            <button
              onClick={onDelete}
              className="rounded-control bg-rose-500/80 px-4 py-1.5 font-medium text-white transition hover:bg-rose-500"
            >
              삭제
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="rounded-control border border-white/15 px-4 py-1.5 text-slate-200 transition hover:bg-white/10"
            >
              취소
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="text-sm text-slate-500 transition hover:text-rose-300"
          >
            컬렉션에서 삭제
          </button>
        )}
      </div>
    </main>
  );
}
