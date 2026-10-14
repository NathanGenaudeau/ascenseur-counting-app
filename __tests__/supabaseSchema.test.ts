import * as fs from 'fs';
import * as path from 'path';


/**
 * ASC-44 / ASC-45 — cohérence noms de tables avec le script SQL de migration.
 */
describe('Schéma SQL de référence', () => {
  it('déclare les tables attendues dans la migration', () => {
    const sqlPath = path.join(
      __dirname,
      '../supabase/migrations/20260404120000_initial_ascenseur_schema.sql',
    );
    const sql = fs.readFileSync(sqlPath, 'utf8');
    expect(sql).toContain('create table public.players');
    expect(sql).toContain('create table public.games');
    expect(sql).toContain('create table public.game_players');
    expect(sql).toContain('create table public.rounds');
    expect(sql).toContain('create table public.round_results');
    expect(sql).toContain('create table public.game_config_templates');
    expect(sql).toContain('create table public.game_config_template_players');
    expect(sql).toContain('round_results_score_rule');
  });

  it('déclare les RPC d’écriture atomiques utilisées par le client', () => {
    const sqlPath = path.join(__dirname, '../supabase/migrations/20261014120000_atomic_write_rpcs.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    expect(sql).toContain('create or replace function public.start_game(p_seats jsonb)');
    expect(sql).toContain(
      'create or replace function public.save_round(p_game_id uuid, p_round_number integer, p_results jsonb)',
    );
    expect(sql).toContain(
      'create or replace function public.save_last_game_config(p_name text, p_player_count integer, p_seats jsonb)',
    );
  });
});
