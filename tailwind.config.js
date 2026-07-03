/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // 우주 다크 테마 팔레트 (SSOT)
        cosmos: {
          950: "#05060f", // 가장 깊은 배경 (void)
          900: "#0a0e24",
          800: "#121634",
          700: "#1c2350",
          accent: "#7c6cff", // 성운 보라 (primary accent)
          glow: "#a8b5ff", // 별빛 하이라이트
          star: "#ffd479", // 별 골드 (절제해서 포인트로만)
          nebula1: "#7c6cff", // 성운 오브 A (보라)
          nebula2: "#4f7cff", // 성운 오브 B (블루)
        },
        // occasion 태그 색 (SSOT)
        occasion: {
          birthday: "#ffd479",
          anniversary: "#ff9ecb",
          today: "#a8b5ff",
          custom: "#a8b5ff",
        },
        // 감정 축(mood) — 4색은 기존 팔레트 재사용, storm만 신규
        mood: {
          radiant: "#ffd479", // = cosmos-star
          calm: "#a8b5ff", // = cosmos-glow
          drift: "#7c6cff", // = cosmos-accent
          cloudy: "#4f7cff", // = cosmos-nebula2
          storm: "#5b4b9f", // 신규: 깊은 보라('무거운 날')
        },
      },
      fontFamily: {
        sans: [
          "Pretendard",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      backgroundImage: {
        "cosmos-radial":
          "radial-gradient(circle at 30% 20%, #1c2350 0%, #0a0e24 45%, #05060f 100%)",
        // 성운 오브 — glass가 굴절할 빛샘 (§5.1)
        "nebula-orb":
          "radial-gradient(circle, rgba(124,108,255,.35) 0%, transparent 70%)",
        "nebula-orb-blue":
          "radial-gradient(circle, rgba(79,124,255,.30) 0%, transparent 70%)",
      },
      transitionDuration: {
        micro: "140ms",
        std: "240ms",
        expr: "380ms",
      },
      borderRadius: {
        card: "24px",
        control: "14px",
      },
      boxShadow: {
        // 단일 직하 그림자 금지 → 다층 깊이
        e1: "0 1px 2px rgba(0,0,0,.40), 0 8px 24px rgba(0,0,0,.35)",
        e2: "0 2px 4px rgba(0,0,0,.40), 0 18px 48px rgba(0,0,0,.50)",
        e3: "0 8px 16px rgba(0,0,0,.50), 0 36px 72px rgba(0,0,0,.60)",
        glow: "0 0 0 1px rgba(124,108,255,.18), 0 0 40px rgba(124,108,255,.18)",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(.2,0,0,1)",
        in: "cubic-bezier(.4,0,1,1)",
        emph: "cubic-bezier(.3,0,0,1)",
      },
      keyframes: {
        cardIn: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        riseIn: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        twinkle: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: ".4" },
        },
        // C2 숨쉬는 우주 배경 — 아주 느린 팽창/수축
        breathe: {
          "0%,100%": { transform: "scale(1)", opacity: ".9" },
          "50%": { transform: "scale(1.06)", opacity: "1" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        // C1 저장 만족감 · C4 젤리 프레스
        savePop: {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.12)" },
          "100%": { transform: "scale(1)" },
        },
        jelly: {
          "0%": { transform: "scale(1)" },
          "30%": { transform: "scale(.94)" },
          "60%": { transform: "scale(1.03)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "card-in": "cardIn .5s cubic-bezier(.2,0,0,1) both",
        "rise-in": "riseIn .42s cubic-bezier(.2,0,0,1) both",
        twinkle: "twinkle 1.6s ease-in-out infinite",
        breathe: "breathe 10s ease-in-out infinite", // 4s 흡기 / 6s 호기 근사
        shimmer: "shimmer 1.4s infinite",
        "save-pop": "savePop .32s cubic-bezier(.3,0,0,1) both",
        jelly: "jelly .28s cubic-bezier(.3,0,0,1) both",
      },
    },
  },
  plugins: [],
};
