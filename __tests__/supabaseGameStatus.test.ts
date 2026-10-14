import { gameStatusForDb } from '../src/data/supabaseGameStatus';

describe('supabaseGameStatus', () => {
  it('mappe le domaine vers l’enum Postgres', () => {
    expect(gameStatusForDb('running')).toBe('in_progress');
    expect(gameStatusForDb('finished')).toBe('finished');
    expect(gameStatusForDb('aborted')).toBe('finished');
  });
});
