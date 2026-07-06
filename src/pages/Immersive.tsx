import { useCallback, useEffect, useRef, useState } from "react";
import type { ImmersiveSource, MotionLevel, SavedUniverse } from "../lib/types";
import { getCalm, setCalm } from "../lib/calm";
import { proxied } from "../lib/share";
import { ambient } from "../lib/ambientAudio";
import { useWakeLock } from "../lib/useWakeLock";
import { tap } from "../lib/haptics";
import { isDemo } from "../lib/demo";
import SaveSheet from "../components/SaveSheet";

interface Props {
  source: ImmersiveSource;
  onClose: () => void;
  /** 기록 브릿지 대상(있으면 종료 시 "오늘 어땠나요?" 노출). 데모/이미 저장 시 생략. */
  saveBase?: SavedUniverse;
  onSaved?: (saved: SavedUniverse) => void;
  /** 힐링 세션(A4)으로 진입 — 사운드/호흡 기본 on 유도. */
  healing?: boolean;
}

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function kenBurnsClass(level: MotionLevel): string {
  if (prefersReducedMotion() || level === "off") return "";
  return level === "full" ? "animate-ken-burns-full" : "animate-ken-burns-subtle";
}

function formatDate(iso: string): string {
  const p = iso.split("-");
  if (p.length !== 3) return iso;
  return `${p[0]}년 ${Number(p[1])}월 ${Number(p[2])}일의 우주`;
}

