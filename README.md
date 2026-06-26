# 🪐 Starborn — 내 생일의 우주

날짜를 입력하면 그날의 NASA APOD(우주 사진)를 불러오고, Claude가 한국어 우주
이야기를 생성해 공유 카드로 만들어 주는 웹앱.

- **Frontend**: React 18 + Vite 5 + TypeScript + Tailwind (우주 다크 테마)
- **Backend**: Vercel Serverless Functions (`/api/*`) — 시크릿 격리
- **DB/캐시**: Supabase (Postgres + RLS)
- **LLM**: Claude API (`claude-sonnet-4-6`)
- **Open API**: NASA APOD

---

## 로컬 개발

```bash
npm install
npm run dev      # http://localhost:5173 — 프론트 + /api 서버리스 함수 한 번에
```

> **로컬은 `npm run dev`(Vite) 하나면 됩니다.** `vite.config.ts`의 `vercel-api-dev`
> 플러그인이 `/api/*` 요청을 받으면 `api/*.js` 핸들러를 in-process로 실행합니다.
> `.env.local`의 값은 서버 측 `process.env`로만 주입되어 클라이언트 번들엔 포함되지
> 않습니다(시크릿 안전).
>
> 프로덕션(Vercel 클라우드)에서는 `api/*.js`가 그대로 서버리스 함수로 실행됩니다 —
> 코드 변경 없이 동일하게 동작합니다.
>
> 참고: 로컬에서 `vercel dev`는 이 환경에서 함수 서버를 띄우지 못해(“Retrieving
> project”에서 멈춤) 사용하지 않습니다. `npm start`(=`vercel dev`)는 남겨두었지만
> 권장 경로는 `npm run dev` 입니다.

---

## ⚙️ 최초 1회 셋업 체크리스트 (작업 2)

코드 밖에서 직접 해야 하는 수동 단계입니다.

### 1) Supabase 프로젝트 + 스키마

- [ ] [supabase.com](https://supabase.com)에서 새 프로젝트 생성
- [ ] **SQL Editor** 열기 → [`supabase/schema.sql`](supabase/schema.sql) 내용을 붙여넣고 **Run**
- [ ] Project Settings → API 에서 다음 값 확보:
  - `Project URL` → `VITE_SUPABASE_URL`
  - `anon public` 키 → `VITE_SUPABASE_ANON_KEY`
  - `service_role` 키 → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ **서버 전용, 절대 노출 금지**)

### 2) 외부 API 키 발급

- [ ] **NASA**: [api.nasa.gov](https://api.nasa.gov)에서 정식 키 발급 → `NASA_API_KEY`
      (⚠️ `DEMO_KEY` 금지)
- [ ] **Anthropic**: [platform.claude.com](https://platform.claude.com)에서 키 발급
      → `ANTHROPIC_API_KEY`

### 3) 로컬 `.env.local` 작성

- [ ] [`.env.local.example`](.env.local.example)을 복사해 `.env.local` 생성 후 값 채우기

```bash
cp .env.local.example .env.local   # 그 후 값 입력
```

> `.env.local`은 `.gitignore`에 포함되어 **커밋되지 않습니다.** 절대 커밋하지 마세요.

### 4) Vercel 대시보드 환경변수 등록 (배포 시)

| 변수 | 노출 범위 |
|---|---|
| `NASA_API_KEY` | 서버 전용 |
| `ANTHROPIC_API_KEY` | 서버 전용 |
| `ANTHROPIC_MODEL` | 서버 전용 (`claude-sonnet-4-6`) |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용 |
| `VITE_SUPABASE_URL` | 클라이언트 노출 OK |
| `VITE_SUPABASE_ANON_KEY` | 클라이언트 노출 OK |

> ⚠️ 서버 전용 키에는 **절대 `VITE_` 접두사를 붙이지 마세요.** 붙이면 번들에
> 포함되어 클라이언트로 유출됩니다.

---

## 폴더 구조

```
starborn/
├─ api/                  # Vercel serverless (시크릿 격리) — 작업 3~5에서 채움
├─ supabase/schema.sql   # DB 스키마(DDL)
├─ src/
│  ├─ components/        # CosmicCard, ToneToggle, DatePicker …
│  ├─ pages/             # Home, Result
│  ├─ lib/               # supabaseClient.ts, api.ts …
│  ├─ App.tsx
│  └─ main.tsx
├─ vercel.json
└─ .env.local            # git 제외
```

> 본 서비스는 NASA와 무관한 학습용 독립 프로젝트입니다.
