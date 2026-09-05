const sessionStore =
    require("./multiplayerSessionStore");

const {
    GAME_STATES,
    DEFAULT_LOBBY_TIMEOUT_MS,
    DEFAULT_ROUND_TIMEOUT_MS,
    MIN_PLAYERS,
    MAX_PLAYERS,
} = require("./multiplayerConstants");


/*
 * -----------------------------
 * Validation
 * -----------------------------
 */

function validateUserId(userId) {
    if (
        typeof userId !== "string" ||
        userId.trim() === ""
    ) {
        throw new Error(
            "User ID is required."
        );
    }
}


function validateGameType(gameType) {
    if (
        typeof gameType !== "string" ||
        gameType.trim() === ""
    ) {
        throw new Error(
            "Game type is required."
        );
    }
}


function validateTimeout(
    timeoutMs,
    label
) {
    if (
        !Number.isSafeInteger(timeoutMs) ||
        timeoutMs <= 0
    ) {
        throw new Error(
            `Invalid ${label}.`
        );
    }
}


/*
 * -----------------------------
 * Session Creation
 * -----------------------------
 */

function createSession({
    gameName,
    gameType,
    hostId,

    minPlayers =
        MIN_PLAYERS,

    maxPlayers =
        MAX_PLAYERS,

    playerLimit,

    lobbyTimeoutMs =
        DEFAULT_LOBBY_TIMEOUT_MS,

    roundTimeoutMs =
        DEFAULT_ROUND_TIMEOUT_MS,

    gameState,
    gameData,
} = {}) {
    const resolvedGameType =
        gameName || gameType;

    validateGameType(
        resolvedGameType
    );

    validateUserId(
        hostId
    );

    const resolvedMaxPlayers =
        playerLimit ??
        maxPlayers;

    if (
        !Number.isSafeInteger(
            minPlayers
        ) ||
        minPlayers < MIN_PLAYERS
    ) {
        throw new Error(
            `Minimum players must be at least ${MIN_PLAYERS}.`
        );
    }

    if (
        !Number.isSafeInteger(
            resolvedMaxPlayers
        ) ||
        resolvedMaxPlayers < MIN_PLAYERS ||
        resolvedMaxPlayers > MAX_PLAYERS
    ) {
        throw new Error(
            `Maximum players must be between ${MIN_PLAYERS} and ${MAX_PLAYERS}.`
        );
    }

    if (
        minPlayers >
        resolvedMaxPlayers
    ) {
        throw new Error(
            "Minimum players cannot exceed maximum players."
        );
    }

    validateTimeout(
        lobbyTimeoutMs,
        "lobby expiration"
    );

    validateTimeout(
        roundTimeoutMs,
        "round timeout"
    );

    const initialGameData = {
        ...(gameData || {}),
        ...(gameState || {}),

        minPlayers,

        roundTimeoutMs,
    };

    return sessionStore.createSession({
        gameType:
            resolvedGameType,

        hostId,

        playerLimit:
            resolvedMaxPlayers,

        lobbyTimeoutMs,

        roundTimeoutMs,

        gameData:
            initialGameData,
    });
}


/*
 * -----------------------------
 * Session Access
 * -----------------------------
 */

function getSession(sessionId) {
    const session =
        sessionStore.getSession(
            sessionId
        );

    if (!session) {
        throw new Error(
            "Multiplayer session not found."
        );
    }

    return session;
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
    validateUserId(
        userId
    );

    return sessionStore.joinSession(
        sessionId,
        userId
    );
}


function leave(
    sessionId,
    userId
) {
    validateUserId(
        userId
    );

    return sessionStore.leaveSession(
        sessionId,
        userId
    );
}


function start(
    sessionId,
    userId
) {
    validateUserId(
        userId
    );

    const session =
        getSession(
            sessionId
        );

    if (
        session.hostId !== userId
    ) {
        throw new Error(
            "Only the host can start the game."
        );
    }

    if (
        session.state !==
        GAME_STATES.WAITING
    ) {
        throw new Error(
            "This game cannot be started right now."
        );
    }

    const minPlayers =
        session.gameData?.minPlayers ??
        MIN_PLAYERS;

    if (
        session.players.length <
        minPlayers
    ) {
        throw new Error(
            `At least ${minPlayers} players are required to start.`
        );
    }

    return sessionStore.startSession(
        sessionId,
        userId
    );
}


