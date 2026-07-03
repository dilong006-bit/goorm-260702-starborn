import { supabase } from "./supabaseClient";
import type { Session } from "@supabase/supabase-js";

/**
 * Supabase Auth — 매직링크 전용 (Phase 1 · F1.1).
 * supabase 클라이언트가 없으면(= env 미설정) 모든 함수는 무해하게 no-op/에러 처리한다.
 * → Supabase 대시보드 설정 전에도 앱은 익명(localStorage)으로 정상 동작.
 */

/** 인증 사용 가능 여부(env 설정됨). false면 UI는 "곧 제공" 안내를 띄운다. */
export function authAvailable(): boolean {
  return !!supabase;
}

export async function getCurrentSession(): Promise<Session | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/** 세션 변화 구독. 반환값은 구독 해제 함수. */
export function onAuthChange(cb: (session: Session | null) => void): () => void {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    cb(session);
  });
  return () => data.subscription.unsubscribe();
}

/** 이메일로 매직링크 발송. 성공 시 사용자는 메일의 링크로 로그인한다. */
export async function signInWithMagicLink(email: string): Promise<void> {
  if (!supabase) throw new Error("auth_unavailable");
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}
