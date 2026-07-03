import { useEffect, useState } from "react";
import type { DayType, MoodKey, SavedUniverse } from "../lib/types";
import { MOODS, DAY_TYPES, REACTIONS } from "../lib/types";
import { saveUniverse } from "../lib/collection";
import { tap } from "../lib/haptics";

// Tailwind JIT가 감지하도록 mood 배경 클래스를 리터럴로 매핑
const MOOD_BG: Record<MoodKey, string> = {
  radiant: "bg-mood-radiant",
  calm: "bg-mood-calm",
  drift: "bg-mood-drift",
  cloudy: "bg-mood-cloudy",
  storm: "bg-mood-storm",
};

const MAX_NOTE = 140;

interface Props {
  /** 저장 대상(감정 필드 제외 조립본) */
  base: SavedUniverse;
  onClose: () => void;
  /** 저장 완료 → 실제 저장된 항목 전달 */
  onSaved: (saved: SavedUniverse) => void;
}

/**
 * SaveSheet (F1.3·F1.4) — 저장 시 마음을 담는 바텀시트.
 * mood(선택)·한 줄(≤140)·하루 성격(선택)·리액션(선택). story는 불변(별기).
 */
export default function SaveSheet({ base, onClose, onSaved }: Props) {
  const [mood, setMood] = useState<MoodKey | null>(null);
  const [note, setNote] = useState("");
  const [dayType, setDayType] = useState<DayType | null>(null);
  const [reactions, setReactions] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [pop, setPop] = useState(false);

  // Esc로 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function toggleReaction(r: string) {
    setReactions((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  }

  async function onSave() {
    if (busy) return;
    setBusy(true);
    setPop(true);
    tap([10, 30, 10]);
    const saved: SavedUniverse = {
      ...base,
      mood: mood ?? undefined,
      feelingNote: note.trim() || undefined,
      dayType: dayType ?? undefined,
      reactions: reactions.length ? reactions : undefined,
      savedAt: new Date().toISOString(),
    };
    try {
      await saveUniverse(saved);
      onSaved(saved);
      onClose();
    } catch {
      setBusy(false);
      setPop(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="우주에 마음 담기"
      className="fixed inset-0 z-40 flex items-end justify-center"
    >
      {/* backdrop */}
      <button
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* sheet */}
      <div
        className={`glass-strong animate-rise-in relative z-10 w-full max-w-md rounded-t-card border-b-0 px-5 pb-8 pt-4 ${
          pop ? "animate-save-pop" : ""
        }`}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-white/20" />
        <h2 className="mb-1 text-lg font-bold text-slate-50">
          이 우주에 마음을 담아요
        </h2>
        <p className="mb-5 text-sm text-slate-400">
          오늘 어떤 마음인가요? (모두 선택 사항)
        </p>

        {/* mood */}
        <div className="mb-5">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">
            오늘의 결
          </p>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => {
              const active = mood === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => {
                    setMood(active ? null : m.key);
                    tap(6);
                  }}
                  aria-pressed={active}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition active:animate-jelly ${
                    active
                      ? "border-white/40 bg-white/10 text-slate-50"
                      : "border-white/10 text-slate-300 hover:bg-white/5"
                  }`}
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${MOOD_BG[m.key]}`} />
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* feelingNote */}
        <div className="mb-5">
          <label className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-wider text-slate-400">
            <span>내 마음 한 줄</span>
            <span className="num text-slate-500">
              {note.length}/{MAX_NOTE}
            </span>
          </label>
          <textarea
            value={note}
            maxLength={MAX_NOTE}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="예: 오늘은 조용히 나를 돌본 하루"
            className="glass w-full resize-none rounded-control px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:shadow-glow"
          />
        </div>

        {/* dayType */}
        <div className="mb-5">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">
            하루의 성격
          </p>
          <div className="flex flex-wrap gap-2">
            {DAY_TYPES.map((d) => {
              const active = dayType === d.key;
              return (
                <button
                  key={d.key}
                  onClick={() => {
                    setDayType(active ? null : d.key);
                    tap(6);
                  }}
                  aria-pressed={active}
                  className={`rounded-full border px-3 py-1.5 text-sm transition active:animate-jelly ${
                    active
                      ? "border-cosmos-accent/50 bg-cosmos-accent/15 text-cosmos-glow"
                      : "border-white/10 text-slate-300 hover:bg-white/5"
                  }`}
                >
                  {d.emoji} {d.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* reactions */}
        <div className="mb-6">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">
            반짝임
          </p>
          <div className="flex flex-wrap gap-2">
            {REACTIONS.map((r) => {
              const active = reactions.includes(r);
              return (
                <button
                  key={r}
                  onClick={() => toggleReaction(r)}
                  aria-pressed={active}
                  className={`h-10 w-10 rounded-full border text-lg transition active:animate-jelly ${
                    active
                      ? "border-cosmos-star/50 bg-cosmos-star/15"
                      : "border-white/10 hover:bg-white/5"
                  }`}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={onSave}
          disabled={busy}
          className="w-full rounded-control bg-cosmos-accent px-6 py-3.5 font-semibold text-white shadow-e1 transition hover:shadow-glow active:animate-jelly disabled:opacity-50"
        >
          {busy ? "저장하는 중…" : "⭐ 내 우주에 저장"}
        </button>
      </div>
    </div>
  );
}