function cancel(
    sessionId,
    userId
) {
    validateUserId(
        userId
    );

    return sessionStore.cancelSession(
        sessionId,
        userId
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
    const session =
        getSession(
            sessionId
        );

    /*
     * STARTING is used for the first
     * round.
     *
     * NEXT_ROUND is used for every
     * subsequent round.
     */
    if (
        session.state !==
            GAME_STATES.STARTING &&
        session.state !==
            GAME_STATES.NEXT_ROUND
    ) {
        throw new Error(
            "The game is not ready to begin betting."
        );
    }

    const now =
        Date.now();

    const roundTimeout =
        session.gameData?.roundTimeoutMs ??
        DEFAULT_ROUND_TIMEOUT_MS;

    const roundExpiresAt =
        now +
        roundTimeout;

    sessionStore.updateGameData(
        sessionId,
        {
            roundStartedAt:
                now,

            roundExpiresAt,

            bets: {},

            result: null,

            resolved: false,
        }
    );

    return sessionStore.updateState(
        sessionId,
        GAME_STATES.BETTING
    );
}


function roundTimeoutFor(
    session
) {
    const timeout =
        session.gameData?.roundTimeoutMs;

    if (
        Number.isSafeInteger(
            timeout
        ) &&
        timeout > 0
    ) {
        return (
            Date.now() +
            timeout
        );
    }

    return (
        Date.now() +
        DEFAULT_ROUND_TIMEOUT_MS
    );
}


function lockRound(
    sessionId
) {
    const session =
        getSession(
            sessionId
        );

    if (
        session.state !==
        GAME_STATES.BETTING
    ) {
        throw new Error(
            "The betting phase is not active."
        );
    }

    return sessionStore.updateState(
        sessionId,
        GAME_STATES.LOCKED
    );
}


function beginResolving(
    sessionId
) {
    const session =
        getSession(
            sessionId
        );

    if (
        session.state !==
            GAME_STATES.LOCKED &&
        session.state !==
            GAME_STATES.BETTING
    ) {
        throw new Error(
            "The round cannot be resolved right now."
        );
    }

    return sessionStore.updateState(
        sessionId,
        GAME_STATES.RESOLVING
    );
}


function setResult(
    sessionId,
    result
) {
    const session =
        getSession(
            sessionId
        );

    if (
        session.state !==
        GAME_STATES.RESOLVING
    ) {
        throw new Error(
            "The game is not resolving."
        );
    }

    sessionStore.updateGameData(
        sessionId,
        {
            result,
            resolved: true,
        }
    );

    return sessionStore.updateState(
        sessionId,
        GAME_STATES.RESULT
    );
}


function nextRound(
    sessionId
) {
    const session =
        getSession(
            sessionId
        );

    if (
        session.state !==
        GAME_STATES.RESULT
    ) {
        throw new Error(
            "The game is not ready for another round."
        );
    }

    sessionStore.updateGameData(
        sessionId,
        {
            result: null,

            bets: {},

            roundStartedAt: null,

            roundExpiresAt: null,

            resolved: false,
        }
    );

    /*
     * Keep NEXT_ROUND as a real state.
     *
     * beginBetting() explicitly accepts
     * NEXT_ROUND and moves it to BETTING.
     */
    return sessionStore.updateState(
        sessionId,
        GAME_STATES.NEXT_ROUND
    );
}


function end(
    sessionId
) {
    const session =
        getSession(
            sessionId
        );

    if (
        session.state ===
        GAME_STATES.ENDED
    ) {
        return session;
    }

    return sessionStore.updateState(
        sessionId,
        GAME_STATES.ENDED
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
    return sessionStore.touch(
        sessionId
    );
}


function isLobbyExpired(
    sessionOrId
) {
    const session =
        typeof sessionOrId === "string"
            ? sessionStore.getSession(
                  sessionOrId
              )
            : sessionOrId;

    if (!session) {
        return true;
    }

    return (
        session.state ===
            GAME_STATES.WAITING &&
        session.expiresAt !== null &&
        Date.now() >=
            session.expiresAt
    );
}


function isRoundExpired(
    sessionOrId
) {
    const session =
        typeof sessionOrId === "string"
            ? sessionStore.getSession(
                  sessionOrId
              )
            : sessionOrId;

    if (!session) {
        return true;
    }

    if (
        session.state !==
        GAME_STATES.BETTING
    ) {
        return false;
    }

    const expiresAt =
        session.gameData?.roundExpiresAt;

    if (
        !Number.isSafeInteger(
            expiresAt
        )
    ) {
        return false;
    }

    return (
        Date.now() >=
        expiresAt
    );
}


function getRemainingRoundTime(
    sessionId
) {
    const session =
        getSession(
            sessionId
        );

    const expiresAt =
        session.gameData?.roundExpiresAt;

    if (
        !Number.isSafeInteger(
            expiresAt
        )
    ) {
        return 0;
    }

    return Math.max(
        0,
        expiresAt -
            Date.now()
    );
}


/*
 * -----------------------------
 * Cleanup
 * -----------------------------
 */

function cleanupExpiredLobbies() {
    return sessionStore.clearExpiredSessions();
}


/*
 * -----------------------------
 * Exports
 * -----------------------------
 */

module.exports = {
    GAME_STATES,

    DEFAULT_LOBBY_TIMEOUT_MS,
    DEFAULT_ROUND_TIMEOUT_MS,

    MIN_PLAYERS,
    MAX_PLAYERS,

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

    touchLobby,

    isLobbyExpired,
    isRoundExpired,
    getRemainingRoundTime,

    cleanupExpiredLobbies,
};