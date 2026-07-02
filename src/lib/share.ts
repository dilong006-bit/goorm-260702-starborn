import { toPng } from "html-to-image";

/** NASA 이미지 URL을 same-origin 프록시 경로로. NASA 도메인이 아니면 원본 그대로. */
export function proxied(url: string | null): string | null {
  if (!url) return url;
  if (/^https:\/\/([a-z0-9-]+\.)*nasa\.gov\//i.test(url)) {
    return `/api/image?src=${encodeURIComponent(url)}`;
  }
  return url;
}

/** DOM 노드를 2x PNG Blob으로 캡처. */
export async function cardToPng(node: HTMLElement): Promise<Blob> {
  const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true });
  return (await fetch(dataUrl)).blob();
}

/** PNG로 캡처해 파일 저장(다운로드). */
export async function downloadCard(node: HTMLElement, filename = "starborn.png") {
  const blob = await cardToPng(node);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * 네이티브 공유. 이미지 파일 공유 → 링크 공유 → 클립보드 복사 순으로 폴백.
 * @returns 최종 폴백(클립보드)까지 갔으면 "copied", 그 외 "shared"
 */
export async function shareCard(
  node: HTMLElement,
  url: string,
  title: string
): Promise<"shared" | "copied"> {
  try {
    const blob = await cardToPng(node);
    const file = new File([blob], "starborn.png", { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title });
      return "shared";
    }
  } catch {
    /* 이미지 공유 미지원/실패 → 아래로 폴백 */
  }
  try {
    if (navigator.share) {
      await navigator.share({ title, url });
      return "shared";
    }
  } catch {
    /* 사용자가 취소했거나 미지원 → 클립보드로 */
  }
  await navigator.clipboard.writeText(url);
  return "copied";
}

/** 재진입 딥링크: /?date=…&tone=…&occasion=… */
export function deepLink(u: {
  inputDate: string;
  tone: string;
  occasion: string;
}): string {
  const p = new URLSearchParams({
    date: u.inputDate,
    tone: u.tone,
    occasion: u.occasion,
  }).toString();
  return `${location.origin}/?${p}`;
}
