import * as fs from 'fs';
import * as path from 'path';

import { SUPABASE_TABLE } from '../src/data/persistence/supabaseResources';

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

  it('SUPABASE_TABLE aligné sur Postgres', () => {
    expect(Object.values(SUPABASE_TABLE)).toEqual(
      expect.arrayContaining([
        'players',
        'games',
        'game_players',
        'rounds',
        'round_results',
        'game_config_templates',
        'game_config_template_players',
      ]),
    );
  });
});
