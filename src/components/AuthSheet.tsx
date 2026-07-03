import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { authAvailable, signInWithMagicLink, signOut } from "../lib/auth";

interface Props {
  session: Session | null;
  onClose: () => void;
  /** (내부) 추세 대시보드 열기 */
  onTrends?: () => void;
}

type Phase = "form" | "sending" | "sent" | "error";

/**
 * AuthSheet (F1.1) — 매직링크 로그인 모달.
 * - 로그인 상태: 이메일 표시 + 로그아웃.
 * - Supabase 미설정(authAvailable=false): "곧 제공" 안내(설정 전에도 앱은 익명으로 정상).
 */
export default function AuthSheet({ session, onClose, onTrends }: Props) {
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  async function onSend() {
    if (!valid || phase === "sending") return;
    setPhase("sending");
    try {
      await signInWithMagicLink(email.trim());
      setPhase("sent");
    } catch (e) {
      setErrMsg((e as Error).message || "failed");
      setPhase("error");
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="동기화 로그인"
      className="fixed inset-0 z-40 flex items-end justify-center sm:items-center"
    >
      <button
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <div className="glass-strong animate-rise-in relative z-10 w-full max-w-md rounded-t-card px-5 pb-8 pt-4 sm:rounded-card">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-white/20 sm:hidden" />

        {!authAvailable() ? (
          <div className="py-2 text-center">
            <p className="mb-2 text-lg font-bold text-slate-50">
              동기화는 곧 제공돼요 🛰️
            </p>
            <p className="text-sm text-slate-400">
              지금은 이 기기에 안전하게 저장됩니다. 클라우드 동기화가 준비되면
              어느 기기에서든 내 우주를 이어볼 수 있어요.
            </p>
          </div>
        ) : session ? (
          <div className="py-2">
            <p className="mb-1 text-lg font-bold text-slate-50">동기화 중 ⭐</p>
            <p className="mb-5 text-sm text-slate-400">
              {session.user.email}
            </p>
            <button
              onClick={async () => {
                await signOut();
                onClose();
              }}
              className="w-full rounded-control border border-white/15 px-6 py-3 font-medium text-slate-200 transition hover:bg-white/10 active:animate-jelly"
            >
              로그아웃
            </button>
            {onTrends && (
              <button
                onClick={() => {
                  onClose();
                  onTrends();
                }}
                className="mt-3 w-full text-center text-xs text-slate-500 transition hover:text-slate-300"
              >
                📊 추세 (내부)
              </button>
            )}
          </div>
        ) : phase === "sent" ? (
          <div className="py-2 text-center">
            <p className="mb-2 text-lg font-bold text-slate-50">
              메일을 확인해 주세요 📬
            </p>
            <p className="text-sm text-slate-400">
              <span className="text-slate-200">{email}</span> 으로 로그인 링크를
              보냈어요. 링크를 누르면 내 우주가 이 기기와 동기화됩니다.
            </p>
          </div>
        ) : (
          <div className="py-2">
            <p className="mb-1 text-lg font-bold text-slate-50">
              내 우주 동기화하기
            </p>
            <p className="mb-5 text-sm text-slate-400">
              이메일로 로그인 링크를 보내드려요. 비밀번호는 필요 없어요.
            </p>

            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void onSend()}
              placeholder="you@example.com"
              className="glass mb-3 w-full rounded-control px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:shadow-glow"
            />

            {phase === "error" && (
              <p className="mb-3 text-sm text-rose-300">
                메일을 보내지 못했어요. 잠시 후 다시 시도해 주세요. ({errMsg})
              </p>
            )}

            <button
              onClick={() => void onSend()}
              disabled={!valid || phase === "sending"}
              className="w-full rounded-control bg-cosmos-accent px-6 py-3.5 font-semibold text-white shadow-e1 transition enabled:hover:shadow-glow active:animate-jelly disabled:cursor-not-allowed disabled:opacity-40"
            >
              {phase === "sending" ? "보내는 중…" : "로그인 링크 받기"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
