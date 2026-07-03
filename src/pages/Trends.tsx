import { useEffect, useState } from "react";
import { getTrends, type TrendsResult } from "../lib/api";
import { TONES, VOICES } from "../lib/types";

const TONE_LABEL: Record<string, string> = Object.fromEntries(
  TONES.map((t) => [t.key, t.label])
);
const VOICE_LABEL: Record<string, string> = Object.fromEntries(
  VOICES.map((v) => [v.key, `${v.emoji} ${v.label}`])
);
const CHANNEL_LABEL: Record<string, string> = {
  download: "⬇ 이미지",
  webshare: "🔗 공유",
  copylink: "🌐 링크",
};

interface Props {
  onBack: () => void;
}

export default function Trends({ onBack }: Props) {
  const [data, setData] = useState<TrendsResult | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    getTrends()
      .then((d) => alive && setData(d))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-10">
      <button
        onClick={onBack}
        className="mb-6 self-start text-sm text-slate-400 transition hover:text-slate-200"
      >
        ← 홈으로
      </button>

      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-50">추세 (내부)</h1>
        <p className="mt-1 text-sm text-slate-400">
          생성 로그·공유 이벤트 집계. 유저 데이터는 포함하지 않습니다.
        </p>
      </header>

      {error ? (
        <div className="glass rounded-card p-5 text-center text-sm text-rose-300">
          집계를 불러오지 못했어요.
        </div>
      ) : !data ? (
        <div className="glass animate-shimmer h-40 rounded-card" />
      ) : (
        <div className="space-y-6">
          <p className="num text-sm text-slate-400">
            총 생성 {data.total.toLocaleString()}건 · 공유 {data.share.total}건
          </p>

          <BarGroup title="톤" map={data.tone} label={TONE_LABEL} />
          <BarGroup title="목소리" map={data.voice} label={VOICE_LABEL} />
          <BarGroup title="프로바이더" map={data.provider} />
          <BarGroup title="공유 채널" map={data.share.channel} label={CHANNEL_LABEL} />
          <DayBars title="일자별 생성 (최근 14일)" map={data.genByDay} />
        </div>
      )}
    </main>
  );
}

function BarGroup({
  title,
  map,
  label,
}: {
  title: string;
  map: Record<string, number>;
  label?: Record<string, string>;
}) {
  const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(([, c]) => c));
  return (
    <section>
      <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">
        {title}
      </h2>
      {entries.length === 0 ? (
        <p className="text-sm text-slate-500">데이터 없음</p>
      ) : (
        <div className="space-y-1.5">
          {entries.map(([k, c]) => (
            <div key={k} className="flex items-center gap-2">
              <span className="w-24 shrink-0 truncate text-xs text-slate-300">
                {label?.[k] ?? k}
              </span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-cosmos-accent"
                  style={{ width: `${(c / max) * 100}%` }}
                />
              </div>
              <span className="num w-8 text-right text-xs text-slate-400">{c}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function DayBars({ title, map }: { title: string; map: Record<string, number> }) {
  const days = Object.entries(map)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-14);
  const max = Math.max(1, ...days.map(([, c]) => c));
  return (
    <section>
      <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">
        {title}
      </h2>
      {days.length === 0 ? (
        <p className="text-sm text-slate-500">데이터 없음</p>
      ) : (
        <div className="flex h-24 items-end gap-1">
          {days.map(([d, c]) => (
            <div key={d} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-cosmos-glow/70"
                style={{ height: `${(c / max) * 100}%` }}
                title={`${d}: ${c}`}
              />
              <span className="num text-[9px] text-slate-500">{d.slice(5)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
