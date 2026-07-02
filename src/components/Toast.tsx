import { useEffect } from "react";

interface Props {
  message: string;
  /** 표시 시간(ms) 후 onDone 호출 */
  duration?: number;
  onDone: () => void;
}

/** 화면 하단에 잠깐 떴다 사라지는 피드백 토스트. */
export default function Toast({ message, duration = 1800, onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, duration);
    return () => clearTimeout(t);
  }, [duration, onDone]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-rise-in fixed inset-x-0 bottom-8 z-50 flex justify-center px-5"
    >
      <div className="glass rounded-control px-5 py-2.5 text-sm text-slate-100 shadow-e2">
        {message}
      </div>
    </div>
  );
}
