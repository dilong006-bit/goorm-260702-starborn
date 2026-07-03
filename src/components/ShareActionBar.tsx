import { useState } from "react";
import type { SavedUniverse } from "../lib/types";
import { saveUniverse, removeUniverse, isSaved } from "../lib/collection";
import { recordSave } from "../lib/metrics";
import { deepLink, downloadCard, shareCard } from "../lib/share";
import { tap } from "../lib/haptics";
import Toast from "./Toast";

interface Props {
  /** 조립된 저장 대상 */
  saved: SavedUniverse;
  /** 캡처할 카드 DOM 노드 */
  getNode: () => HTMLElement | null;
  /** ⭐저장 버튼 노출 여부(Result는 SaveSheet가 저장을 담당 → false). 기본 true. */
  showSave?: boolean;
}

export default function ShareActionBar({ saved, getNode, showSave = true }: Props) {
  const [savedOn, setSavedOn] = useState(() => isSaved(saved.id));
  const [pop, setPop] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const link = deepLink({
    inputDate: saved.inputDate,
    tone: saved.tone,
    occasion: saved.occasion,
  });

  function firePop() {
    setPop(true);
    setTimeout(() => setPop(false), 340);
  }

  async function onToggleSave() {
    if (savedOn) {
      // 저장 해제
      setSavedOn(false);
      await removeUniverse(saved.id);
      tap(6);
      setToast("컬렉션에서 뺐어요");
      return;
    }
    // optimistic 저장 (savedAt은 저장 시점으로 스탬프 → 스트릭 정확도)
    setSavedOn(true);
    firePop();
    tap([10, 30, 10]);
    await saveUniverse({ ...saved, savedAt: new Date().toISOString() });
    if (isSaved(saved.id)) {
      recordSave();
      setToast("저장됨 ⭐");
    } else {
      // 저장 실패(프라이빗 모드 등) → 롤백
      setSavedOn(false);
      setToast("저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
  }

  async function onImage() {
    const node = getNode();
    if (!node || busy) return;
    setBusy(true);
    try {
      await downloadCard(node, `starborn-${saved.inputDate}.png`);
      setToast("이미지를 저장했어요");
    } catch {
      setToast("이미지를 만들지 못했어요");
    } finally {
      setBusy(false);
    }
  }

  async function onShare() {
    const node = getNode();
    if (!node || busy) return;
    setBusy(true);
    try {
      const result = await shareCard(node, link, `${saved.title} · Starborn`);
      if (result === "copied") setToast("링크를 복사했어요");
    } catch {
      setToast("공유하지 못했어요");
    } finally {
      setBusy(false);
    }
  }

  async function onCopyLink() {
    try {
      await navigator.clipboard.writeText(link);
      tap(6);
      setToast("링크를 복사했어요");
    } catch {
      setToast("링크 복사에 실패했어요");
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      {showSave && (
        <button
          onClick={onToggleSave}
          aria-pressed={savedOn}
          className={`w-full rounded-control px-6 py-3.5 font-semibold shadow-e1 transition active:animate-jelly ${
            pop ? "animate-save-pop" : ""
          } ${
            savedOn
              ? "border border-cosmos-accent/40 bg-cosmos-accent/15 text-cosmos-glow"
              : "bg-cosmos-accent text-white hover:shadow-glow"
          }`}
        >
          {savedOn ? "저장됨 ⭐ 내 우주에 있어요" : "⭐ 내 우주에 저장"}
        </button>
      )}

      <div className="flex gap-3">
        <button
          onClick={onShare}
          disabled={busy}
          className="flex-1 rounded-control border border-white/15 px-4 py-2.5 text-sm text-slate-200 transition hover:bg-white/10 active:animate-jelly disabled:opacity-40"
        >
          🔗 공유
        </button>
        <button
          onClick={onImage}
          disabled={busy}
          className="flex-1 rounded-control border border-white/15 px-4 py-2.5 text-sm text-slate-200 transition hover:bg-white/10 active:animate-jelly disabled:opacity-40"
        >
          ⬇ 이미지
        </button>
        <button
          onClick={onCopyLink}
          className="flex-1 rounded-control border border-white/15 px-4 py-2.5 text-sm text-slate-200 transition hover:bg-white/10 active:animate-jelly"
        >
          🌐 링크
        </button>
      </div>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
