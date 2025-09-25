# 数据库结构（基于当前 JSON 快照）

本文档根据你提供的 KV/JSON 数据快照，梳理出核心实体与字段结构，便于后续数据库（Postgres/Supabase）建模与迁移。

## 实体与键空间

- characters:list（角色主数据清单）
  - 类型：数组，元素为角色对象
  - 典型字段：
    - id: string（如 "chef"）
    - name: string（中文名）
    - team: string（"townsfolk" | "outsider" | "minion" | "demon"）
    - ability: string（能力描述）
    - edition: string（剧本版本，如 tb）
    - name_en: string（英文名）
    - firstNight: number（首夜顺序）
    - otherNight: number（其他夜顺序）

- script:<uuid>（剧本元数据）
  - 典型字段：
    - id: uuid
    - title: string
    - version: string
    - description: string
    - author: string
    - authorId: uuid
    - tags: string[]
    - likes: number
    - likedBy: uuid[]
    - rating: number
    - ratingCount: number
    - downloads: number
    - jsonPath: string（剧本文档存储路径）
    - imagePaths: string[]（图片路径集合）
    - uploadDate: string (ISO datetime)

- scripts:list（剧本列表）
  - 类型：数组，值为剧本 id（uuid）

- user:<uuid>（用户信息）
  - 典型字段：
    - id: uuid
    - name: string
    - email: string
    - joinDate: string (ISO datetime)
    - totalLikes: number
    - likedScripts: uuid[]
    - scriptsCount: number
    - totalDownloads: number

## 推荐关系型建模（Postgres / Supabase）

基于上述键值结构，建议建立以下表。注意：以下 SQL 为建议草案，可按需要调整字段类型、索引与约束。

```sql
-- 用户（业务信息，鉴权用户使用 supabase.auth.users）
create table if not exists public.profiles (
  id uuid primary key,
  name text not null,
  email text not null,
  join_date timestamptz not null default now(),
  total_likes int not null default 0,
  scripts_count int not null default 0,
  total_downloads int not null default 0
);
create unique index if not exists idx_profiles_email on public.profiles(email);

-- 角色（角色字典）
create table if not exists public.characters (
  id text primary key,
  name text not null,
  name_en text,
  team text not null check (team in ('townsfolk','outsider','minion','demon')),
  ability text not null,
  edition text,
  first_night int not null default 0,
  other_night int not null default 0
);

-- 剧本（元数据）
create table if not exists public.scripts (
  id uuid primary key,
  title text not null,
  version text not null,
  description text default '',
  author text not null,
  author_id uuid not null references public.profiles(id) on delete set null,
  tags text[] not null default '{}',
  likes int not null default 0,
  rating numeric(3,1) not null default 0,
  rating_count int not null default 0,
  downloads int not null default 0,
  json_path text not null,
  image_paths text[] not null default '{}',
  upload_date timestamptz not null default now()
);

-- 剧本点赞（详细到用户，便于去重与统计）
create table if not exists public.script_likes (
  script_id uuid not null references public.scripts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  liked_at timestamptz not null default now(),
  primary key (script_id, user_id)
);

-- 用户喜欢的剧本（冗余视图，可由 script_likes 聚合得到）
create view if not exists public.user_liked_scripts as
select user_id, array_agg(script_id order by liked_at desc) as liked_scripts
from public.script_likes
group by user_id;

-- 剧本与角色的关系（如需要）
create table if not exists public.script_characters (
  script_id uuid not null references public.scripts(id) on delete cascade,
  character_id text not null references public.characters(id) on delete restrict,
  primary key (script_id, character_id)
);

-- 常用索引
create index if not exists idx_scripts_title on public.scripts using gin (to_tsvector('simple', title));
create index if not exists idx_scripts_tags on public.scripts using gin (tags);
create index if not exists idx_scripts_upload_date on public.scripts (upload_date desc);
```

## RLS 建议（Supabase）

```sql
-- 仅示例：按需开启与调整
alter table public.scripts enable row level security;
alter table public.profiles enable row level security;

-- 任何人可读已发布剧本（如未来增加 published 字段）
-- create policy "read_published_scripts" on public.scripts
-- for select using (true);

-- 用户可读自己的 profile，更新自己的 profile
create policy "read_own_profile" on public.profiles
for select using (auth.uid() = id);

create policy "update_own_profile" on public.profiles
for update using (auth.uid() = id);
```

## 数据映射说明
- characters:list → public.characters（整表导入）
- scripts:list → public.scripts（id 列表可用于初始化顺序/推荐位）
- script:<uuid> → public.scripts（字段对齐于上文）
- user:<uuid> → public.profiles（字段对齐于上文）
- likedBy → public.script_likes（由数组展开为明细行）

## 后续工作
- 如需对象存储（图片、剧本 JSON），建议使用 Supabase Storage，`json_path`/`image_paths` 可对应存储桶路径。
- 若要搜索效果更好，可将 title/description 做全文索引或引入外部搜索引擎。
- 需要我补充迁移脚本（向现有 Supabase 直接创建表/索引/策略）和数据导入脚本吗？
