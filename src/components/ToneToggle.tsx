import { TONES, type Tone } from "../lib/types";

interface Props {
  value: Tone;
  onChange: (t: Tone) => void;
  disabled?: boolean;
}

export default function ToneToggle({ value, onChange, disabled }: Props) {
  return (
    <div
      role="tablist"
      aria-label="이야기 톤 선택"
      className="glass inline-flex gap-1 rounded-control p-1"
    >
      {TONES.map((t) => {
        const active = t.key === value;
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onChange(t.key)}
            className={[
              "rounded-[10px] px-3.5 py-1.5 text-sm transition",
              active
                ? "bg-cosmos-accent font-semibold text-white shadow-e1"
                : "text-slate-300 hover:bg-white/5",
              disabled ? "cursor-not-allowed opacity-60" : "",
            ].join(" ")}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
