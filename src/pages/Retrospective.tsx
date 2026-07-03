import { useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { MoodKey } from "../lib/types";
import { MOODS } from "../lib/types";
import { getRetrospective, type RetrospectiveResult } from "../lib/api";

const MOOD_HEX: Record<MoodKey, string> = {
  radiant: "#ffd479",
  calm: "#a8b5ff",
  drift: "#7c6cff",
  cloudy: "#4f7cff",
  storm: "#5b4b9f",
};

type Period = "week" | "month";
type Phase = "idle" | "loading" | "done" | "error";

interface Props {
  session: Session | null;
  onBack: () => void;
  onOpenAuth: () => void;
}

export default function Retrospective({ session, onBack, onOpenAuth }: Props) {
  const [period, setPeriod] = useState<Period>("week");
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<RetrospectiveResult | null>(null);
  const [copied, setCopied] = useState(false);
  const reqId = useRef(0);

  const token = session?.access_token;

  async function generate() {
    if (!token || phase === "loading") return;
    const id = ++reqId.current;
    setPhase("loading");
    setResult(null);
    try {
      const r = await getRetrospective(period, token);
      if (id !== reqId.current) return; // 최신 요청만 반영
      setResult(r);
      setPhase("done");
    } catch {
      if (id === reqId.current) setPhase("error");
    }
  }

  const maxCount = result?.moodSummary
    ? Math.max(1, ...Object.values(result.moodSummary))
    : 1;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-10">
      <button
        onClick={onBack}
        className="mb-6 self-start text-sm text-slate-400 transition hover:text-slate-200"
      >
        ← 내 우주로
      </button>

      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-50">우주적 회고</h1>
        <p className="mt-1 text-sm text-slate-400">
          지난 기간의 감정을 별처럼 모아, 다정한 한 편으로 돌아봐요.
        </p>
      </header>

      {!token ? (
        <div className="glass mt-6 rounded-card p-6 text-center">
          <p className="mb-4 text-slate-200">
            회고는 로그인 후 이용할 수 있어요.
            <br />
            내 우주가 클라우드에 있어야 기간을 모아볼 수 있거든요.
          </p>
          <button
            onClick={onOpenAuth}
            className="rounded-control bg-cosmos-accent px-6 py-3 font-semibold text-white shadow-e1 transition hover:shadow-glow active:animate-jelly"
          >
            🛰️ 동기화 로그인
          </button>
        </div>
      ) : (
        <>
          {/* 기간 토글 */}
          <div className="mb-4 flex gap-2">
            {(["week", "month"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                aria-pressed={period === p}
                className={`flex-1 rounded-control px-4 py-2.5 text-sm font-medium transition ${
                  period === p
                    ? "bg-cosmos-accent text-white"
                    : "border border-white/15 text-slate-300 hover:bg-white/10"
                }`}
              >
                {p === "week" ? "이번 주" : "이번 달"}
              </button>
            ))}
          </div>

          <button
            onClick={() => void generate()}
            disabled={phase === "loading"}
            className="mb-6 w-full rounded-control bg-cosmos-accent px-6 py-3.5 font-semibold text-white shadow-e1 transition hover:shadow-glow active:animate-jelly disabled:opacity-50"
          >
            {phase === "loading" ? "우주가 정리되는 중…" : "🔭 회고 받기"}
          </button>

          {phase === "loading" && (
            <div className="glass animate-shimmer h-40 rounded-card" />
          )}

          {phase === "error" && (
            <div className="glass rounded-card p-5 text-center text-sm text-rose-300">
              회고를 만들지 못했어요. 잠시 후 다시 시도해 주세요.
            </div>
          )}

          {phase === "done" && result?.empty && (
            <div className="glass rounded-card p-6 text-center text-sm text-slate-300">
              이 기간엔 아직 새긴 우주가 없어요.
              <br />
              오늘의 우주부터 하나 담아볼까요? 🌙
            </div>
          )}

          {phase === "done" && result && !result.empty && (
            <div className="animate-card-in space-y-4">
              <p className="num text-xs text-slate-500">
                {result.rangeStart} — {result.rangeEnd} · {result.count}개의 우주
              </p>

              {/* mood 분포 미니 바 */}
              {result.moodSummary && (
                <div className="glass space-y-2 rounded-card p-4">
                  {MOODS.filter((m) => (result.moodSummary?.[m.key] ?? 0) > 0).map(
                    (m) => {
                      const c = result.moodSummary?.[m.key] ?? 0;
                      return (
                        <div key={m.key} className="flex items-center gap-2">
                          <span className="w-16 shrink-0 text-xs text-slate-400">
                            {m.label}
                          </span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${(c / maxCount) * 100}%`,
                                backgroundColor: MOOD_HEX[m.key],
                              }}
                            />
                          </div>
                          <span className="num w-5 text-right text-xs text-slate-400">
                            {c}
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              )}

              {/* 회고 본문 */}
              <div className="glass rounded-card p-5">
                <p className="whitespace-pre-line leading-relaxed text-slate-100">
                  {result.text}
                </p>
              </div>

              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(result.text ?? "");
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1600);
                  } catch {
                    /* 무시 */
                  }
                }}
                className="w-full rounded-control border border-white/15 px-4 py-2.5 text-sm text-slate-200 transition hover:bg-white/10 active:animate-jelly"
              >
                {copied ? "복사됐어요 ✓" : "🌐 회고 복사하기"}
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
