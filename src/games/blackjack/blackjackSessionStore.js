const sessions = new Map();

const DEFAULT_EXPIRATION_MS = 5 * 60 * 1000;

const SESSION_STATES = Object.freeze({
    PLAYER_TURN: "player_turn",
    RESOLVING: "resolving",
});

function validateUserId(userId) {
    if (
        typeof userId !== "string" ||
        userId.trim() === ""
    ) {
        throw new Error("User ID is required.");
    }
}

function validateExpiration(expirationMs) {
    if (
        !Number.isSafeInteger(expirationMs) ||
        expirationMs <= 0
    ) {
        throw new Error(
            "Invalid Blackjack session expiration."
        );
    }
}

function createSession(
    userId,
    gameState,
    expirationMs = DEFAULT_EXPIRATION_MS
) {
    validateUserId(userId);
    validateExpiration(expirationMs);

    if (
        !gameState ||
        typeof gameState !== "object" ||
        Array.isArray(gameState)
    ) {
        throw new Error(
            "Invalid Blackjack game state."
        );
    }

    if (sessions.has(userId)) {
        throw new Error(
            "You already have an active Blackjack game."
        );
    }

    const now = Date.now();

    const session = {
        userId,
        ...gameState,

        /*
         * Every newly-created game starts in its
         * supplied state. Normally this is player_turn.
         */
        state:
            gameState.state ??
            SESSION_STATES.PLAYER_TURN,

        createdAt: now,
        expiresAt: now + expirationMs,
    };

    sessions.set(userId, session);

    return session;
}

function getSession(userId) {
    validateUserId(userId);

    const session = sessions.get(userId);

    if (!session) {
        return null;
    }

    if (Date.now() >= session.expiresAt) {
        sessions.delete(userId);
        return null;
    }

    return session;
}

/*
 * Claim an active Blackjack session for a terminal
 * action such as Hit-bust, Stand, or Double Down.
 *
 * Only one interaction can successfully move the
 * session from PLAYER_TURN → RESOLVING.
 *
 * This prevents rapid duplicate interactions from
 * settling the same game multiple times.
 */
function claimSession(userId) {
    const session = getSession(userId);

    if (!session) {
        throw new Error(
            "No active Blackjack game found."
        );
    }

    if (
        session.state !==
        SESSION_STATES.PLAYER_TURN
    ) {
        throw new Error(
            "This Blackjack game is already being resolved."
        );
    }

    const claimedSession = {
        ...session,
        state: SESSION_STATES.RESOLVING,
        resolvingAt: Date.now(),
    };

    sessions.set(userId, claimedSession);

    return claimedSession;
}

/*
 * Update an existing session.
 *
 * IMPORTANT:
 * State-changing game actions should use the
 * session lifecycle methods rather than bypassing
 * the store.
 */
function updateSession(userId, updates) {
    const session = getSession(userId);

    if (!session) {
        throw new Error(
            "No active Blackjack game found."
        );
    }

    if (
        !updates ||
        typeof updates !== "object" ||
        Array.isArray(updates)
    ) {
        throw new Error(
            "Invalid Blackjack session update."
        );
    }

    const updatedSession = {
        ...session,
        ...updates,
    };

    sessions.set(userId, updatedSession);

    return updatedSession;
}

function deleteSession(userId) {
    validateUserId(userId);

    return sessions.delete(userId);
}

function hasSession(userId) {
    return getSession(userId) !== null;
}

function clearExpiredSessions() {
    const now = Date.now();
    let cleared = 0;

    for (
        const [userId, session]
        of sessions.entries()
    ) {
        if (now >= session.expiresAt) {
            sessions.delete(userId);
            cleared++;
        }
    }

    return cleared;
}

function getSessionCount() {
    clearExpiredSessions();

    return sessions.size;
}

module.exports = {
    SESSION_STATES,
    DEFAULT_EXPIRATION_MS,

    createSession,
    getSession,
    claimSession,
    updateSession,
    deleteSession,
    hasSession,
    clearExpiredSessions,
    getSessionCount,
};