import { gameStatusForDb, gameStatusFromDb } from '../src/data/supabaseGameStatus';

describe('supabaseGameStatus', () => {
  it('mappe le domaine vers l’enum Postgres', () => {
    expect(gameStatusForDb('running')).toBe('in_progress');
    expect(gameStatusForDb('finished')).toBe('finished');
    expect(gameStatusForDb('aborted')).toBe('finished');
  });

  it('mappe la ligne SQL vers le domaine', () => {
    expect(gameStatusFromDb('in_progress')).toBe('running');
    expect(gameStatusFromDb('finished')).toBe('finished');
  });
});
