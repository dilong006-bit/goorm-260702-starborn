import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { SavedUniverse } from "./lib/types";
import {
  hasCollection,
  setCurrentUser,
  migrateLocalToRemote,
  getCollection,
  clearLocalMirror,
} from "./lib/collection";
import { getCurrentSession, onAuthChange } from "./lib/auth";
import { touchLastSeen } from "./lib/metrics";
import Home from "./pages/Home";
import Birthday from "./pages/Birthday";
import Result from "./pages/Result";
import Collection from "./pages/Collection";
import Detail from "./pages/Detail";
import StarfieldBg from "./components/StarfieldBg";
import TabBar, { type TabKey } from "./components/TabBar";
import AuthSheet from "./components/AuthSheet";
import Loader from "./components/Loader";

// 이차 화면은 지연 로드(초기 번들 경량화)
const Constellation = lazy(() => import("./pages/Constellation"));
const Retrospective = lazy(() => import("./pages/Retrospective"));
const Trends = lazy(() => import("./pages/Trends"));

type View =
  | { name: "home" }
  | { name: "input" }
  | { name: "result"; date: string; userName: string }
  | { name: "collection" }
  | { name: "detail"; saved: SavedUniverse }
  | { name: "constellation" }
  | { name: "retrospective" }
  | { name: "trends" };

// TabBar가 지속 노출되는 최상위 화면(오늘/추가/내우주). result·detail은 push(뒤로가기).
const TAB_VIEWS = new Set(["home", "input", "collection"]);

function viewToTab(name: View["name"]): TabKey {
  if (name === "input") return "add";
  if (name === "collection") return "collection";
  return "today";
}

export default function App() {
  // 첫 화면 분기:
  //  - 공유 딥링크(?date=YYYY-MM-DD) → 그날의 우주(result)로 착지
  //  - 아니면 컬렉션 없으면 add(입력), 있으면 today
  const [view, setView] = useState<View>(() => {
    try {
      const d = new URLSearchParams(window.location.search).get("date");
      if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
        return { name: "result", date: d, userName: "" };
      }
    } catch {
      /* 무시 */
    }
    return hasCollection() ? { name: "home" } : { name: "input" };
  });
  const [session, setSession] = useState<Session | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const prevUser = useRef<string | null>(null);

  // 북극성 지표(F1.5): 방문 스탬프
  useEffect(() => {
    touchLastSeen();
  }, []);

  // 세션 초기화 + 변화 구독. 로그인 시 로컬→원격 마이그레이션.
  useEffect(() => {
    let mounted = true;
    const apply = async (s: Session | null) => {
      const uid = s?.user?.id ?? null;
      if (uid) {
        setCurrentUser(uid);
        await migrateLocalToRemote(uid);
        void getCollection(); // 클라우드→미러 워밍(멀티기기 스트릭/On This Day 정합)
      } else {
        setCurrentUser(null);
        // 로그아웃 전환에서만 미러 비우기(초기 무세션 로드에선 익명 데이터 보존)
        if (prevUser.current) clearLocalMirror();
      }
      prevUser.current = uid;
      if (mounted) setSession(s);
    };
    void getCurrentSession().then(apply);
    const unsub = onAuthChange((s) => void apply(s));
    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const onNavigate = (key: TabKey) => {
    setView(
      key === "add"
        ? { name: "input" }
        : key === "collection"
          ? { name: "collection" }
          : { name: "home" }
    );
  };

  const showTab = TAB_VIEWS.has(view.name);

  let page: JSX.Element;
  switch (view.name) {
    case "input":
      page = (
        <Birthday
          onBack={() => setView({ name: "home" })}
          onSubmit={(date, userName) =>
            setView({ name: "result", date, userName })
          }
        />
      );
      break;
    case "result":
      page = (
        <Result
          date={view.date}
          name={view.userName}
          onBack={() => setView({ name: "input" })}
          onHome={() => setView({ name: "home" })}
        />
      );
      break;
    case "collection":
      page = (
        <Collection
          onBack={() => setView({ name: "home" })}
          onAdd={() => setView({ name: "input" })}
          onOpen={(saved) => setView({ name: "detail", saved })}
          onConstellation={() => setView({ name: "constellation" })}
          onRetrospective={() => setView({ name: "retrospective" })}
        />
      );
      break;
    case "retrospective":
      page = (
        <Retrospective
          session={session}
          onBack={() => setView({ name: "collection" })}
          onOpenAuth={() => setAuthOpen(true)}
        />
      );
      break;
    case "trends":
      page = <Trends onBack={() => setView({ name: "home" })} />;
      break;
    case "constellation":
      page = (
        <Constellation
          onBack={() => setView({ name: "collection" })}
          onOpen={(saved) => setView({ name: "detail", saved })}
          onAdd={() => setView({ name: "input" })}
        />
      );
      break;
    case "detail":
      page = (
        <Detail
          universe={view.saved}
          onBack={() => setView({ name: "collection" })}
          onRemoved={() => setView({ name: "collection" })}
        />
      );
      break;
    default:
      page = (
        <Home
          onOpenBirthday={() => setView({ name: "input" })}
          onOpenSaved={(saved) => setView({ name: "detail", saved })}
        />
      );
  }

  return (
    <div className="relative min-h-screen">
      <StarfieldBg />

      {/* 계정/동기화 — 탭 화면에서만 우상단 고정 */}
      {showTab && (
        <button
          onClick={() => setAuthOpen(true)}
          className="glass fixed right-4 top-4 z-20 rounded-full px-3.5 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/10 active:animate-jelly"
          aria-label={session ? "계정" : "동기화 로그인"}
        >
          {session ? "⭐ 동기화 중" : "🛰️ 동기화"}
        </button>
      )}

      {/* 세션 전환 시 페이지 remount → 컬렉션 재조회 */}
      <div key={session?.user?.id ?? "anon"} className={showTab ? "pb-20" : ""}>
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center">
              <Loader label="불러오는 중…" />
            </div>
          }
        >
          {page}
        </Suspense>
      </div>

      {showTab && <TabBar active={viewToTab(view.name)} onNavigate={onNavigate} />}

      {authOpen && (
        <AuthSheet
          session={session}
          onClose={() => setAuthOpen(false)}
          onTrends={() => setView({ name: "trends" })}
        />
      )}
    </div>
  );
}
