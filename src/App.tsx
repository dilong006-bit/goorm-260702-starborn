import { useState } from "react";
import Home from "./pages/Home";
import Birthday from "./pages/Birthday";
import Result from "./pages/Result";

type View =
  | { name: "home" }
  | { name: "input" }
  | { name: "result"; date: string; userName: string };

export default function App() {
  const [view, setView] = useState<View>({ name: "home" });

  switch (view.name) {
    case "input":
      return (
        <Birthday
          onBack={() => setView({ name: "home" })}
          onSubmit={(date, userName) =>
            setView({ name: "result", date, userName })
          }
        />
      );
    case "result":
      return (
        <Result
          date={view.date}
          name={view.userName}
          onBack={() => setView({ name: "input" })}
          onHome={() => setView({ name: "home" })}
        />
      );
    default:
      return <Home onOpenBirthday={() => setView({ name: "input" })} />;
  }
}
