-- Schéma Ascenseur (référence ASC-44 / ASC-45) — à appliquer dans Supabase SQL Editor ou via CLI.
-- Extensions
create extension if not exists pgcrypto;

-- updated_at générique
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- players
-- ---------------------------------------------------------------------------
create table public.players (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint players_display_name_nonempty check (char_length(trim(display_name)) > 0)
);

create index idx_players_display_name_lower on public.players (lower(display_name));

create trigger trg_players_updated_at
before update on public.players
for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- games
-- ---------------------------------------------------------------------------
create table public.games (
  id uuid primary key default gen_random_uuid(),
  status text not null,
  settings jsonb,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint games_status_check check (status in ('draft', 'running', 'finished', 'aborted'))
);

create index idx_games_status on public.games (status);
create index idx_games_created_at on public.games (created_at desc);

create trigger trg_games_updated_at
before update on public.games
for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- game_players
-- ---------------------------------------------------------------------------
create table public.game_players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete restrict,
  seat_order integer not null,
  created_at timestamptz not null default now(),
  constraint game_players_seat_nonneg check (seat_order >= 0),
  constraint game_players_unique_player unique (game_id, player_id),
  constraint game_players_unique_seat unique (game_id, seat_order)
);

create index idx_game_players_game on public.game_players (game_id);
create index idx_game_players_player on public.game_players (player_id);

-- ---------------------------------------------------------------------------
-- rounds
-- ---------------------------------------------------------------------------
create table public.rounds (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  round_index integer not null,
  status text not null,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rounds_index_nonneg check (round_index >= 0),
  constraint rounds_status_check check (status in ('pending', 'active', 'completed')),
  constraint rounds_unique_index unique (game_id, round_index)
);

create index idx_rounds_game on public.rounds (game_id);

create trigger trg_rounds_updated_at
before update on public.rounds
for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- round_results (score cohérent avec la règle métier bid / tricks_won)
-- ---------------------------------------------------------------------------
create table public.round_results (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.rounds (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete restrict,
  bid integer not null,
  tricks_won integer not null,
  score integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint round_results_bid_nonneg check (bid >= 0),
  constraint round_results_tricks_nonneg check (tricks_won >= 0),
  constraint round_results_score_rule check (
    score = case
      when bid = tricks_won then bid
      else -abs(bid - tricks_won)
    end
  ),
  constraint round_results_unique_player unique (round_id, player_id)
);

create index idx_round_results_round on public.round_results (round_id);
create index idx_round_results_player on public.round_results (player_id);

create trigger trg_round_results_updated_at
before update on public.round_results
for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- game_config_templates
-- ---------------------------------------------------------------------------
create table public.game_config_templates (
  id uuid primary key default gen_random_uuid(),
  name text,
  notes text,
  settings jsonb,
  player_count integer not null,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint game_config_templates_player_count check (player_count >= 3 and player_count <= 10)
);

create index idx_game_config_templates_last_used on public.game_config_templates (last_used_at desc nulls last);

create trigger trg_game_config_templates_updated_at
before update on public.game_config_templates
for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- game_config_template_players
-- ---------------------------------------------------------------------------
create table public.game_config_template_players (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.game_config_templates (id) on delete cascade,
  seat_order integer not null,
  player_id uuid references public.players (id) on delete set null,
  display_name text,
  constraint gctp_seat_nonneg check (seat_order >= 0),
  constraint gctp_unique_seat unique (template_id, seat_order),
  constraint gctp_player_or_name check (
    player_id is not null
    or (display_name is not null and char_length(trim(display_name)) > 0)
  )
);

create index idx_gctp_template on public.game_config_template_players (template_id);

-- ---------------------------------------------------------------------------
-- RLS — politiques permissives par défaut (à resserrer avec Auth / besoins produit)
-- ---------------------------------------------------------------------------
alter table public.players enable row level security;
alter table public.games enable row level security;
alter table public.game_players enable row level security;
alter table public.rounds enable row level security;
alter table public.round_results enable row level security;
alter table public.game_config_templates enable row level security;
alter table public.game_config_template_players enable row level security;

create policy "allow_all_anon_players" on public.players for all using (true) with check (true);
create policy "allow_all_anon_games" on public.games for all using (true) with check (true);
create policy "allow_all_anon_game_players" on public.game_players for all using (true) with check (true);
create policy "allow_all_anon_rounds" on public.rounds for all using (true) with check (true);
create policy "allow_all_anon_round_results" on public.round_results for all using (true) with check (true);
create policy "allow_all_anon_game_config_templates" on public.game_config_templates for all using (true) with check (true);
create policy "allow_all_anon_game_config_template_players" on public.game_config_template_players for all using (true) with check (true);
