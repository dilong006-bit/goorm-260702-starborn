import { VOICES, type Voice } from "../lib/types";

interface Props {
  value: Voice;
  onChange: (v: Voice) => void;
  disabled?: boolean;
}

/** 목소리(문체) 선택 — 톤과 직교(F3.1). LLM 종류는 노출하지 않는다. */
export default function VoiceToggle({ value, onChange, disabled }: Props) {
  return (
    <div
      role="tablist"
      aria-label="이야기 목소리 선택"
      className="glass inline-flex gap-1 rounded-control p-1"
    >
      {VOICES.map((v) => {
        const active = v.key === value;
        return (
          <button
            key={v.key}
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onChange(v.key)}
            className={[
              "rounded-[10px] px-3.5 py-1.5 text-sm transition",
              active
                ? "bg-cosmos-accent font-semibold text-white shadow-e1"
                : "text-slate-300 hover:bg-white/5",
              disabled ? "cursor-not-allowed opacity-60" : "",
            ].join(" ")}
          >
            {v.emoji} {v.label}
          </button>
        );
      })}
    </div>
  );
}
