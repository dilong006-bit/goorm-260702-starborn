import { useCallback, useEffect, useRef, useState } from "react";
import { getApod, getStory } from "../lib/api";
import type { ApodResponse, SavedUniverse, Tone } from "../lib/types";
import CosmicCard from "../components/CosmicCard";
import ToneToggle from "../components/ToneToggle";
import ShareActionBar from "../components/ShareActionBar";
import SaveSheet from "../components/SaveSheet";
import Loader from "../components/Loader";
import { isSaved } from "../lib/collection";

const FALLBACK_NOTICE: Record<string, string> = {
  today_not_published:
    "아직 그날의 우주가 공개 전이라, 가장 가까운 날의 우주를 보여드려요.",
  clamped_max: "미래 날짜는 볼 수 없어서 가장 최근의 우주를 보여드려요.",
  clamped_min: "허블은 1995년부터 기록을 남겼어요. 가장 첫 우주를 보여드려요.",
  video_replaced_with_adjacent_image:
    "이 날의 우주는 영상이라, 가까운 날의 우주 이미지로 대신했어요.",
};

interface Props {
  date: string;
  name: string;
  onBack: () => void;
  onHome: () => void;
}

export default function Result({ date, name, onBack, onHome }: Props) {
  const [apod, setApod] = useState<ApodResponse | null>(null);
  const [apodLoading, setApodLoading] = useState(true);
  const [apodError, setApodError] = useState(false);

  const [tone, setTone] = useState<Tone>("essay");
  const [story, setStory] = useState<string | null>(null);
  const [storyLoading, setStoryLoading] = useState(false);
  const [storyError, setStoryError] = useState<string | null>(null);

  // 톤 연타 race 방지: 최신 요청만 반영
  const reqId = useRef(0);
  // 카드 캡처 루트(공유 이미지)
  const cardRef = useRef<HTMLElement>(null);

  // 저장 시트 + 저장 상태
  const savedId = `${date}:birthday`;
  const [sheetOpen, setSheetOpen] = useState(false);
  const [savedNow, setSavedNow] = useState(false);
  useEffect(() => {
    setSavedNow(isSaved(savedId));
  }, [savedId]);

  const loadStory = useCallback(
    async (apodDate: string, t: Tone) => {
      const id = ++reqId.current;
      setStoryLoading(true);
      setStoryError(null);
      try {
        const res = await getStory(apodDate, t, name || undefined);
        if (id === reqId.current) setStory(res.story);
      } catch (e) {
        if (id === reqId.current) setStoryError((e as Error).message);
      } finally {
        if (id === reqId.current) setStoryLoading(false);
      }
    },
    [name]
  );

  const loadApod = useCallback(async () => {
    setApodLoading(true);
    setApodError(false);
    try {
      const res = await getApod(date);
      setApod(res);
      void loadStory(res.date, tone);
    } catch {
      setApodError(true);
    } finally {
      setApodLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  useEffect(() => {
    void loadApod();
  }, [loadApod]);

  const onToneChange = (t: Tone) => {
    if (t === tone || !apod) return;
    setTone(t);
    void loadStory(apod.date, t);
  };

  const notice = apod?.fallback ? FALLBACK_NOTICE[apod.fallback] : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center px-5 py-10">
      <button
        onClick={onBack}
        className="mb-6 self-start text-sm text-slate-400 transition hover:text-slate-200"
      >
        ← 다른 날짜로
      </button>

      {apodLoading ? (
        <Loader label="그날의 우주를 불러오는 중…" />
      ) : apodError || !apod ? (
        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <p className="text-slate-300">
            우주를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
          </p>
          <button
            onClick={() => void loadApod()}
            className="rounded-control border border-white/20 px-5 py-2 text-sm text-slate-200 transition hover:bg-white/10"
          >
            다시 시도
          </button>
        </div>
      ) : (
        <div className="flex w-full flex-col items-center gap-5">
          {notice && (
            <p className="max-w-md rounded-control border border-cosmos-accent/30 bg-cosmos-accent/10 px-4 py-2 text-center text-sm text-cosmos-glow">
              {notice}
            </p>
          )}

          <ToneToggle value={tone} onChange={onToneChange} disabled={storyLoading} />

          <CosmicCard
            ref={cardRef}
            apod={apod}
            story={story}
            storyLoading={storyLoading}
            storyError={storyError}
            onRetryStory={() => void loadStory(apod.date, tone)}
          />

          {/* ⭐저장(SaveSheet) + 공유 (활성화 이벤트) — 스토리 준비 후에만 노출 */}
          {story &&
            !storyLoading &&
            !storyError &&
            (() => {
              const base: SavedUniverse = {
                id: savedId,
                apodDate: apod.date,
                inputDate: date,
                occasion: "birthday",
                name: name || undefined,
                label: name || undefined,
                tone,
                title: apod.title,
                imageUrl: apod.imageUrl,
                story,
                savedAt: "",
              };
              return (
                <div className="flex w-full flex-col items-center gap-3">
                  {savedNow ? (
                    <div className="w-full max-w-md rounded-control border border-cosmos-accent/40 bg-cosmos-accent/15 px-6 py-3.5 text-center font-semibold text-cosmos-glow">
                      저장됨 ⭐ 내 우주에 있어요
                    </div>
                  ) : (
                    <button
                      onClick={() => setSheetOpen(true)}
                      className="w-full max-w-md rounded-control bg-cosmos-accent px-6 py-3.5 font-semibold text-white shadow-e1 transition hover:shadow-glow active:animate-jelly"
                    >
                      ⭐ 내 우주에 저장
                    </button>
                  )}

                  <ShareActionBar
                    saved={base}
                    getNode={() => cardRef.current}
                    showSave={false}
                  />

                  {sheetOpen && (
                    <SaveSheet
                      base={base}
                      onClose={() => setSheetOpen(false)}
                      onSaved={() => setSavedNow(true)}
                    />
                  )}
                </div>
              );
            })()}

          {/* 바이럴 루프 CTA */}
          <div className="mt-2 flex flex-col items-center gap-3">
            <p className="text-sm text-slate-400">친구 생일은 어떤 우주일까요?</p>
            <div className="flex gap-3">
              <button
                onClick={onBack}
                className="rounded-control bg-cosmos-accent px-5 py-2.5 text-sm font-semibold text-white shadow-e1 transition hover:shadow-glow"
              >
                🎂 다른 생일 보기
              </button>
              <button
                onClick={onHome}
                className="rounded-control border border-white/15 px-5 py-2.5 text-sm text-slate-200 transition hover:bg-white/10"
              >
                오늘의 우주
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
