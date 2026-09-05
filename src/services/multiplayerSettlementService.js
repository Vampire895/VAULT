const repository =
    require("../database/repository");

const userRepository =
    require("../database/userRepository");

const multiplayerEngine =
    require("../games/multiplayer/multiplayerEngine");

const sessionStore =
    require("../games/multiplayer/multiplayerSessionStore");

const {
    GAME_STATES,
} = sessionStore;


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


function validateSessionId(sessionId) {
    if (
        typeof sessionId !== "string" ||
        sessionId.trim() === ""
    ) {
        throw new Error(
            "Session ID is required."
        );
    }
}


function validatePayouts(payouts) {
    if (
        !payouts ||
        typeof payouts !== "object" ||
        Array.isArray(payouts)
    ) {
        throw new Error(
            "Invalid multiplayer payouts."
        );
    }

    for (
        const [
            userId,
            amount,
        ]
        of Object.entries(payouts)
    ) {
        validateUserId(
            userId
        );

        if (
            !Number.isSafeInteger(
                amount
            ) ||
            amount < 0
        ) {
            throw new Error(
                "Invalid multiplayer payout amount."
            );
        }
    }
}


/*
 * -----------------------------
 * Session
 * -----------------------------
 */

function getSession(sessionId) {
    validateSessionId(
        sessionId
    );

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


function validateSettlementState(
    session
) {
    if (
        session.state !==
            GAME_STATES.RESOLVING &&
        session.state !==
            GAME_STATES.LOCKED &&
        session.state !==
            GAME_STATES.RESULT
    ) {
        throw new Error(
            "This multiplayer session cannot be settled right now."
        );
    }
}


/*
 * -----------------------------
 * Settlement State
 * -----------------------------
 */

function hasBeenSettled(
    session
) {
    return (
        session.gameData?.settled === true
    );
}


/*
 * -----------------------------
 * Settlement Snapshot
 * -----------------------------
 */

function snapshotSettlementState(
    session
) {
    return {
        settled:
            session.gameData?.settled ??
            false,

        settlement:
            session.gameData?.settlement ??
            null,
    };
}


function restoreSettlementState(
    sessionId,
    snapshot
) {
    sessionStore.updateGameData(
        sessionId,
        {
            settled:
                snapshot.settled,

            settlement:
                snapshot.settlement,
        }
    );
}


/*
 * -----------------------------
 * Settlement
 * -----------------------------
 */

function settle(
    sessionId,
    payouts
) {
    const session =
        getSession(
            sessionId
        );

    validateSettlementState(
        session
    );

    validatePayouts(
        payouts
    );

    if (
        hasBeenSettled(
            session
        )
    ) {
        throw new Error(
            "This multiplayer session has already been settled."
        );
    }

    /*
     * Every payout recipient must
     * actually belong to this session.
     */
    for (
        const userId
        of Object.keys(payouts)
    ) {
        if (
            !session.players.includes(
                userId
            )
        ) {
            throw new Error(
                "Payout recipient is not a player in this game."
            );
        }
    }

    const totalPayout =
        Object.values(
            payouts
        ).reduce(
            (
                total,
                amount
            ) =>
                total + amount,
            0
        );

    if (
        !Number.isSafeInteger(
            totalPayout
        )
    ) {
        throw new Error(
            "Total multiplayer payout exceeds the safe integer limit."
        );
    }

    /*
     * Snapshot RAM settlement state.
     */
    const previousState =
        snapshotSettlementState(
            session
        );

    /*
     * Mark the session as settled
     * BEFORE touching balances.
     *
     * This prevents a second settlement
     * from entering while this settlement
     * operation is in progress.
     *
     * If the SQLite transaction fails,
     * this state is restored.
     */
    sessionStore.updateGameData(
        sessionId,
        {
            settled:
                true,

            settlement: {
                payouts: {
                    ...payouts,
                },

                totalPayout,

                settledAt:
                    Date.now(),
            },
        }
    );

    try {
        /*
         * Perform every balance change
         * inside ONE SQLite transaction.
         */
        const result =
            repository.transaction(() => {
                const settlements = [];

                for (
                    const [
                        userId,
                        amount,
                    ]
                    of Object.entries(
                        payouts
                    )
                ) {
                    if (
                        amount === 0
                    ) {
                        continue;
                    }

                    const settlement =
                        userRepository
                            .addBalanceInTransaction(
                                userId,
                                amount
                            );

                    settlements.push({
                        userId,

                        amount,

                        balanceBefore:
                            settlement.balanceBefore,

                        balanceAfter:
                            settlement.balanceAfter,
                    });
                }

                return {
                    settlements,
                };
            });

        /*
         * The SQLite transaction has
         * successfully committed.
         *
         * The session was already marked
         * settled, so duplicate payout
         * attempts are now blocked.
         */
        const updatedSession =
            getSession(
                sessionId
            );

        return {
            session:
                updatedSession,

            payouts: {
                ...payouts,
            },

            totalPayout,

            settlements:
                result.settlements,
        };

    } catch (error) {
        /*
         * SQLite failed.
         *
         * Restore the previous RAM state
         * so the session does not become
         * permanently marked as settled
         * when no payout was committed.
         */
        try {
            restoreSettlementState(
                sessionId,
                previousState
            );
        } catch {
            /*
             * Preserve the original error.
             */
        }

        throw error;
    }
}


/*
 * -----------------------------
 * Settlement Status
 * -----------------------------
 */

function getSettlement(
    sessionId
) {
    const session =
        getSession(
            sessionId
        );

    if (
        !hasBeenSettled(
            session
        )
    ) {
        return null;
    }

    return (
        session.gameData
            ?.settlement ||
        null
    );
}


/*
 * -----------------------------
 * Exports
 * -----------------------------
 */

module.exports = {
    settle,
    hasBeenSettled,
    getSettlement,
};