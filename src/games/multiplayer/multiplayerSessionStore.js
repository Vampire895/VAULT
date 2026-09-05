const crypto =
    require("crypto");

const {
    GAME_STATES,
    DEFAULT_LOBBY_TIMEOUT_MS,
    DEFAULT_ROUND_TIMEOUT_MS,
    MIN_PLAYERS,
    MAX_PLAYERS,
} = require("./multiplayerConstants");


/*
 * -----------------------------
 * Runtime Storage
 * -----------------------------
 *
 * Multiplayer sessions are temporary
 * runtime state and intentionally live
 * in RAM only.
 */

const sessions =
    new Map();

const userSessions =
    new Map();


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


function validatePlayerLimit(
    playerLimit
) {
    if (
        !Number.isInteger(
            playerLimit
        ) ||
        playerLimit < MIN_PLAYERS ||
        playerLimit > MAX_PLAYERS
    ) {
        throw new Error(
            `Player limit must be between ${MIN_PLAYERS} and ${MAX_PLAYERS}.`
        );
    }
}


function validateTimeout(
    timeoutMs,
    label
) {
    if (
        !Number.isSafeInteger(
            timeoutMs
        ) ||
        timeoutMs <= 0
    ) {
        throw new Error(
            `Invalid ${label}.`
        );
    }
}


/*
 * -----------------------------
 * Session ID
 * -----------------------------
 */

function createSessionId() {
    return crypto.randomUUID();
}


/*
 * -----------------------------
 * User Session Tracking
 * -----------------------------
 */

function getActiveSessionForUser(
    userId
) {
    validateUserId(
        userId
    );

    const sessionId =
        userSessions.get(
            userId
        );

    if (!sessionId) {
        return null;
    }

    const session =
        getSession(
            sessionId
        );

    if (!session) {
        userSessions.delete(
            userId
        );

        return null;
    }

    return session;
}


function ensureUserNotInSession(
    userId
) {
    const existingSession =
        getActiveSessionForUser(
            userId
        );

    if (existingSession) {
        throw new Error(
            "You are already in an active multiplayer game."
        );
    }
}


/*
 * -----------------------------
 * Lobby Helpers
 * -----------------------------
 */

function ensureSessionWaiting(
    session
) {
    if (
        session.state !==
        GAME_STATES.WAITING
    ) {
        throw new Error(
            "This multiplayer lobby is no longer accepting players."
        );
    }
}


function touchSession(
    session
) {
    const now =
        Date.now();

    session.lastActivityAt =
        now;

    session.expiresAt =
        now +
        session.lobbyTimeoutMs;
}


/*
 * -----------------------------
 * Session Creation
 * -----------------------------
 */

function createSession({
    gameType,
    hostId,
    playerLimit =
        MAX_PLAYERS,

    lobbyTimeoutMs =
        DEFAULT_LOBBY_TIMEOUT_MS,

    roundTimeoutMs =
        DEFAULT_ROUND_TIMEOUT_MS,

    gameData = {},
} = {}) {
    validateGameType(
        gameType
    );

    validateUserId(
        hostId
    );

    validatePlayerLimit(
        playerLimit
    );

    validateTimeout(
        lobbyTimeoutMs,
        "lobby expiration"
    );

    validateTimeout(
        roundTimeoutMs,
        "round timeout"
    );

    ensureUserNotInSession(
        hostId
    );

    const now =
        Date.now();

    const sessionId =
        createSessionId();

    const session = {
        id:
            sessionId,

        gameType,

        hostId,

        players: [
            hostId,
        ],

        maxPlayers:
            playerLimit,

        state:
            GAME_STATES.WAITING,

        gameData: {
            ...gameData,

            roundTimeoutMs,

            /*
             * Every multiplayer game starts
             * with a clean round container.
             */
            bets:
                gameData.bets ?? {},

            result:
                gameData.result ?? null,

            resolved:
                gameData.resolved ?? false,

            roundStartedAt:
                gameData.roundStartedAt ?? null,

            roundExpiresAt:
                gameData.roundExpiresAt ?? null,
        },

        createdAt:
            now,

        lastActivityAt:
            now,

        expiresAt:
            now +
            lobbyTimeoutMs,

        lobbyTimeoutMs,
    };

    sessions.set(
        sessionId,
        session
    );

    userSessions.set(
        hostId,
        sessionId
    );

    return session;
}


