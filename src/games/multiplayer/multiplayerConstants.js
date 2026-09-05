const MULTIPLAYER_STATES = Object.freeze({
    WAITING: "waiting",
    STARTING: "starting",
    BETTING: "betting",
    LOCKED: "locked",
    RESOLVING: "resolving",
    RESULT: "result",
    NEXT_ROUND: "next_round",
    ENDED: "ended",
});


/*
 * Backward-compatible alias.
 *
 * Multiplayer services use GAME_STATES.
 * Keep both names pointing to the same
 * state object so the system stays consistent.
 */

const GAME_STATES =
    MULTIPLAYER_STATES;


const DEFAULT_LOBBY_TIMEOUT_MS =
    3 * 60 * 1000;


const DEFAULT_ROUND_TIMEOUT_MS =
    15 * 1000;


const MIN_PLAYERS = 2;
const MAX_PLAYERS = 6;


module.exports = {
    MULTIPLAYER_STATES,
    GAME_STATES,

    DEFAULT_LOBBY_TIMEOUT_MS,
    DEFAULT_ROUND_TIMEOUT_MS,

    MIN_PLAYERS,
    MAX_PLAYERS,
};