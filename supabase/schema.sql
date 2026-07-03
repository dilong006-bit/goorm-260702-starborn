-- ============================================================
-- Starborn — Supabase 스키마 (명세서 6장)
-- 사용법: Supabase 대시보드 → SQL Editor에 붙여넣고 Run
-- ============================================================

-- 6.1 APOD 원본 캐시 (날짜별 영구 불변)
create table if not exists apod_cache (
  date          date primary key,            -- 'YYYY-MM-DD'
  title         text not null,
  explanation   text not null,
  url           text not null,
  hdurl         text,
  media_type    text not null,               -- 'image' | 'video'
  thumbnail_url text,
  copyright     text,
  fetched_at    timestamptz not null default now()
);

-- 6.2 생성된 스토리 캐시 (날짜 + 톤 단위)
create table if not exists story_cache (
  id          uuid primary key default gen_random_uuid(),
  apod_date   date not null references apod_cache(date) on delete cascade,
  tone        text not null,                 -- 'essay' | 'fortune' | 'poem'
  story_text  text not null,
  model       text not null,
  created_at  timestamptz not null default now(),
  unique (apod_date, tone)                   -- ⚠️ 같은 날짜+톤은 1개만 (캐시 폭발 방지)
);

-- 6.3 공유 이벤트 집계 (북극성 지표: 공유율 측정용)
create table if not exists share_events (
  id          uuid primary key default gen_random_uuid(),
  apod_date   date,
  tone        text,
  channel     text,                          -- 'download' | 'webshare' | 'copylink'
  created_at  timestamptz not null default now()
);

-- ============================================================
-- 6.4 RLS: 기본 차단 + 클라이언트 직접 쓰기 금지 (방어적 다층화)
-- ============================================================
alter table apod_cache   enable row level security;
alter table story_cache  enable row level security;
alter table share_events enable row level security;

-- 캐시는 익명 클라이언트에게 읽기만 허용 (선택). 쓰기는 서버리스(service_role)만.
drop policy if exists "public read apod"  on apod_cache;
drop policy if exists "public read story" on story_cache;
create policy "public read apod"  on apod_cache  for select using (true);
create policy "public read story" on story_cache for select using (true);

-- 공유 이벤트는 익명 INSERT만 허용 (집계용), 조회는 차단
drop policy if exists "anon insert share" on share_events;
create policy "anon insert share" on share_events for insert with check (true);

-- ============================================================
-- v2 (감정 저널) — 유저 소유 데이터 · 로그인 필요 (기능명세서 v2 §3.2)
-- 아래 블록을 SQL Editor에 붙여넣고 Run 하면 Phase 1 로그인/동기화가 준비됩니다.
-- ============================================================

-- 3.2.1 유저 저널(내 우주) — 유저 소유, RLS 격리
create table if not exists universes (
  id           text not null,                  -- SavedUniverse.id (`${inputDate}:${occasion}`)
  user_id      uuid not null references auth.users(id) on delete cascade,
  apod_date    date not null,
  input_date   date not null,
  occasion     text not null,
  label        text,
  name         text,
  tone         text not null,
  title        text not null,
  image_url    text,
  story        text not null,
  mood         text,                            -- MoodKey
  feeling_note text,                            -- ≤140
  day_type     text,                            -- DayType
  reactions    jsonb not null default '[]'::jsonb,
  saved_at     timestamptz not null default now(),
  primary key (user_id, id)                     -- 유저별 id 유니크(upsert 키)
);
create index if not exists idx_universes_user_date on universes(user_id, input_date desc);

-- 3.2.2 회고(주간/월간)
create table if not exists retrospectives (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  period       text not null,                   -- 'week' | 'month'
  range_start  date not null,
  range_end    date not null,
  text         text not null,
  mood_summary jsonb not null,
  created_at   timestamptz not null default now()
);

-- 3.2.3 생성 로그(목소리/프로바이더 내부 A/B — 유저 비노출)
create table if not exists generation_log (
  id          uuid primary key default gen_random_uuid(),
  apod_date   date,
  tone        text,
  provider    text,                             -- 'anthropic' | 'openai'
  model       text,
  voice       text,                             -- 'warm' | 'dreamy' | 'plain'
  created_at  timestamptz not null default now()
);

-- 3.2.4 RLS — 유저 소유 격리
alter table universes      enable row level security;
alter table retrospectives enable row level security;
alter table generation_log enable row level security;

drop policy if exists "own universes" on universes;
create policy "own universes" on universes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own retrospectives" on retrospectives;
create policy "own retrospectives" on retrospectives
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- generation_log: 서버리스(service_role)만 INSERT, 유저 조회 차단(정책 없음 = 차단)

-- ============================================================
-- v2 F3.1(목소리 선택) — story_cache 캐시 키에 voice 추가
-- 캐시 키: (apod_date, tone) → (apod_date, tone, voice). 기본 voice='warm'.
-- 재실행 안전(additive). 미실행 시에도 앱은 동작(단, voice별 캐시 미적용 = 매번 재생성).
-- ============================================================
alter table story_cache add column if not exists voice text not null default 'warm';
alter table story_cache drop constraint if exists story_cache_apod_date_tone_key;
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'story_cache_apod_date_tone_voice_key'
  ) then
    alter table story_cache
      add constraint story_cache_apod_date_tone_voice_key unique (apod_date, tone, voice);
  end if;
end $$;

-- ============================================================
-- v2 F3.2(스티커) — universes에 스티커 장식 컬럼 추가(additive, 재실행 안전)
-- 미실행 시에도 스티커 없는 저장은 정상. 스티커를 붙인 저장의 클라우드 동기화만 이 컬럼 필요.
-- ============================================================
alter table universes add column if not exists stickers jsonb not null default '[]'::jsonb;
-- 자유 드로잉(F3.2 stretch)
alter table universes add column if not exists drawing jsonb not null default '[]'::jsonb;
