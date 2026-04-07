import {
  buildFinishedGameRecord,
  parseFinishedGameRecord,
  parseFinishedGamesList,
  serializeFinishedGamesList,
} from '../src/domain/finishedGameRecord';
import { gamePlayReducer } from '../src/domain/gamePlayState';

describe('finishedGameRecord', () => {
  it('sérialise et parse une liste', () => {
    let s = gamePlayReducer(null, { type: 'INIT', playerCount: 2 })!;
    s = gamePlayReducer(s, { type: 'SET_ANNOUNCEMENT', index: 0, value: 2 });
    s = gamePlayReducer(s, { type: 'SET_ANNOUNCEMENT', index: 1, value: 2 });
    s = gamePlayReducer(s, { type: 'GO_TO_RESULTS' });
    s = gamePlayReducer(s, { type: 'SET_TRICK', index: 0, value: 2 });
    s = gamePlayReducer(s, { type: 'SET_TRICK', index: 1, value: 2 });
    s = gamePlayReducer(s, { type: 'FINALIZE_ROUND' })!;

    const record = buildFinishedGameRecord(
      { players: [{ displayName: 'X' }, { displayName: 'Y' }], settings: {} },
      s,
    );
    const raw = serializeFinishedGamesList([record]);
    const list = parseFinishedGamesList(raw);
    expect(list).toHaveLength(1);
    expect(list[0].playerNames).toEqual(['X', 'Y']);
    expect(parseFinishedGameRecord({ foo: 1 })).toBeNull();
  });
});
