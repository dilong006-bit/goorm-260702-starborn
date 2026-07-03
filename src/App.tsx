import { useState } from "react";
import type { SavedUniverse } from "./lib/types";
import { hasCollection } from "./lib/collection";
import Home from "./pages/Home";
import Birthday from "./pages/Birthday";
import Result from "./pages/Result";
import Collection from "./pages/Collection";
import Detail from "./pages/Detail";
import StarfieldBg from "./components/StarfieldBg";
import TabBar, { type TabKey } from "./components/TabBar";

type View =
  | { name: "home" }
  | { name: "input" }
  | { name: "result"; date: string; userName: string }
  | { name: "collection" }
  | { name: "detail"; saved: SavedUniverse };

// TabBar가 지속 노출되는 최상위 화면(오늘/추가/내우주). result·detail은 push(뒤로가기).
const TAB_VIEWS = new Set(["home", "input", "collection"]);

function viewToTab(name: View["name"]): TabKey {
  if (name === "input") return "add";
  if (name === "collection") return "collection";
  return "today";
}

export default function App() {
  // 첫 화면 분기: 컬렉션 없으면 add(입력)로 착지(아하 거리), 있으면 today.
  const [view, setView] = useState<View>(() =>
    hasCollection() ? { name: "home" } : { name: "input" }
  );

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
      page = <Home onOpenBirthday={() => setView({ name: "input" })} />;
  }

  return (
    <div className="relative min-h-screen">
      <StarfieldBg />
      {/* TabBar 높이만큼 하단 여백 확보(콘텐츠 가림 방지) */}
      <div className={showTab ? "pb-20" : ""}>{page}</div>
      {showTab && <TabBar active={viewToTab(view.name)} onNavigate={onNavigate} />}
    </div>
  );
}
