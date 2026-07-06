import { useCallback, useEffect, useMemo, useState } from "react";
import { getApod, getStory } from "../lib/api";
import type { ApodResponse, ImmersiveSource, SavedUniverse, Tone } from "../lib/types";
import { hasCollection, getOnThisDay } from "../lib/collection";
import { proxied } from "../lib/share";
import CosmicCard from "../components/CosmicCard";
import Loader from "../components/Loader";
import StreakBadge from "../components/StreakBadge";

const DEFAULT_TONE: Tone = "essay";

// 폴백/클램프 코드 → 사용자 안내 문구
const FALLBACK_NOTICE: Record<string, string> = {
  today_not_published:
    "아직 오늘의 우주가 공개 전이라, 가장 가까운 어제의 우주를 보여드려요.",
  clamped_max: "미래 날짜는 볼 수 없어서 가장 최근의 우주를 보여드려요.",
  clamped_min: "허블은 1995년부터 기록을 남겼어요. 가장 첫 우주를 보여드려요.",
  video_replaced_with_adjacent_image:
    "이 날의 우주는 영상이라, 가까운 날의 우주 이미지로 대신했어요.",
};

export default function Home({
  onOpenBirthday,
  onOpenSaved,
  onBrowseDemo,
  onImmerse,
}: {
  onOpenBirthday: () => void;
  onOpenSaved: (u: SavedUniverse) => void;
  /** 샘플 우주 둘러보기(Epic B2). */
  onBrowseDemo: () => void;
  /** 크게 감상 / 힐링 모드(Epic A). */
  onImmerse: (req: {
    source: ImmersiveSource;
    saveBase?: SavedUniverse;
    healing?: boolean;
  }) => void;
}) {
  // On This Day(F2.2) — 오늘과 같은 월·일의 과거 우주
  const onThisDay = useMemo(() => getOnThisDay(), []);
  const [apod, setApod] = useState<ApodResponse | null>(null);
  const [apodLoading, setApodLoading] = useState(true);
  const [apodError, setApodError] = useState(false);

  const [story, setStory] = useState<string | null>(null);
  const [storyLoading, setStoryLoading] = useState(false);
  const [storyError, setStoryError] = useState<string | null>(null);

  const loadStory = useCallback(async (date: string) => {
    setStoryLoading(true);
    setStoryError(null);
    try {
      const res = await getStory(date, DEFAULT_TONE);
      setStory(res.story);
    } catch (e) {
      setStoryError((e as Error).message || "story_failed");
    } finally {
      setStoryLoading(false);
    }
  }, []);

  const loadToday = useCallback(async () => {
    setApodLoading(true);
    setApodError(false);
    try {
      const res = await getApod(); // 날짜 없음 = 오늘 (서버가 폴백 처리)
      setApod(res);
      void loadStory(res.date);
    } catch {
      setApodError(true);
    } finally {
      setApodLoading(false);
    }
  }, [loadStory]);

  useEffect(() => {
    void loadToday();
  }, [loadToday]);

  const notice = apod?.fallback ? FALLBACK_NOTICE[apod.fallback] : null;

  // 크게 감상 / 힐링 모드 진입 — 종료 시 오늘의 우주 저장 브릿지 연결
  const immerse = (healing: boolean) => {
    if (!apod) return;
    const source: ImmersiveSource = {
      date: apod.date,
      title: apod.title,
      imageUrl: apod.imageUrl,
      hdurl: null,
      mediaType: apod.mediaType,
      copyright: apod.copyright,
    };
    const saveBase: SavedUniverse = {
      id: `${apod.date}:today`,
      apodDate: apod.date,
      inputDate: apod.date,
      occasion: "today",
      tone: DEFAULT_TONE,
      title: apod.title,
      imageUrl: apod.imageUrl,
      story: story ?? "",
      savedAt: "",
    };
    onImmerse({ source, saveBase, healing });
  };

  return (
    <main className="flex min-h-screen flex-col items-center px-5 py-10">
      <header className="mb-8 flex flex-col items-center text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-cosmos-glow/70">
          Starborn
        </p>
        <h1 className="mt-1 bg-gradient-to-r from-cosmos-glow to-cosmos-accent bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
          오늘의 우주
        </h1>
        {hasCollection() ? (
          <p className="mt-2 text-sm text-slate-400">
            오늘의 우주가 도착했어요 ✨ 다시 만나서 반가워요.
          </p>
        ) : null}
        <div className="mt-3">
          <StreakBadge />
        </div>
      </header>

      {/* On This Day — 그날의 우주 */}
      {onThisDay.length > 0 && (
        <section className="mb-8 w-full max-w-md animate-rise-in">
          <p className="mb-2 text-sm font-medium text-cosmos-star">
            🌠 그날의 우주 · On This Day
          </p>
          <div className="flex flex-col gap-2">
            {onThisDay.slice(0, 2).map((u) => {
              const yearsAgo =
                new Date().getFullYear() - Number(u.inputDate.slice(0, 4));
              return (
                <button
                  key={u.id}
                  onClick={() => onOpenSaved(u)}
                  className="glass flex items-center gap-3 rounded-card p-2.5 text-left transition active:animate-jelly hover:shadow-glow"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-control bg-cosmos-900">
                    {u.imageUrl && (
                      <img
                        src={proxied(u.imageUrl) ?? undefined}
                        alt={u.title}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-100">
                      {yearsAgo > 0 ? `${yearsAgo}년 전 오늘` : "지난날의 오늘"}
                    </p>
                    <p className="truncate text-xs text-slate-400">{u.title}</p>
                  </div>
                  <span className="text-slate-500">→</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {apodLoading ? (
        <Loader label="오늘의 우주를 불러오는 중…" />
      ) : apodError || !apod ? (
        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <p className="text-slate-300">
            우주를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
          </p>
          <button
            onClick={() => void loadToday()}
            className="rounded-full border border-white/20 px-5 py-2 text-sm text-slate-200 transition hover:bg-white/10"
          >
            다시 시도
          </button>
        </div>
      ) : (
        <div className="flex w-full flex-col items-center gap-5">
          {notice && (
            <p className="max-w-md rounded-2xl border border-cosmos-accent/30 bg-cosmos-accent/10 px-4 py-2 text-center text-sm text-cosmos-glow">
              {notice}
            </p>
          )}
          <CosmicCard
            apod={apod}
            story={story}
            storyLoading={storyLoading}
            storyError={storyError}
            onRetryStory={() => void loadStory(apod.date)}
          />

          {/* 크게 감상 / 힐링 모드 — Epic A 진입점 */}
          {apod.imageUrl && (
            <div className="flex w-full max-w-md gap-2">
              <button
                onClick={() => immerse(false)}
                className="flex-1 rounded-control border border-white/15 px-4 py-2.5 text-sm font-medium text-slate-100 transition hover:bg-white/10 active:animate-jelly"
              >
                🔭 크게 감상
              </button>
              <button
                onClick={() => immerse(true)}
                className="flex-1 rounded-control border border-cosmos-glow/30 bg-cosmos-glow/10 px-4 py-2.5 text-sm font-medium text-cosmos-glow transition hover:bg-cosmos-glow/15 active:animate-jelly"
              >
                🌙 힐링 모드
              </button>
            </div>
          )}

          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <button
              onClick={onOpenBirthday}
              className="rounded-control bg-cosmos-accent px-6 py-3 font-semibold text-white shadow-e1 transition hover:shadow-glow active:animate-jelly"
            >
              🎂 내 생일의 우주 보기
            </button>
          </div>
        </div>
      )}

      {/* 샘플 우주 둘러보기 — Epic B2(비강제 보조 CTA) */}
      <button
        onClick={onBrowseDemo}
        className="mt-8 text-sm text-slate-400 underline-offset-4 transition hover:text-cosmos-glow hover:underline"
      >
        🔭 샘플 우주 둘러보기 →
      </button>
    </main>
  );
}
