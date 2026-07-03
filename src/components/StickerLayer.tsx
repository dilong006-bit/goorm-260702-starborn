import { useRef } from "react";
import type { Sticker } from "../lib/types";

interface Props {
  stickers: Sticker[];
  editing: boolean;
  onMove?: (index: number, x: number, y: number) => void;
  onRemove?: (index: number) => void;
}

/**
 * 카드 위 스티커 레이어(F3.2).
 * - x,y는 컨테이너 대비 0..1 상대 좌표 → 캡처 크기와 무관하게 위치 보존.
 * - editing=false면 pointer-events 없음(정적, 공유 PNG에 그대로 캡처).
 */
export default function StickerLayer({
  stickers,
  editing,
  onMove,
  onRemove,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef<number | null>(null);

  function pointerToXY(e: React.PointerEvent) {
    const el = ref.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    };
  }

  return (
    <div
      ref={ref}
      className={`absolute inset-0 ${editing ? "" : "pointer-events-none"}`}
    >
      {stickers.map((s, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${s.x * 100}%`,
            top: `${s.y * 100}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <span
            onPointerDown={
              editing
                ? (e) => {
                    e.preventDefault();
                    try {
                      (e.target as HTMLElement).setPointerCapture(e.pointerId);
                    } catch {
                      /* 무시 */
                    }
                    dragging.current = i;
                  }
                : undefined
            }
            onPointerMove={
              editing
                ? (e) => {
                    if (dragging.current !== i) return;
                    const p = pointerToXY(e);
                    if (p) onMove?.(i, p.x, p.y);
                  }
                : undefined
            }
            onPointerUp={
              editing
                ? (e) => {
                    dragging.current = null;
                    try {
                      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
                    } catch {
                      /* 무시 */
                    }
                  }
                : undefined
            }
            className={`block select-none text-3xl leading-none drop-shadow-lg ${
              editing ? "cursor-grab active:cursor-grabbing" : ""
            }`}
            style={{ touchAction: "none" }}
          >
            {s.emoji}
          </span>
          {editing && onRemove && (
            <button
              onClick={() => onRemove(i)}
              aria-label="스티커 삭제"
              className="absolute -right-2.5 -top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-[10px] text-white ring-1 ring-white/30"
            >
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