export default function Immersive({
  source,
  onClose,
  saveBase,
  onSaved,
  healing = false,
}: Props) {
  const initial = getCalm();
  const [motionLevel, setMotionLevel] = useState<MotionLevel>(initial.motionLevel);
  const [soundOn, setSoundOn] = useState(ambient.isPlaying());
  const [volume, setVolume] = useState(0.5);
  const [breathing, setBreathing] = useState(healing);
  const [keepAwake, setKeepAwake] = useState(false);
  const [hdLoaded, setHdLoaded] = useState(false);
  const [chrome, setChrome] = useState(true);
  const [bridge, setBridge] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const hideTimer = useRef<number | null>(null);

  useWakeLock(keepAwake);

  const bigUrl = source.hdurl || source.imageUrl;
  const canBridge = !!saveBase && !isDemo();

  // 크롬 자동 페이드(3초 무동작) — AC A1③
  const poke = useCallback(() => {
    setChrome(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setChrome(false), 3200);
  }, []);

  useEffect(() => {
    poke();
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, [poke]);

  // 사운드 재생 상태 동기화 + 감상 종료 시 사운드 정리(백그라운드 잔향 방지)
  useEffect(() => {
    const unsub = ambient.subscribe((p) => setSoundOn(p));
    return () => {
      unsub();
      ambient.stop();
    };
  }, []);

  // 힐링 진입 시 사운드 자동 유도(단, 사용자 제스처=진입 탭이 이미 발생 → 정책 OK)
  useEffect(() => {
    if (healing && !ambient.isPlaying()) {
      void ambient.start(volume);
      setCalm({ ambientSound: true });
    }
    // 언마운트 시 세션 사운드 정리는 하지 않음(사용자가 명시적으로 끄거나 백그라운드 페이드)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [healing]);

  // Esc = 닫기(브릿지 우회)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleSound() {
    tap(6);
    if (ambient.isPlaying()) {
      ambient.stop();
      setCalm({ ambientSound: false });
    } else {
      void ambient.start(volume); // 클릭 제스처 = autoplay 정책 충족
      setCalm({ ambientSound: true });
    }
  }

  function changeMotion(level: MotionLevel) {
    setMotionLevel(level);
    setCalm({ motionLevel: level });
    tap(6);
  }

  function requestClose() {
    if (canBridge) {
      setBridge(true); // 기록 브릿지(노벨티 트랩 방지)
      setChrome(true);
    } else {
      onClose();
    }
  }

  const motionCls = kenBurnsClass(motionLevel);
  const proxiedBig = proxied(bigUrl) ?? undefined;
  const proxiedSmall = proxied(source.imageUrl) ?? undefined;

  return (
    <div
      className="fixed inset-0 z-50 select-none overflow-hidden bg-black"
      role="dialog"
      aria-modal="true"
      aria-label="몰입 감상"
      onMouseMove={poke}
      onTouchStart={poke}
    >
      {/* ── 배경: blur-up placeholder → hd 이미지(Ken Burns) ── */}
      <button
        type="button"
        aria-label={chrome ? "컨트롤 숨기기" : "컨트롤 보이기"}
        onClick={() => (chrome ? setChrome(false) : poke())}
        className="absolute inset-0 h-full w-full cursor-default"
      >
        {source.mediaType === "video" && !source.imageUrl ? (
          <div className="flex h-full w-full items-center justify-center px-8 text-center text-slate-300">
            이 날의 우주는 영상이라, 몰입 감상은 이미지가 있는 날에 열려요.
          </div>
        ) : (
          <>
            {/* 저해상 blur 플레이스홀더 — 즉시 표시(지각 성능) */}
            {proxiedSmall && (
              <img
                src={proxiedSmall}
                alt=""
                aria-hidden
                className={`absolute inset-0 h-full w-full scale-110 object-cover blur-2xl transition-opacity duration-700 ${
                  hdLoaded ? "opacity-0" : "opacity-100"
                }`}
              />
            )}
            {/* 대형 이미지 — 로드 후 페이드 인 + Ken Burns */}
            <img
              src={proxiedBig}
              alt={source.title}
              onLoad={() => setHdLoaded(true)}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                hdLoaded ? "opacity-100" : "opacity-0"
              } ${motionCls}`}
              style={{ willChange: motionCls ? "transform" : undefined }}
            />
            {/* 별 레이어 패럴럭스(깊이감) */}
            {motionCls && (
              <div
                aria-hidden
                className="animate-parallax absolute inset-0 opacity-40 mix-blend-screen"
                style={{
                  backgroundImage:
                    "radial-gradient(1.5px 1.5px at 20% 30%, rgba(255,255,255,.9), transparent), radial-gradient(1.5px 1.5px at 70% 60%, rgba(168,181,255,.8), transparent), radial-gradient(1px 1px at 40% 80%, rgba(255,212,121,.8), transparent), radial-gradient(1px 1px at 85% 20%, rgba(255,255,255,.7), transparent)",
                }}
              />
            )}
            {/* 가독성 비네트 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
          </>
        )}
      </button>

      {/* ── 호흡 가이드(A4 opt-in) ── */}
      {breathing && !prefersReducedMotion() && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className="animate-breathe rounded-full border border-cosmos-glow/40"
            style={{ width: "42vmin", height: "42vmin", animationDuration: "10s" }}
          />
          <span
            className={`absolute text-sm tracking-widest text-cosmos-glow/80 transition-opacity ${
              chrome ? "opacity-0" : "opacity-90"
            }`}
          >
            천천히… 들이쉬고, 내쉬고
          </span>
        </div>
      )}

      {/* ── 상단 크롬: 닫기 ── */}
      <div
        className={`absolute inset-x-0 top-0 flex items-center justify-between p-4 transition-opacity duration-500 ${
          chrome ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <span className="glass rounded-full px-3 py-1 text-xs text-slate-200">
          {healing ? "🌙 힐링 모드" : "🔭 감상 모드"}
          {isDemo() && " · 둘러보기"}
        </span>
        <button
          onClick={requestClose}
          aria-label="감상 닫기"
          className="glass rounded-full px-3.5 py-1.5 text-sm text-slate-100 transition hover:bg-white/15 active:animate-jelly"
        >
          ✕ 닫기
        </button>
      </div>

      {/* ── 하단 크롬: 메타 + 컨트롤 ── */}
      <div
        className={`absolute inset-x-0 bottom-0 space-y-3 p-5 transition-opacity duration-500 ${
          chrome ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 메타(제목·날짜·저작권) */}
        <div className="max-w-md">
          <p className="num text-xs text-cosmos-glow/90">{formatDate(source.date)}</p>
          <h2 className="mt-0.5 text-lg font-semibold text-white drop-shadow">
            {source.title}
          </h2>
          <p className="mt-1 text-[11px] text-slate-300/80">
            Image: NASA APOD
            {source.copyright ? ` · © ${source.copyright}` : " · Public Domain"}
          </p>
        </div>

        {/* 컨트롤 바 */}
        <div className="glass flex flex-wrap items-center gap-2 rounded-control p-2">
          {/* 사운드 */}
          <button
            onClick={toggleSound}
            aria-pressed={soundOn}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition active:animate-jelly ${
              soundOn ? "bg-cosmos-accent text-white" : "text-slate-200 hover:bg-white/10"
            }`}
          >
            {soundOn ? "🔊 우주 소리" : "🔈 소리 켜기"}
          </button>

          {soundOn && (
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => {
                const v = Number(e.target.value);
                setVolume(v);
                ambient.setVolume(v);
              }}
              aria-label="볼륨"
              className="h-1 w-20 cursor-pointer accent-cosmos-accent"
            />
          )}

          <span className="mx-0.5 h-5 w-px bg-white/15" />

          {/* 모션 강도(A2) */}
          <div className="inline-flex overflow-hidden rounded-full border border-white/15">
            {(["off", "subtle", "full"] as MotionLevel[]).map((lv) => (
              <button
                key={lv}
                onClick={() => changeMotion(lv)}
                aria-pressed={motionLevel === lv}
                className={`px-2.5 py-1 text-xs transition ${
                  motionLevel === lv
                    ? "bg-white/15 text-white"
                    : "text-slate-300 hover:bg-white/5"
                }`}
              >
                {lv === "off" ? "정지" : lv === "subtle" ? "은은" : "풍부"}
              </button>
            ))}
          </div>

          <span className="mx-0.5 h-5 w-px bg-white/15" />

          {/* 호흡 */}
          <button
            onClick={() => {
              setBreathing((b) => !b);
              tap(6);
            }}
            aria-pressed={breathing}
            className={`rounded-full px-3 py-1.5 text-sm transition active:animate-jelly ${
              breathing ? "bg-cosmos-glow/20 text-cosmos-glow" : "text-slate-200 hover:bg-white/10"
            }`}
          >
            🫧 호흡
          </button>

          {/* 화면 유지(opt-in, 배터리 고지) */}
          <button
            onClick={() => {
              setKeepAwake((k) => !k);
              tap(6);
            }}
            aria-pressed={keepAwake}
            title="화면을 켜둡니다 · 배터리를 더 씁니다"
            className={`rounded-full px-3 py-1.5 text-sm transition active:animate-jelly ${
              keepAwake ? "bg-cosmos-star/20 text-cosmos-star" : "text-slate-200 hover:bg-white/10"
            }`}
          >
            ☀️ 화면유지
          </button>
        </div>
        {keepAwake && (
          <p className="text-[11px] text-slate-400">
            화면유지가 켜졌어요 — 배터리를 조금 더 사용합니다.
          </p>
        )}
      </div>

      {/* ── 기록 브릿지(A4 필수) — 감상→기록 ── */}
      {bridge && !sheetOpen && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
          <div className="glass-strong animate-rise-in w-full max-w-sm rounded-card p-6 text-center">
            <p className="text-lg font-semibold text-slate-50">오늘, 어땠나요?</p>
            <p className="mt-1.5 text-sm text-slate-400">
              잠시 머문 이 우주에 오늘의 마음을 한 줄 남겨볼까요?
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                onClick={() => setSheetOpen(true)}
                className="w-full rounded-control bg-cosmos-accent px-6 py-3 font-semibold text-white shadow-e1 transition hover:shadow-glow active:animate-jelly"
              >
                ⭐ 오늘의 느낌 남기기
              </button>
              <button
                onClick={onClose}
                className="w-full rounded-control border border-white/15 px-6 py-2.5 text-sm text-slate-300 transition hover:bg-white/10"
              >
                다음에 할게요
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 기록 시트 */}
      {sheetOpen && saveBase && (
        <SaveSheet
          base={saveBase}
          onClose={() => {
            setSheetOpen(false);
            onClose();
          }}
          onSaved={(saved) => {
            onSaved?.(saved);
          }}
        />
      )}
    </div>
  );
}
