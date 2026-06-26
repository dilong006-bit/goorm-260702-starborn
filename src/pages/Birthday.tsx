import { useState } from "react";
import DateField from "../components/DateField";

const MIN_DATE = "1995-06-16";

function todayLocal() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

interface Props {
  onSubmit: (date: string, name: string) => void;
  onBack: () => void;
}

export default function Birthday({ onSubmit, onBack }: Props) {
  const max = todayLocal();
  const [date, setDate] = useState("");
  const [name, setName] = useState("");

  const valid = !!date && date >= MIN_DATE && date <= max;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">
      <button
        onClick={onBack}
        className="mb-6 self-start text-sm text-slate-400 transition hover:text-slate-200"
      >
        ← 오늘의 우주로
      </button>

      <header className="mb-8 animate-rise-in">
        <p className="text-xs uppercase tracking-[0.3em] text-cosmos-glow/70">
          Starborn
        </p>
        <h1 className="mt-1 text-3xl font-bold text-slate-50">
          내 생일의 우주
        </h1>
        <p className="mt-2 text-slate-300">
          태어난 날(또는 특별한 날)을 알려주세요. 그날 우주의 모습을 이야기로
          들려드릴게요.
        </p>
      </header>

      <div className="animate-rise-in space-y-5" style={{ animationDelay: "60ms" }}>
        <DateField value={date} onChange={setDate} min={MIN_DATE} max={max} />

        <label className="block">
          <span className="mb-2 block text-sm text-slate-300">이름 (선택)</span>
          <input
            type="text"
            value={name}
            maxLength={20}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 지호"
            className="glass w-full rounded-control px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:shadow-glow"
          />
        </label>

        <button
          onClick={() => valid && onSubmit(date, name.trim())}
          disabled={!valid}
          className="w-full rounded-control bg-cosmos-accent px-6 py-3.5 font-semibold text-white shadow-e1 transition enabled:hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-40"
        >
          ✨ 내 우주 열기
        </button>
      </div>
    </main>
  );
}
