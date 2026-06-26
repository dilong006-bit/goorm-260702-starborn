# 📓 Starborn 작업 일지

## 2026-06-26 — Turn 3 시작 (작업 1~2 완료)

명세서 13장 빌드 순서에 따라 진행. 이번 세션 목표는 작업 1~5(F1 "오늘의 우주"
end-to-end MVP). 오늘은 **작업 1·2**를 완료하고 GitHub에 초기 푸시.

### ✅ 작업 1 — 스캐폴딩 + 폴더 구조 + .gitignore
- Vite 5 + React 18 + TypeScript + Tailwind(v3, 우주 다크 테마) 수동 스캐폴딩
- 폴더 구조: `api/`, `src/{components,pages,lib}` (자리표시 `.gitkeep`)
- `.gitignore`: `.env`, `.env*.local`, `.vercel`, `node_modules`, `dist`
- `.env.local.example`: 서버 시크릿 vs `VITE_` 분리 템플릿
- 스크립트: `dev` = `vercel dev` (로컬 기본 실행), 보조 `vite`
- **검증**: `npm install` ✓ · `npm run build` ✓ · `npm run typecheck` ✓

### ✅ 작업 2 — Supabase + DDL + env 세팅
- `supabase/schema.sql`: 명세 6장 DDL (apod_cache / story_cache / share_events + RLS)
- `vercel.json`: Vite 프레임워크 최소 설정
- `src/lib/supabaseClient.ts`: 클라이언트 전용 anon 키만 사용 (service_role 미포함)
- `README.md`: 최초 1회 셋업 체크리스트 (Supabase 생성·키 발급·env 등록)
- **검증**: `@supabase/supabase-js` 설치 ✓ · build ✓ · typecheck ✓

### 🔒 가드레일 준수 현황
- 시크릿(NASA/Anthropic/service_role)에 `VITE_` 미부착, 클라이언트 노출 없음
- `.env`·`.vercel` 커밋 제외 (`.gitignore`)
- NASA DEMO_KEY 미사용 방침 명문화

### ✅ 작업 3 — GET /api/apod
- `api/apod.js` + `api/_lib/{nasa,apodNormalize,supabaseAdmin}.js`
- 날짜 클램프(1995-06-16~today) · 캐시 hit 시 외부 호출 0 · upsert 멱등
- 폴백: 오늘 404/500→전날, video→인접 image, copyright 정규화, 비-JSON 가드
- DEMO_KEY/키 누락 즉시 차단 · service_role 서버 전용
- **검증**: 순수 함수 단위 테스트 16/16 통과 · 핸들러 ESM 로드 OK

### ✅ 작업 4 — POST /api/story
- `api/story.js` + `api/_lib/{claude,storyTemplate}.js` + supabaseAdmin 스토리 캐시
- 캐시 키 = (date+tone), 이름은 템플릿 치환(비용 0)으로 분리
- 톤 검증(essay/fortune/poem) · Claude 실패 시 APOD 원문 요약 폴백
- Claude max_tokens 400 · 모델 env(ANTHROPIC_MODEL) 우선
- **검증**: 순수 함수 단위 테스트 11/11 통과 · 핸들러 ESM 로드 OK

## 2026-06-27 — 로컬 라이브 검증 + 개발환경 전환

### 🔧 로컬 개발: vercel dev → Vite 미들웨어
- 이 환경의 `vercel dev`가 "Retrieving project"에서 멈춰 함수 서버(3000)를
  못 띄움 → 포트 3000 타임아웃. 원인 추적 대신 확실한 방식으로 전환.
- `vite.config.ts`에 `vercel-api-dev` 플러그인 추가: `/api/*` 요청 시
  `api/*.js` 핸들러를 in-process로 실행. `.env.local`은 서버 측 process.env로만 주입.
- `npm run dev`(Vite, :5173) 하나로 프론트 + /api 동작. 프로덕션은 Vercel이
  `api/*.js`를 그대로 서버리스 실행(코드 무변경).

### ✅ 작업 3·4 라이브 검증 완료 (실제 키)
- `GET /api/apod?date=2000-03-15` → NASA 실데이터 정상 JSON
- APOD/스토리 Supabase 캐시 정상(오류 0), 같은 date+tone 2회차 `cached:true`
  → Claude 재호출 0
- `POST /api/story` → 한국어 운세 스토리 생성, 이름 치환(`Leo님에게,`) 정상
- 시크릿은 서버 측에서만 사용, 클라이언트 번들 미포함

### ⏭️ 다음 (작업 5)
- S1 "오늘의 우주" 화면 — /api/apod + /api/story 묶어 end-to-end MVP

### 📌 사용자 수동 단계 (README 체크리스트)
- [ ] Supabase 프로젝트 생성 → `supabase/schema.sql` 실행
- [ ] NASA(정식 키)·Anthropic 키 발급
- [ ] `.env.local.example` → `.env.local` 복사 후 값 입력
- [ ] Vercel 대시보드에 env 6개 등록
