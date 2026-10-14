-- Atomic write paths for the mobile client: one round trip and one transaction per operation.
-- Written against the live schema mirrored in src/data/database.types.ts
-- (the initial migration file predates several schema changes made in the dashboard).

-- ---------------------------------------------------------------------------
-- start_game: resolves players, creates the running game and its seats.
-- p_seats: [{ "player_id": uuid | null, "display_name": text }] in seat order.
-- A seat without player_id reuses an existing player with the same name
-- (case and surrounding spaces ignored) before creating a new one.
-- Returns { game_id, players: [{ player_id, game_player_id, display_name }] } in seat order.
-- ---------------------------------------------------------------------------
create or replace function public.start_game(p_seats jsonb)
returns jsonb
language plpgsql
as $$
declare
  v_game_id uuid;
  v_seat record;
  v_name text;
  v_player_id uuid;
  v_game_player_id uuid;
  v_players jsonb := '[]'::jsonb;
begin
  if jsonb_typeof(p_seats) is distinct from 'array' or jsonb_array_length(p_seats) = 0 then
    raise exception 'start_game: p_seats must be a non-empty array';
  end if;

  insert into public.games (status, player_count, started_at)
  values ('in_progress', jsonb_array_length(p_seats), now())
  returning id into v_game_id;

  for v_seat in
    select s.value, s.ordinality from jsonb_array_elements(p_seats) with ordinality as s
  loop
    v_name := nullif(trim(v_seat.value ->> 'display_name'), '');
    v_player_id := nullif(v_seat.value ->> 'player_id', '')::uuid;

    if v_player_id is null then
      if v_name is null then
        raise exception 'start_game: seat % has neither player_id nor display_name', v_seat.ordinality;
      end if;
      select p.id into v_player_id
      from public.players p
      where lower(trim(p.display_name)) = lower(v_name)
      order by p.created_at
      limit 1;
      if v_player_id is null then
        insert into public.players (display_name) values (v_name) returning id into v_player_id;
      end if;
    end if;

    if v_name is null then
      select p.display_name into v_name from public.players p where p.id = v_player_id;
    end if;

    -- seat_order is 1-based in the database.
    insert into public.game_players (game_id, player_id, seat_order, display_name_snapshot)
    values (v_game_id, v_player_id, v_seat.ordinality, v_name)
    returning id into v_game_player_id;

    v_players := v_players || jsonb_build_object(
      'player_id', v_player_id,
      'game_player_id', v_game_player_id,
      'display_name', v_name
    );
  end loop;

  return jsonb_build_object('game_id', v_game_id, 'players', v_players);
end;
$$;

-- ---------------------------------------------------------------------------
-- save_round: idempotent upsert of a round and its results, safe to retry.
-- p_results: [{ "game_player_id": uuid, "bid": int, "tricks_won": int, "score": int }].
-- The score is computed client side (src/domain/scoring.ts) to keep a single rule.
-- ---------------------------------------------------------------------------
create or replace function public.save_round(p_game_id uuid, p_round_number integer, p_results jsonb)
returns uuid
language plpgsql
as $$
declare
  v_round_id uuid;
begin
  select r.id into v_round_id
  from public.rounds r
  where r.game_id = p_game_id and r.round_number = p_round_number
  for update;

  if v_round_id is null then
    insert into public.rounds (game_id, round_number)
    values (p_game_id, p_round_number)
    returning id into v_round_id;
  end if;

  insert into public.round_results (round_id, game_player_id, bid, tricks_won, score)
  select
    v_round_id,
    (r.value ->> 'game_player_id')::uuid,
    (r.value ->> 'bid')::integer,
    (r.value ->> 'tricks_won')::integer,
    (r.value ->> 'score')::integer
  from jsonb_array_elements(p_results) as r
  on conflict (round_id, game_player_id) do update
    set bid = excluded.bid,
        tricks_won = excluded.tricks_won,
        score = excluded.score;

  return v_round_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- save_last_game_config: replaces the single "last used" template and its seats.
-- p_seats: [{ "player_id": uuid | null, "display_name": text | null }] in seat order.
-- ---------------------------------------------------------------------------
create or replace function public.save_last_game_config(p_name text, p_player_count integer, p_seats jsonb)
returns uuid
language plpgsql
as $$
declare
  v_template_id uuid;
begin
  select t.id into v_template_id
  from public.game_config_templates t
  where t.is_last_used
  order by t.updated_at desc
  limit 1
  for update;

  if v_template_id is null then
    insert into public.game_config_templates (name, player_count, is_last_used)
    values (p_name, p_player_count, true)
    returning id into v_template_id;
  else
    update public.game_config_templates
    set name = p_name, player_count = p_player_count, updated_at = now()
    where id = v_template_id;
    delete from public.game_config_template_players where template_id = v_template_id;
  end if;

  update public.game_config_templates
  set is_last_used = false
  where is_last_used and id <> v_template_id;

  -- seat_order is 1-based in the database.
  insert into public.game_config_template_players (template_id, seat_order, player_id, display_name_snapshot)
  select
    v_template_id,
    s.ordinality,
    nullif(s.value ->> 'player_id', '')::uuid,
    nullif(trim(s.value ->> 'display_name'), '')
  from jsonb_array_elements(p_seats) with ordinality as s;

  return v_template_id;
end;
$$;

grant execute on function public.start_game(jsonb) to anon, authenticated;
grant execute on function public.save_round(uuid, integer, jsonb) to anon, authenticated;
grant execute on function public.save_last_game_config(text, integer, jsonb) to anon, authenticated;

-- Make the new functions visible to the API immediately.
notify pgrst, 'reload schema';
