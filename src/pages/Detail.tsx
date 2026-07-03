import { useRef, useState } from "react";
import type {
  ApodResponse,
  MoodKey,
  SavedUniverse,
  Sticker,
  Stroke,
} from "../lib/types";
import { MOODS, DAY_TYPES, STICKERS, PEN_COLORS } from "../lib/types";
import { removeUniverse, saveUniverse } from "../lib/collection";
import { tap } from "../lib/haptics";
import CosmicCard from "../components/CosmicCard";
import StickerLayer from "../components/StickerLayer";
import DrawLayer from "../components/DrawLayer";
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

  // F3.2 스티커/드로잉 꾸미기
  const [editing, setEditing] = useState(false);
  const [tool, setTool] = useState<"sticker" | "draw">("sticker");
  const [stickers, setStickers] = useState<Sticker[]>(universe.stickers ?? []);
  const [drawing, setDrawing] = useState<Stroke[]>(universe.drawing ?? []);
  const [penColor, setPenColor] = useState<string>(PEN_COLORS[0]);
  const [savingDeco, setSavingDeco] = useState(false);

  function addSticker(emoji: string) {
    const n = stickers.length;
    const x = Math.min(0.85, Math.max(0.15, 0.5 + ((n % 3) - 1) * 0.14));
    const y = Math.min(0.85, Math.max(0.12, 0.3 + Math.floor(n / 3) * 0.14));
    setStickers((prev) => [...prev, { emoji, x, y }]);
    tap(6);
  }

  async function saveDeco() {
    setSavingDeco(true);
    await saveUniverse({ ...universe, stickers, drawing });
    tap([10, 30, 10]);
    setSavingDeco(false);
    setEditing(false);
  }

  function cancelDeco() {
    setStickers(universe.stickers ?? []);
    setDrawing(universe.drawing ?? []);
    setEditing(false);
  }

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
          overlay={
            <>
              <DrawLayer
                strokes={drawing}
                drawing={editing && tool === "draw"}
                color={penColor}
                width={3}
                onCommit={(s) => setDrawing((prev) => [...prev, s])}
              />
              <StickerLayer
                stickers={stickers}
                editing={editing && tool === "sticker"}
                onMove={(i, x, y) =>
                  setStickers((prev) =>
                    prev.map((s, j) => (j === i ? { ...s, x, y } : s))
                  )
                }
                onRemove={(i) =>
                  setStickers((prev) => prev.filter((_, j) => j !== i))
                }
              />
            </>
          }
        />

        {editing ? (
          <div className="w-full max-w-md space-y-3">
            <div className="flex justify-center">
              <div className="glass inline-flex gap-1 rounded-control p-1">
                <button
                  onClick={() => setTool("sticker")}
                  aria-pressed={tool === "sticker"}
                  className={`rounded-[10px] px-3.5 py-1.5 text-sm transition ${
                    tool === "sticker"
                      ? "bg-cosmos-accent font-semibold text-white"
                      : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  🌟 스티커
                </button>
                <button
                  onClick={() => setTool("draw")}
                  aria-pressed={tool === "draw"}
                  className={`rounded-[10px] px-3.5 py-1.5 text-sm transition ${
                    tool === "draw"
                      ? "bg-cosmos-accent font-semibold text-white"
                      : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  ✏️ 그리기
                </button>
              </div>
            </div>

            {tool === "sticker" ? (
              <>
                <div className="glass flex flex-wrap justify-center gap-1.5 rounded-card p-3">
                  {STICKERS.map((s) => (
                    <button
                      key={s}
                      onClick={() => addSticker(s)}
                      className="h-10 w-10 rounded-control text-xl transition hover:bg-white/10 active:animate-jelly"
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <p className="text-center text-xs text-slate-400">
                  스티커를 눌러 추가하고, 드래그해 옮기세요. ✕로 삭제.
                </p>
              </>
            ) : (
              <>
                <div className="glass flex flex-wrap items-center justify-center gap-2.5 rounded-card p-3">
                  {PEN_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setPenColor(c)}
                      aria-label="펜 색상"
                      aria-pressed={penColor === c}
                      className={`h-7 w-7 rounded-full transition ${
                        penColor === c
                          ? "ring-2 ring-white ring-offset-2 ring-offset-cosmos-900"
                          : "opacity-80 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <span className="mx-0.5 h-6 w-px bg-white/15" />
                  <button
                    onClick={() => setDrawing((p) => p.slice(0, -1))}
                    className="rounded-control border border-white/15 px-3 py-1.5 text-xs text-slate-200 transition hover:bg-white/10"
                  >
                    되돌리기
                  </button>
                  <button
                    onClick={() => setDrawing([])}
                    className="rounded-control border border-white/15 px-3 py-1.5 text-xs text-slate-200 transition hover:bg-white/10"
                  >
                    전체 지우기
                  </button>
                </div>
                <p className="text-center text-xs text-slate-400">
                  카드 위에 손가락(또는 마우스)으로 그려보세요.
                </p>
              </>
            )}
            <div className="flex gap-3">
              <button
                onClick={cancelDeco}
                className="flex-1 rounded-control border border-white/15 px-4 py-2.5 text-sm text-slate-200 transition hover:bg-white/10"
              >
                취소
              </button>
              <button
                onClick={() => void saveDeco()}
                disabled={savingDeco}
                className="flex-1 rounded-control bg-cosmos-accent px-4 py-2.5 text-sm font-semibold text-white shadow-e1 transition hover:shadow-glow active:animate-jelly disabled:opacity-50"
              >
                {savingDeco ? "저장 중…" : "완료"}
              </button>
            </div>
          </div>
        ) : (
          <>
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

        <button
          onClick={() => setEditing(true)}
          className="text-sm text-cosmos-glow transition hover:text-white active:animate-jelly"
        >
          🎨 스티커·그림으로 꾸미기
        </button>

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
          </>
        )}
      </div>
    </main>
  );
}
