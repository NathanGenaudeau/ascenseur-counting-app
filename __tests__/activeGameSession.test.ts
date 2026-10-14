import {
  orderedGamePlayerIds,
  parseStoredActiveGame,
  serializeActiveGame,
  unsyncedRoundCount,
  type StoredActiveGame,
} from '../src/domain/activeGameSession';
import { createInitialPlayState } from '../src/domain/gamePlayState';

function storedGame(): StoredActiveGame {
  return {
    version: 1,
    session: {
      players: [
        { displayName: 'A', playerId: 'p0', gamePlayerId: 'gp0' },
        { displayName: 'B', playerId: 'p1', gamePlayerId: 'gp1' },
        { displayName: 'C', playerId: 'p2', gamePlayerId: 'gp2' },
      ],
      settings: { notes: 'x' },
      supabaseGameId: 'g1',
    },
    playState: {
      ...createInitialPlayState(3),
      currentRoundIndex: 2,
      descentStartRound: null,
      roundsCompleted: [
        { roundIndex: 1, announcements: [0, 0, 0], tricks: [1, 0, 0], scores: [-1, 0, 0], cardsPerHand: 1 },
      ],
    },
    sync: { syncedRoundCount: 1, finishSynced: false },
  };
}

describe('activeGameSession', () => {
  it('relit une partie sérialisée à l’identique', () => {
    const game = storedGame();
    expect(parseStoredActiveGame(serializeActiveGame(game))).toEqual(game);
  });

  it('rejette absence, JSON invalide et version inconnue', () => {
    expect(parseStoredActiveGame(null)).toBeNull();
    expect(parseStoredActiveGame('{oops')).toBeNull();
    expect(parseStoredActiveGame(JSON.stringify({ ...storedGame(), version: 2 }))).toBeNull();
  });

  it('rejette des tableaux dont la taille ne correspond pas au nombre de joueurs', () => {
    const game = storedGame();
    game.playState.draft.announcements = [0, 0];
    expect(parseStoredActiveGame(JSON.stringify(game))).toBeNull();
  });

  it('borne syncedRoundCount au nombre de manches terminées', () => {
    const game = storedGame();
    game.sync.syncedRoundCount = 5;
    expect(parseStoredActiveGame(JSON.stringify(game))?.sync.syncedRoundCount).toBe(1);
  });

  it('orderedGamePlayerIds exige un identifiant par siège', () => {
    const game = storedGame();
    expect(orderedGamePlayerIds(game.session)).toEqual(['gp0', 'gp1', 'gp2']);
    game.session.players[1] = { displayName: 'B' };
    expect(orderedGamePlayerIds(game.session)).toBeNull();
  });

  it('unsyncedRoundCount ne descend jamais sous zéro', () => {
    expect(unsyncedRoundCount(3, { syncedRoundCount: 1, finishSynced: false })).toBe(2);
    expect(unsyncedRoundCount(1, { syncedRoundCount: 2, finishSynced: false })).toBe(0);
  });
});
