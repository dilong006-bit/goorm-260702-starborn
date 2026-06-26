import type { ApodResponse } from "../lib/types";
import Loader from "./Loader";

interface Props {
  apod: ApodResponse;
  story: string | null;
  storyLoading: boolean;
  storyError: string | null;
  onRetryStory?: () => void;
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
}

export default function CosmicCard({
  apod,
  story,
  storyLoading,
  storyError,
  onRetryStory,
}: Props) {
  return (
    <article className="glass animate-card-in w-full max-w-md overflow-hidden rounded-card shadow-e2">
      {/* 우주 이미지 */}
      <div className="relative aspect-square w-full bg-cosmos-900">
        {apod.imageUrl ? (
          <img
            src={apod.imageUrl}
            alt={apod.title}
            className="h-full w-full object-cover"
            loading="eager"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            이 날의 우주는 영상이라 이미지를 보여드릴 수 없어요
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
        <p className="absolute bottom-3 left-4 right-4 truncate text-xs text-slate-300/90">
          {apod.title}
        </p>
      </div>

      {/* 본문 */}
      <div className="space-y-4 p-6">
        <p className="num text-sm font-medium text-cosmos-glow">
          {formatDate(apod.date)}의 우주
        </p>

        {storyLoading ? (
          <Loader label="Claude가 오늘의 우주 이야기를 쓰고 있어요…" />
        ) : storyError ? (
          <div className="space-y-3 py-2">
            <p className="text-sm text-rose-300">
              이야기를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
            </p>
            {onRetryStory && (
              <button
                onClick={onRetryStory}
                className="rounded-full border border-white/20 px-4 py-1.5 text-sm text-slate-200 transition hover:bg-white/10"
              >
                다시 시도
              </button>
            )}
          </div>
        ) : (
          <p className="whitespace-pre-line text-[15px] leading-relaxed text-slate-100">
            {story}
          </p>
        )}

        {/* 크레딧 / 출처 */}
        <footer className="border-t border-white/10 pt-3 text-[11px] leading-relaxed text-slate-400">
          <p>
            Image: NASA APOD
            {apod.copyright ? ` · © ${apod.copyright}` : ""}
          </p>
          <p>본 서비스는 NASA와 무관한 학습용 독립 프로젝트입니다.</p>
        </footer>
      </div>
    </article>
  );
}
