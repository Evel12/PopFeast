-- Simplified schema: movies, series, favorites, comments.
-- Drop existing objects (order matters) - RUN ONLY IF YOU WANT A CLEAN RESET.
-- NOTE: Supabase requires enabling pgcrypto for gen_random_uuid().
create extension if not exists pgcrypto;

-- Drop legacy tables if they exist
drop table if exists public.media_tags cascade;
drop table if exists public.reviews cascade;
drop table if exists public.tags cascade;

drop table if exists public.favorites cascade;
drop table if exists public.comments cascade;
drop table if exists public.movies cascade;
drop table if exists public.series cascade;
drop function if exists public.set_timestamp cascade;

-- Movies table with genres array
create table public.movies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  year int check (year >= 1888),
  genres text[] default array[]::text[],
  description text,
  rating numeric(3,1) check (rating >= 0 and rating <= 10),
  poster_url text,
  duration_minutes int check (duration_minutes is null or duration_minutes > 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Series table with genres array
create table public.series (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  seasons int default 1 check (seasons >= 1),
  episodes int default 0 check (episodes >= 0),
  genres text[] default array[]::text[],
  description text,
  rating numeric(3,1) check (rating >= 0 and rating <= 10),
  poster_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Comments table (polymorphic)
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null,
  item_type text not null check (item_type in ('movie','series')),
  user_id uuid,
  username text,
  rating numeric(3,1) not null check (rating >= 0 and rating <= 10),
  content text not null,
  created_at timestamptz default now()
);

-- Favorites table (polymorphic, no user scoping yet)
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null,
  item_type text not null check (item_type in ('movie','series')),
  created_at timestamptz default now(),
  unique (item_id, item_type)
);

-- Indexes
create index movies_created_idx on public.movies(created_at);
create index series_created_idx on public.series(created_at);
create index comments_item_idx on public.comments(item_type, item_id);
create index favorites_item_idx on public.favorites(item_type, item_id);

-- Timestamp trigger helper
create function public.set_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;$$;

create trigger trg_movies_timestamp before update on public.movies
for each row execute procedure public.set_timestamp();
create trigger trg_series_timestamp before update on public.series
for each row execute procedure public.set_timestamp();

-- Sample seed data (minimal)
insert into public.movies (title, year, genres, description, rating, poster_url, duration_minutes)
values ('Inception',2010,array['Sci-Fi','Action'],'Dream heist',8.8,'https://picsum.photos/seed/inception/400/600',148);
insert into public.series (title, seasons, episodes, genres, description, rating, poster_url)
values ('Breaking Bad',5,62,array['Crime','Drama'],'Meth empire evolution',9.4,'https://picsum.photos/seed/breakingbad/400/600');

-- Example comment seeds
insert into public.comments (item_id,item_type,rating,content,username)
select id,'movie',9.2,'Great visuals','Guest' from public.movies limit 1;
insert into public.comments (item_id,item_type,rating,content,username)
select id,'series',9.5,'Character depth','Guest' from public.series limit 1;

-- Initial favorites seed (optional)
insert into public.favorites (item_id,item_type)
select id,'movie' from public.movies limit 1;

-- Ratings are authoritative fields and must NOT be auto-derived from comments.
-- If you previously normalized ratings from comments, stop doing so to keep ratings fixed.

-- DONE: Only required tables now exist.