/*
 * -----------------------------
 * Session Access
 * -----------------------------
 */

function getSession(
    sessionId
) {
    if (
        typeof sessionId !== "string" ||
        sessionId.trim() === ""
    ) {
        throw new Error(
            "Session ID is required."
        );
    }

    const session =
        sessions.get(
            sessionId
        );

    if (!session) {
        return null;
    }

    /*
     * Only waiting lobbies expire.
     *
     * Once the game starts, lobby
     * expiration is disabled.
     */
    if (
        session.state ===
            GAME_STATES.WAITING &&
        session.expiresAt !== null &&
        Date.now() >=
            session.expiresAt
    ) {
        deleteSession(
            sessionId
        );

        return null;
    }

    return session;
}


function hasSession(
    sessionId
) {
    return (
        getSession(
            sessionId
        ) !== null
    );
}


/*
 * -----------------------------
 * Join
 * -----------------------------
 */

function joinSession(
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

    if (!session) {
        throw new Error(
            "Multiplayer lobby not found."
        );
    }

    ensureSessionWaiting(
        session
    );

    if (
        session.players.includes(
            userId
        )
    ) {
        throw new Error(
            "You are already in this lobby."
        );
    }

    ensureUserNotInSession(
        userId
    );

    if (
        session.players.length >=
        session.maxPlayers
    ) {
        throw new Error(
            "This multiplayer lobby is full."
        );
    }

    session.players.push(
        userId
    );

    userSessions.set(
        userId,
        sessionId
    );

    touchSession(
        session
    );

    return session;
}


/*
 * -----------------------------
 * Leave
 * -----------------------------
 */

function leaveSession(
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

    if (!session) {
        throw new Error(
            "Multiplayer lobby not found."
        );
    }

    ensureSessionWaiting(
        session
    );

    if (
        !session.players.includes(
            userId
        )
    ) {
        throw new Error(
            "You are not in this lobby."
        );
    }

    /*
     * Host owns the lobby.
     *
     * If host leaves before start,
     * cancel the complete lobby.
     */
    if (
        session.hostId === userId
    ) {
        const players =
            [
                ...session.players,
            ];

        deleteSession(
            sessionId
        );

        return {
            cancelled:
                true,

            hostLeft:
                true,

            players,

            sessionId,
        };
    }

    session.players =
        session.players.filter(
            playerId =>
                playerId !== userId
        );

    userSessions.delete(
        userId
    );

    touchSession(
        session
    );

    return {
        cancelled:
            false,

        hostLeft:
            false,

        players:
            [
                ...session.players,
            ],

        session,
    };
}


/*
 * -----------------------------
 * Start
 * -----------------------------
 */

function startSession(
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

    if (!session) {
        throw new Error(
            "Multiplayer lobby not found."
        );
    }

    ensureSessionWaiting(
        session
    );

    if (
        session.hostId !== userId
    ) {
        throw new Error(
            "Only the host can start this game."
        );
    }

    const minimumPlayers =
        session.gameData?.minPlayers ??
        MIN_PLAYERS;

    if (
        session.players.length <
        minimumPlayers
    ) {
        throw new Error(
            `At least ${minimumPlayers} players are required to start.`
        );
    }

    session.state =
        GAME_STATES.STARTING;

    session.expiresAt =
        null;

    session.lastActivityAt =
        Date.now();

    return session;
}


/*
 * -----------------------------
 * Cancel
 * -----------------------------
 */

