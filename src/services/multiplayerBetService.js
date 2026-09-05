const repository =
    require("../database/repository");

const userRepository =
    require("../database/userRepository");

const configurationService =
    require("./configurationService");

const multiplayerEngine =
    require("../games/multiplayer/multiplayerEngine");

const sessionStore =
    require("../games/multiplayer/multiplayerSessionStore");

const {
    GAME_STATES,
} = sessionStore;

const {
    isPositiveSafeInteger,
} = require("../validation/validation");


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


function validateBetAmount(amount) {
    if (
        !isPositiveSafeInteger(amount)
    ) {
        throw new Error(
            "Invalid multiplayer bet."
        );
    }
}


/*
 * -----------------------------
 * Minimum Bet
 * -----------------------------
 */

function getMinimumBet() {
    const minimumBet =
        configurationService.getMinimumBet();

    if (
        !Number.isSafeInteger(
            minimumBet
        ) ||
        minimumBet <= 0
    ) {
        throw new Error(
            "Invalid minimum bet configuration."
        );
    }

    return minimumBet;
}


function validateMinimumBet(amount) {
    const minimumBet =
        getMinimumBet();

    if (
        amount < minimumBet
    ) {
        throw new Error(
            `The minimum bet is ${minimumBet.toLocaleString()} coins.`
        );
    }

    return minimumBet;
}


/*
 * -----------------------------
 * Session
 * -----------------------------
 */

function getSession(sessionId) {
    const session =
        multiplayerEngine.getSession(
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
 * Betting Validation
 * -----------------------------
 */

function validateBettingState(session) {
    if (
        session.state !==
        GAME_STATES.BETTING
    ) {
        throw new Error(
            "Betting is not currently active."
        );
    }
}


function validatePlayer(
    session,
    userId
) {
    if (
        !session.players.includes(
            userId
        )
    ) {
        throw new Error(
            "You are not a player in this game."
        );
    }
}


/*
 * -----------------------------
 * Bet Access
 * -----------------------------
 */

function getBetsFromSession(session) {
    return {
        ...(session.gameData?.bets || {}),
    };
}


function getPlayerBet(
    session,
    userId
) {
    const bets =
        getBetsFromSession(
            session
        );

    return bets[userId] ?? null;
}


/*
 * -----------------------------
 * Bet Snapshot
 * -----------------------------
 *
 * Multiplayer session state lives
 * in RAM.
 *
 * We therefore keep a copy of the
 * current bets so failed database
 * transactions can restore the
 * session state.
 */

function snapshotBets(session) {
    return {
        ...(session.gameData?.bets || {}),
    };
}


function restoreBets(
    sessionId,
    bets
) {
    sessionStore.updateGameData(
        sessionId,
        {
            bets: {
                ...bets,
            },
        }
    );
}


/*
 * -----------------------------
 * Public Bet Status
 * -----------------------------
 */

function hasPlacedBet(
    sessionId,
    userId
) {
    validateUserId(userId);

    const session =
        getSession(sessionId);

    validatePlayer(
        session,
        userId
    );

    return (
        getPlayerBet(
            session,
            userId
        ) !== null
    );
}


/*
 * -----------------------------
 * Place Bet
 * -----------------------------
 */

function placeBet(
    sessionId,
    userId,
    amount
) {
    validateUserId(userId);
    validateBetAmount(amount);

    const minimumBet =
        validateMinimumBet(amount);

    const session =
        getSession(sessionId);

    validateBettingState(
        session
    );

    validatePlayer(
        session,
        userId
    );

    /*
     * Duplicate protection happens
     * before any balance mutation.
     */
    if (
        hasPlacedBet(
            sessionId,
            userId
        )
    ) {
        throw new Error(
            "You have already placed your bet for this round."
        );
    }

    /*
     * Snapshot the current RAM state.
     *
     * If the SQLite transaction fails,
     * the session bet is restored.
     */
    const previousBets =
        snapshotBets(
            session
        );

    /*
     * Reserve the bet in the temporary
     * multiplayer session first.
     *
     * This prevents another operation
     * in the same runtime from placing
     * the same player's bet again.
     */
    const bets =
        {
            ...previousBets,
            [userId]:
                amount,
        };

    sessionStore.updateGameData(
        sessionId,
        {
            bets,
        }
    );

    try {
        /*
         * Balance deduction is the
         * persistent atomic operation.
         */
        const result =
            repository.transaction(() => {
                const account =
                    userRepository.findById(
                        userId
                    );

                if (!account) {
                    throw new Error(
                        "Account not found."
                    );
                }

                if (
                    account.balance <
                    amount
                ) {
                    throw new Error(
                        "Insufficient balance."
                    );
                }

                /*
                 * Re-read the session while
                 * the transaction is active.
                 */
                const latestSession =
                    getSession(
                        sessionId
                    );

                validateBettingState(
                    latestSession
                );

                validatePlayer(
                    latestSession,
                    userId
                );

                /*
                 * The RAM reservation above
                 * must still belong to this user.
                 */
                const latestBet =
                    getPlayerBet(
                        latestSession,
                        userId
                    );

                if (
                    latestBet !== amount
                ) {
                    throw new Error(
                        "Multiplayer bet state changed unexpectedly."
                    );
                }

                /*
                 * Deduct balance atomically.
                 */
                userRepository
                    .deductBalanceInTransaction(
                        userId,
                        amount
                    );

                const finalAccount =
                    userRepository.findById(
                        userId
                    );

                return {
                    userId,

                    amount,

                    minimumBet,

                    balanceBefore:
                        account.balance,

                    balanceAfter:
                        finalAccount.balance,
                };
            });

        /*
         * Return the current session
         * after the persistent transaction
         * has succeeded.
         */
        const updatedSession =
            getSession(
                sessionId
            );

        return {
            session:
                updatedSession,

            ...result,
        };

    } catch (error) {
        /*
         * SQLite transaction failed.
         *
         * Restore the RAM session so
         * there is no phantom bet.
         */
        try {
            restoreBets(
                sessionId,
                previousBets
            );
        } catch {
            /*
             * Preserve the original database
             * error rather than replacing it
             * with a cleanup error.
             */
        }

        throw error;
    }
}


/*
 * -----------------------------
 * Bet Queries
 * -----------------------------
 */

function getBets(sessionId) {
    const session =
        getSession(
            sessionId
        );

    return getBetsFromSession(
        session
    );
}


function getBet(
    sessionId,
    userId
) {
    validateUserId(userId);

    const session =
        getSession(
            sessionId
        );

    validatePlayer(
        session,
        userId
    );

    return getPlayerBet(
        session,
        userId
    );
}


function getTotalBets(sessionId) {
    const bets =
        getBets(
            sessionId
        );

    return Object.values(
        bets
    ).reduce(
        (
            total,
            amount
        ) =>
            total + amount,
        0
    );
}


function allPlayersHaveBets(
    sessionId
) {
    const session =
        getSession(
            sessionId
        );

    const bets =
        getBetsFromSession(
            session
        );

    return session.players.every(
        userId =>
            isPositiveSafeInteger(
                bets[userId]
            )
    );
}


/*
 * -----------------------------
 * Clear Bets
 * -----------------------------
 */

function clearBets(sessionId) {
    getSession(
        sessionId
    );

    return sessionStore.updateGameData(
        sessionId,
        {
            bets: {},
        }
    );
}


/*
 * -----------------------------
 * Exports
 * -----------------------------
 */

module.exports = {
    placeBet,

    getBets,
    getBet,
    getTotalBets,

    hasPlacedBet,
    allPlayersHaveBets,

    clearBets,
};