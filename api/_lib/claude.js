// Claude API 서버사이드 호출 (명세 7.2). 클라이언트에서 절대 호출 금지.

export const TONES = ["essay", "fortune", "poem"];
export const DEFAULT_MODEL = "claude-sonnet-4-6";

const TONE_GUIDE = {
  essay: "잔잔한 감성 에세이 톤. 1인칭 관찰자의 사색.",
  fortune: "다정한 우주 운세 톤. 희망적이되 가벼운 점괘 느낌.",
  poem: "다정하고 서정적인 짧은 글. 시처럼 행을 나누되 차갑지 않게, 독자에게 따뜻하게 건네는 위로의 어조로.",
};

const SYSTEM = `너는 우주 사진을 보고 한국어로 짧고 감성적인 글을 쓰는 작가다.
- 과장된 'AI slop' 금지, 진정성 있는 문체
- 톤(essay/fortune/poem)에 맞춰 120~200자
- NASA 설명의 사실(천체 이름 등)은 유지하되 시적으로 재해석
- 마크다운/머리말/따옴표 없이 본문만 출력`;

/**
 * @returns {Promise<string>} 생성된 한국어 스토리 본문
 * @throws code: ANTHROPIC_API_KEY_MISSING | CLAUDE_HTTP_<status> | CLAUDE_EMPTY
 */
export async function callClaude(title, explanation, tone) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const e = new Error("ANTHROPIC_API_KEY_MISSING");
    e.code = "ANTHROPIC_API_KEY_MISSING";
    throw e;
  }
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  const guide = TONE_GUIDE[tone] || TONE_GUIDE.essay;

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 400,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `톤:${tone} (${guide})\n제목:${title}\n설명:${explanation}`,
        },
      ],
    }),
  });

  if (!r.ok) {
    const e = new Error(`CLAUDE_HTTP_${r.status}`);
    e.code = `CLAUDE_HTTP_${r.status}`;
    throw e;
  }

  const data = await r.json();
  const story = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  if (!story) {
    const e = new Error("CLAUDE_EMPTY");
    e.code = "CLAUDE_EMPTY";
    throw e;
  }
  return { story, model };
}

// ── v2 회고(F2.3) ───────────────────────────────────────
const MOOD_LABEL = {
  radiant: "빛나는 날",
  calm: "잔잔한 날",
  drift: "무중력",
  cloudy: "흐린 날",
  storm: "무거운 날",
};

const RETRO_SYSTEM = `너는 사용자의 지난 기간 감정 기록을 다정하게 돌아봐주는 우주 저널 작가다.
- 감정 분포와 짧은 메모를 바탕으로 사용자의 흐름을 따뜻하게 요약한다.
- 판단·훈계·조언 강요 금지. 위로와 인정, 있는 그대로 바라봐 주는 어조.
- 한국어 3~5문장, 우주적 이미지를 은은하게 곁들이되 과장 금지.
- 마크다운/머리말/따옴표 없이 본문만 출력.`;

/**
 * 기간 회고 생성.
 * @returns {Promise<{text:string, model:string}>}
 * @throws code: ANTHROPIC_API_KEY_MISSING | CLAUDE_HTTP_<status> | CLAUDE_EMPTY
 */
export async function callRetrospective({ period, moodSummary, notes }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const e = new Error("ANTHROPIC_API_KEY_MISSING");
    e.code = "ANTHROPIC_API_KEY_MISSING";
    throw e;
  }
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  const periodLabel = period === "month" ? "이번 달" : "이번 주";
  const moodLine =
    Object.entries(moodSummary || {})
      .filter(([, c]) => c > 0)
      .map(([k, c]) => `${MOOD_LABEL[k] || k} ${c}회`)
      .join(", ") || "감정 기록 없음";
  const notesText =
    (notes || [])
      .slice(0, 20)
      .map((n) => `- ${String(n).slice(0, 140)}`)
      .join("\n") || "(메모 없음)";

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 500,
      system: RETRO_SYSTEM,
      messages: [
        {
          role: "user",
          content: `기간:${periodLabel}\n감정 분포:${moodLine}\n메모/제목:\n${notesText}`,
        },
      ],
    }),
  });

  if (!r.ok) {
    const e = new Error(`CLAUDE_HTTP_${r.status}`);
    e.code = `CLAUDE_HTTP_${r.status}`;
    throw e;
  }
  const data = await r.json();
  const text = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
  if (!text) {
    const e = new Error("CLAUDE_EMPTY");
    e.code = "CLAUDE_EMPTY";
    throw e;
  }
  return { text, model };
}