function cancelSession(
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

    if (!session) {
        throw new Error(
            "Multiplayer lobby not found."
        );
    }

    ensureSessionWaiting(
        session
    );

    if (
        session.hostId !== userId
    ) {
        throw new Error(
            "Only the host can cancel this game."
        );
    }

    const players =
        [
            ...session.players,
        ];

    deleteSession(
        sessionId
    );

    return {
        cancelled:
            true,

        players,

        sessionId,
    };
}


/*
 * -----------------------------
 * Game Data
 * -----------------------------
 */

function updateGameData(
    sessionId,
    updates
) {
    const session =
        getSession(
            sessionId
        );

    if (!session) {
        throw new Error(
            "Multiplayer session not found."
        );
    }

    if (
        !updates ||
        typeof updates !== "object" ||
        Array.isArray(updates)
    ) {
        throw new Error(
            "Invalid multiplayer game data update."
        );
    }

    session.gameData = {
        ...session.gameData,
        ...updates,
    };

    session.lastActivityAt =
        Date.now();

    return session;
}


/*
 * -----------------------------
 * State
 * -----------------------------
 */

function updateState(
    sessionId,
    state
) {
    const session =
        getSession(
            sessionId
        );

    if (!session) {
        throw new Error(
            "Multiplayer session not found."
        );
    }

    if (
        !Object.values(
            GAME_STATES
        ).includes(state)
    ) {
        throw new Error(
            "Invalid multiplayer game state."
        );
    }

    session.state =
        state;

    session.lastActivityAt =
        Date.now();

    /*
     * Waiting lobby expiration is based
     * on inactivity.
     *
     * Once the game starts, expiration
     * is disabled.
     */
    if (
        state !==
        GAME_STATES.WAITING
    ) {
        session.expiresAt =
            null;
    } else {
        touchSession(
            session
        );
    }

    return session;
}


/*
 * -----------------------------
 * Touch
 * -----------------------------
 */

function touch(
    sessionId
) {
    const session =
        getSession(
            sessionId
        );

    if (!session) {
        throw new Error(
            "Multiplayer session not found."
        );
    }

    if (
        session.state ===
        GAME_STATES.WAITING
    ) {
        touchSession(
            session
        );
    }

    return session;
}


/*
 * -----------------------------
 * Players
 * -----------------------------
 */

function getPlayers(
    sessionId
) {
    const session =
        getSession(
            sessionId
        );

    if (!session) {
        throw new Error(
            "Multiplayer session not found."
        );
    }

    return [
        ...session.players,
    ];
}


function getSessionForUser(
    userId
) {
    return getActiveSessionForUser(
        userId
    );
}


/*
 * -----------------------------
 * Delete
 * -----------------------------
 */

function deleteSession(
    sessionId
) {
    const session =
        sessions.get(
            sessionId
        );

    if (!session) {
        return false;
    }

    for (
        const userId of
        session.players
    ) {
        if (
            userSessions.get(
                userId
            ) === sessionId
        ) {
            userSessions.delete(
                userId
            );
        }
    }

    return sessions.delete(
        sessionId
    );
}


/*
 * -----------------------------
 * Cleanup
 * -----------------------------
 */

function clearExpiredSessions() {
    const now =
        Date.now();

    let cleared =
        0;

    for (
        const [
            sessionId,
            session,
        ] of sessions.entries()
    ) {
        if (
            session.state ===
                GAME_STATES.WAITING &&
            session.expiresAt !== null &&
            now >=
                session.expiresAt
        ) {
            if (
                deleteSession(
                    sessionId
                )
            ) {
                cleared++;
            }
        }
    }

    return cleared;
}


function getSessionCount() {
    clearExpiredSessions();

    return sessions.size;
}


function clearAllSessions() {
    sessions.clear();

    userSessions.clear();
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
    hasSession,

    joinSession,
    leaveSession,

    startSession,
    cancelSession,

    updateState,
    updateGameData,
    touch,

    getPlayers,
    getSessionForUser,

    deleteSession,
    clearExpiredSessions,
    getSessionCount,

    clearAllSessions,
};