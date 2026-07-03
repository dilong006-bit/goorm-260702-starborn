import { useRef, useState } from "react";
import type { Stroke } from "../lib/types";

interface Props {
  strokes: Stroke[];
  /** 그리기 도구 활성 여부. false면 정적(공유 PNG 캡처 포함). */
  drawing: boolean;
  color: string;
  width: number;
  onCommit: (stroke: Stroke) => void;
}

const clamp = (v: number) => Math.min(1, Math.max(0, v));

/**
 * 자유 드로잉 레이어(F3.2 stretch).
 * viewBox 0..1 + preserveAspectRatio=none로 상대좌표 매핑, vector-effect로 선 두께는 px 고정.
 */
export default function DrawLayer({
  strokes,
  drawing,
  color,
  width,
  onCommit,
}: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const active = useRef(false);
  const [current, setCurrent] = useState<Stroke | null>(null);

  function toXY(e: React.PointerEvent) {
    const el = ref.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      x: clamp((e.clientX - rect.left) / rect.width),
      y: clamp((e.clientY - rect.top) / rect.height),
    };
  }

  function end() {
    if (!active.current) return;
    active.current = false;
    setCurrent((a) => {
      if (a && a.points.length > 1) onCommit(a);
      return null;
    });
  }

  const all = current ? [...strokes, current] : strokes;

  return (
    <svg
      ref={ref}
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
      className={`absolute inset-0 h-full w-full ${drawing ? "" : "pointer-events-none"}`}
      style={{ touchAction: "none" }}
      onPointerDown={
        drawing
          ? (e) => {
              try {
                e.currentTarget.setPointerCapture(e.pointerId);
              } catch {
                /* 무시 */
              }
              const p = toXY(e);
              if (!p) return;
              active.current = true;
              setCurrent({ color, width, points: [p] });
            }
          : undefined
      }
      onPointerMove={
        drawing
          ? (e) => {
              if (!active.current) return;
              const p = toXY(e);
              if (!p) return;
              setCurrent((a) => (a ? { ...a, points: [...a.points, p] } : a));
            }
          : undefined
      }
      onPointerUp={drawing ? end : undefined}
      onPointerLeave={drawing ? end : undefined}
    >
      {all.map((s, i) => (
        <polyline
          key={i}
          points={s.points.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke={s.color}
          strokeWidth={s.width}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
