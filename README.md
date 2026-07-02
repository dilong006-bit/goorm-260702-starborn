# 🪐 Starborn — 내 생일의 우주

날짜를 입력하면 그날의 NASA APOD(우주 사진)를 불러오고, Claude가 한국어 우주
이야기를 생성해 공유 카드로 만들어 주는 웹앱.

> **"카드 생성기 → 우주 저널"로 피벗 (Phase 1).** 한 번 만든 우주를 **⭐ 내 우주에
> 저장**해 나만의 컬렉션으로 쌓고, 다시 감상·공유합니다. 활성화 이벤트 =
> *"첫 우주를 컬렉션에 저장"*.

### 🌐 라이브: **https://starborn-one.vercel.app**

- **Frontend**: React 18 + Vite 5 + TypeScript + Tailwind (우주 다크 테마)
- **Backend**: Vercel Serverless Functions (`/api/*`) — 시크릿 격리
- **DB/캐시**: Supabase (Postgres + RLS)
- **LLM**: Claude API (`claude-sonnet-4-6`)
- **Open API**: NASA APOD

## ✨ 주요 기능

| 화면 | 기능 | 상태 |
|---|---|---|
| **오늘의 우주** | 진입 시 오늘 APOD + Claude 한국어 스토리 자동 표시 | ✅ |
| **내 생일의 우주** | 생일(또는 특별한 날) + 이름 입력 → 그날의 우주 카드 | ✅ |
| **톤 선택** | 감성 에세이 / 우주 운세 / 짧은 시 — 매번 다른 이야기 | ✅ |
| **⭐ 내 우주에 저장** | 결과 카드를 로컬 컬렉션에 저장(활성화 이벤트) · optimistic · 저장 애니메이션 | ✅ |
| **공유 · 이미지 · 링크** | 카드를 PNG로 내보내기(`html-to-image`) · Web Share · 딥링크 복사 | ✅ |
| **내 우주 컬렉션** | 저장한 우주 bento 그리드 · occasion 필터 · 🔥연속 저장일 · 상세/삭제 | ✅ |
| 비주얼 고도화(starfield·breathe·Pretendard) | (S4 예정) | ⏳ |
| TabBar · 첫 화면 분기 | (S5 예정) | ⏳ |

**동작 방식**: 날짜 입력 → `/api/apod`가 NASA에서 그날 우주 사진을 가져오고
(날짜 클램프·video/미발행 폴백·Supabase 캐싱) → `/api/story`가 사진의 제목·설명을
Claude에 넘겨 한국어 이야기를 생성(`(날짜+톤)` 캐싱, 이름은 템플릿 치환) →
**⭐ 저장** 시 `localStorage` 컬렉션에 upsert되고, 상세 화면은 저장된 데이터로 그대로
복원(재생성 0). 외부 호출(NASA·Claude)은 **100% 서버리스 함수 안에서만** 일어나
키가 노출되지 않습니다.

> 사진/이야기는 **하루 단위로 갱신**되며, 같은 날·같은 톤은 전역 캐시로 고정됩니다.

### 우주 저널 (Phase 1)

- **저장 · 컬렉션**: `localStorage`(`starborn:collection:v1`)에 무인증·무마찰로 저장.
  `id = ${inputDate}:${occasion}` 조합 키로 중복 방지(upsert), 최신순 정렬,
  🔥 연속 저장일(streak) 계산.
- **공유 export**: `html-to-image`로 카드를 2x PNG로 캡처(워터마크 포함). NASA 이미지는
  `/api/image` **same-origin 프록시**를 경유해 canvas taint 없이 내보냅니다
  (NASA 도메인 화이트리스트 · 키 불필요).
- **감각 레이어(opt-in)**: 저장 시 진동 피드백은 progressive enhancement
  (`navigator.vibrate` 지원 기기만, iOS는 무해 no-op). 설정은 `starborn:calm:v1`.
- **접근성**: 저장 버튼 `aria-pressed`, 이미지 대체텍스트, reduced-motion 존중.

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
  - `Project URL` → `SUPABASE_URL`(서버용) + `VITE_SUPABASE_URL`(클라이언트용, 같은 값)
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
| `SUPABASE_URL` | 서버 전용 |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용 |
| `VITE_SUPABASE_URL` | 클라이언트 노출 OK |
| `VITE_SUPABASE_ANON_KEY` | 클라이언트 노출 OK |

> ⚠️ 서버 전용 키에는 **절대 `VITE_` 접두사를 붙이지 마세요.** 붙이면 번들에
> 포함되어 클라이언트로 유출됩니다.

---

## 폴더 구조

```
starborn/
├─ api/                  # Vercel serverless (시크릿 격리)
│  ├─ apod.js            # NASA APOD 조회·정규화·폴백·캐싱
│  ├─ story.js           # Claude 스토리 생성·캐싱·이름 치환
│  ├─ image.js           # NASA 이미지 same-origin 프록시(캡처 taint 방지)
│  └─ _lib/              # nasa / claude / apodNormalize / storyTemplate / supabaseAdmin
├─ supabase/schema.sql   # DB 스키마(DDL)
├─ src/
│  ├─ components/        # CosmicCard(캡처 ref) · ShareActionBar · Toast
│  │                     # CollectionCard · CollectionEmpty · StreakBadge · OccasionTag
│  │                     # ToneToggle · DateField · Loader
│  ├─ pages/             # Home(오늘) · Birthday(입력) · Result(결과)
│  │                     # Collection(내 우주) · Detail(우주 상세)
│  ├─ lib/               # api.ts · types.ts · supabaseClient.ts
│  │                     # collection.ts(저장/스트릭) · share.ts(PNG/공유/딥링크)
│  │                     # calm.ts(감각 설정) · haptics.ts(진동)
│  ├─ App.tsx            # 뷰 상태기(home→input→result / collection→detail)
│  └─ main.tsx
├─ vite.config.ts        # vercel-api-dev 플러그인(로컬 /api 실행)
├─ vercel.json
├─ .env.local.example    # 환경변수 템플릿(빈 값) — 이것만 커밋됨
└─ .env.local            # 실제 키 — git 제외(커밋 금지)
```

> 본 서비스는 NASA와 무관한 학습용 독립 프로젝트입니다.
