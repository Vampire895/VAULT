const sessions = new Map();

const DEFAULT_EXPIRATION_MS =
    10 * 60 * 1000;


/*
 * --------------------------------
 * Validation
 * --------------------------------
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


/*
 * --------------------------------
 * Session Creation
 * --------------------------------
 */

function createSession(
    userId,
    gameState,
    expirationMs =
        DEFAULT_EXPIRATION_MS
) {
    validateUserId(userId);

    if (sessions.has(userId)) {
        throw new Error(
            "You already have an active Mines game."
        );
    }

    if (
        !gameState ||
        typeof gameState !== "object"
    ) {
        throw new Error(
            "Invalid Mines game state."
        );
    }

    if (
        !Number.isSafeInteger(
            expirationMs
        ) ||
        expirationMs <= 0
    ) {
        throw new Error(
            "Invalid Mines session expiration."
        );
    }

    const now = Date.now();

    const session = {
        userId,

        ...gameState,

        createdAt: now,

        expiresAt:
            now + expirationMs,
    };

    sessions.set(
        userId,
        session
    );

    return session;
}


/*
 * --------------------------------
 * Session Access
 * --------------------------------
 */

function getSession(userId) {
    validateUserId(userId);

    const session =
        sessions.get(userId);

    if (!session) {
        return null;
    }

    if (
        Date.now() >=
        session.expiresAt
    ) {
        sessions.delete(userId);

        return null;
    }

    return session;
}


/*
 * --------------------------------
 * Session Updates
 * --------------------------------
 */

function updateSession(
    userId,
    updates
) {
    const session =
        getSession(userId);

    if (!session) {
        throw new Error(
            "No active Mines game found."
        );
    }

    if (
        !updates ||
        typeof updates !== "object" ||
        Array.isArray(updates)
    ) {
        throw new Error(
            "Invalid Mines session update."
        );
    }

    const updatedSession = {
        ...session,
        ...updates,
    };

    sessions.set(
        userId,
        updatedSession
    );

    return updatedSession;
}


/*
 * --------------------------------
 * Cleanup
 * --------------------------------
 */

function deleteSession(userId) {
    validateUserId(userId);

    return sessions.delete(
        userId
    );
}


function hasSession(userId) {
    return (
        getSession(userId) !== null
    );
}


function clearExpiredSessions() {
    const now = Date.now();

    let cleared = 0;

    for (
        const [
            userId,
            session
        ] of sessions.entries()
    ) {
        if (
            now >=
            session.expiresAt
        ) {
            sessions.delete(
                userId
            );

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
    createSession,
    getSession,
    updateSession,

    deleteSession,
    hasSession,

    clearExpiredSessions,
    getSessionCount,
};