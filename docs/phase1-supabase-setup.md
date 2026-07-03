# Phase 1 — Supabase 설정 체크리스트 (로그인·동기화)

> 감정 저널 Phase 1의 **로그인(F1.1)·동기화(F1.2)**를 라이브에서 켜려면 아래 대시보드
> 수동 단계가 필요합니다. **이 설정 전에도 앱은 익명(localStorage)으로 정상 동작**하며,
> 저장·컬렉션·mood/dayType 기록·공유가 모두 작동합니다. 설정을 마치면 이메일 매직링크
> 로그인과 클라우드 동기화가 활성화됩니다.

## 1) 스키마 실행 (테이블 + RLS)

- [ ] Supabase 대시보드 → **SQL Editor**
- [ ] [`supabase/schema.sql`](../supabase/schema.sql) 전체를 붙여넣고 **Run**
  - 이번에 추가된 `universes` · `retrospectives` · `generation_log` 테이블과 RLS 정책이 생성됩니다.
  - 기존 `apod_cache` / `story_cache` / `share_events`는 `if not exists`라 재실행해도 안전합니다.
- [ ] 확인: **Table Editor**에 `universes`가 보이고, RLS가 **Enabled** 상태인지 체크.

## 2) 이메일 매직링크 인증 켜기

- [ ] 대시보드 → **Authentication → Providers → Email**
  - **Enable Email** 켜기, **Confirm email** = ON(기본), 비밀번호는 사용 안 함(매직링크만).
- [ ] 대시보드 → **Authentication → URL Configuration**
  - **Site URL**: `https://starborn-one.vercel.app`
  - **Redirect URLs**에 아래 추가(로컬 개발 포함):
    - `https://starborn-one.vercel.app`
    - `http://localhost:5173` (필요 시 5174~5176도)
  - ⚠️ 코드가 `emailRedirectTo = window.location.origin`으로 보내므로, 접속 도메인이
    Redirect URLs에 반드시 포함돼야 링크 클릭 시 로그인이 완료됩니다.
- [ ] (선택) **Email Templates**의 "Magic Link" 문구를 한국어로 커스터마이즈.
  - 기본 SMTP는 무료·저율 제한이 있어, 실사용 트래픽엔 **Custom SMTP** 연결 권장.

## 3) 환경변수 확인 (클라이언트 노출 OK — anon 키)

Vercel 프로젝트 → Settings → Environment Variables 에 아래가 있어야 로그인 UI가 활성화됩니다.

| 변수 | 값 | 노출 |
|---|---|---|
| `VITE_SUPABASE_URL` | Project URL | 클라이언트 OK |
| `VITE_SUPABASE_ANON_KEY` | anon public 키 | 클라이언트 OK (RLS가 보호) |

> `SUPABASE_SERVICE_ROLE_KEY`·`ANTHROPIC_API_KEY`·`NASA_API_KEY`는 **서버리스 전용**이며
> 로그인/동기화에는 필요하지 않습니다. `VITE_` 접두사를 절대 붙이지 마세요.
>
> `VITE_SUPABASE_*`가 **없으면** 앱은 로그인 대신 "동기화는 곧 제공돼요" 안내를 띄우고
> 익명 모드로 계속 동작합니다(무해).

## 4) 검증 (설정 후)

- [ ] 라이브에서 우상단 **🛰️ 동기화** → 이메일 입력 → "로그인 링크 받기"
- [ ] 메일의 링크 클릭 → 앱으로 복귀하며 **⭐ 동기화 중** 표시
- [ ] 로그인 직후, 익명 때 저장한 항목이 `universes`로 **마이그레이션**되는지(Table Editor 확인)
- [ ] 다른 기기/시크릿창에서 로그인 → 같은 컬렉션이 보이는지(동기화 확인)
- [ ] RLS: 다른 계정으로는 내 `universes`가 조회되지 않는지

---

## (선택) F3.1 목소리 선택 — story_cache voice 마이그레이션

목소리(문체) 축은 **마이그레이션 없이도 동작**합니다(단, voice별 스토리 캐시가 적용되지
않아 매번 재생성). 캐시를 켜려면 SQL Editor에서 [`supabase/schema.sql`](../supabase/schema.sql)의
**"v2 F3.1(목소리 선택)"** 블록(맨 아래)을 실행하세요 — `story_cache`에 `voice` 컬럼과
`(apod_date, tone, voice)` unique를 추가하는 additive 마이그레이션입니다(재실행 안전).

### (더 선택) OpenAI 백엔드 voice
기본은 3가지 목소리 모두 **Claude**로 생성됩니다. OpenAI 백엔드를 특정 voice에 붙이려면:
- Vercel env(+ `.env.local`)에 `OPENAI_API_KEY`(서버 전용, `VITE_` 금지) 추가
- `api/_lib/claude.js`의 `VOICE_PROVIDER`에서 원하는 voice를 `"openai"`로 변경
- 키가 없거나 호출 실패 시 자동으로 Claude로 폴백하므로 안전합니다.

---

설정을 마치면 알려주세요 — 라이브 로그인·동기화·마이그레이션·목소리를 함께 검증하겠습니다.
