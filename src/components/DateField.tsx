interface Props {
  value: string;
  onChange: (v: string) => void;
  min: string;
  max: string;
}

export default function DateField({ value, onChange, min, max }: Props) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-slate-300">생년월일 (또는 기억하고 싶은 날)</span>
      <input
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className="num glass w-full rounded-control px-4 py-3 text-slate-100 outline-none transition focus:shadow-glow [color-scheme:dark]"
      />
      <span className="mt-1.5 block text-xs text-slate-500">
        허블은 1995-06-16부터 기록을 남겼어요.
      </span>
    </label>
  );
}
