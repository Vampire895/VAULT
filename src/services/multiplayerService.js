const multiplayerEngine =
    require("../games/multiplayer/multiplayerEngine");


/*
 * -----------------------------
 * Session Creation
 * -----------------------------
 *
 * Public multiplayer service API.
 *
 * UI / game modules should use this
 * service instead of accessing the
 * multiplayer engine or session store
 * directly.
 */

function createSession(options = {}) {
    return multiplayerEngine.createSession({
        gameName:
            options.gameName ||
            options.gameType,

        hostId:
            options.hostId,

        minPlayers:
            options.minPlayers ??
            2,

        maxPlayers:
            options.maxPlayers ??
            options.playerLimit ??
            6,

        lobbyTimeoutMs:
            options.lobbyTimeoutMs,

        roundTimeoutMs:
            options.roundTimeoutMs,

        gameState:
            options.gameState ||
            options.gameData ||
            {},
    });
}


/*
 * -----------------------------
 * Backward-Compatible Lobby Alias
 * -----------------------------
 *
 * Older callers may use createLobby().
 * Keep it as an alias so existing
 * multiplayer code does not break.
 */

function createLobby(options = {}) {
    return createSession(
        options
    );
}


/*
 * -----------------------------
 * Session Access
 * -----------------------------
 */

function getSession(sessionId) {
    return multiplayerEngine.getSession(
        sessionId
    );
}


/*
 * Backward-compatible lobby alias.
 */

function getLobby(sessionId) {
    return getSession(
        sessionId
    );
}


/*
 * -----------------------------
 * Lobby
 * -----------------------------
 */

function join(
    sessionId,
    userId
) {
    return multiplayerEngine.join(
        sessionId,
        userId
    );
}


function joinLobby(
    sessionId,
    userId
) {
    return join(
        sessionId,
        userId
    );
}


function leave(
    sessionId,
    userId
) {
    return multiplayerEngine.leave(
        sessionId,
        userId
    );
}


function leaveLobby(
    sessionId,
    userId
) {
    return leave(
        sessionId,
        userId
    );
}


function start(
    sessionId,
    hostId
) {
    return multiplayerEngine.start(
        sessionId,
        hostId
    );
}


function startLobby(
    sessionId,
    hostId
) {
    return start(
        sessionId,
        hostId
    );
}


function cancel(
    sessionId,
    hostId
) {
    return multiplayerEngine.cancel(
        sessionId,
        hostId
    );
}


function cancelLobby(
    sessionId,
    hostId
) {
    return cancel(
        sessionId,
        hostId
    );
}


/*
 * -----------------------------
 * Game State
 * -----------------------------
 */

function beginBetting(
    sessionId
) {
    return multiplayerEngine.beginBetting(
        sessionId
    );
}


function lockRound(
    sessionId
) {
    return multiplayerEngine.lockRound(
        sessionId
    );
}


function beginResolving(
    sessionId
) {
    return multiplayerEngine.beginResolving(
        sessionId
    );
}


function setResult(
    sessionId,
    result
) {
    return multiplayerEngine.setResult(
        sessionId,
        result
    );
}


function nextRound(
    sessionId
) {
    return multiplayerEngine.nextRound(
        sessionId
    );
}


function end(
    sessionId
) {
    return multiplayerEngine.end(
        sessionId
    );
}


function endGame(
    sessionId
) {
    return end(
        sessionId
    );
}


/*
 * -----------------------------
 * Timing
 * -----------------------------
 */

function touchLobby(
    sessionId
) {
    return multiplayerEngine.touchLobby(
        sessionId
    );
}


function isLobbyExpired(
    sessionId
) {
    return multiplayerEngine.isLobbyExpired(
        sessionId
    );
}


function isRoundExpired(
    sessionId
) {
    return multiplayerEngine.isRoundExpired(
        sessionId
    );
}


function getRemainingRoundTime(
    sessionId
) {
    return multiplayerEngine.getRemainingRoundTime(
        sessionId
    );
}


/*
 * -----------------------------
 * Cleanup
 * -----------------------------
 */

function cleanupExpiredLobbies() {
    return multiplayerEngine.cleanupExpiredLobbies();
}


/*
 * -----------------------------
 * Exports
 * -----------------------------
 */

module.exports = {
    /*
     * Canonical session API
     */
    createSession,
    getSession,

    join,
    leave,

    start,
    cancel,

    beginBetting,
    lockRound,
    beginResolving,
    setResult,
    nextRound,
    end,

    /*
     * Lobby aliases
     */
    createLobby,
    getLobby,

    joinLobby,
    leaveLobby,

    startLobby,
    cancelLobby,

    endGame,

    /*
     * Timing
     */
    touchLobby,
    isLobbyExpired,
    isRoundExpired,
    getRemainingRoundTime,

    /*
     * Cleanup
     */
    cleanupExpiredLobbies,
};