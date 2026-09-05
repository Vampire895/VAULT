const rouletteEngine =
    require("../games/roulette/rouletteEngine");

const economyService =
    require("./economyService");

const configurationService =
    require("./configurationService");

const multiplayerService =
    require("./multiplayerService");


/*
 * -----------------------------
 * Configuration Initialization
 * -----------------------------
 */

let configurationReady = false;

function ensureConfiguration() {
    if (configurationReady) {
        return;
    }

    configurationService.initialize();

    configurationReady = true;
}


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
        !Number.isSafeInteger(amount) ||
        amount <= 0
    ) {
        throw new Error(
            "Invalid roulette bet."
        );
    }
}


function validateBet(bet) {
    if (
        !bet ||
        typeof bet !== "object" ||
        Array.isArray(bet)
    ) {
        throw new Error(
            "Invalid roulette bet."
        );
    }

    const {
        type,
        value,
    } = bet;

    const betTypes =
        rouletteEngine.getBetTypes();

    if (
        !Object.values(betTypes).includes(
            type
        )
    ) {
        throw new Error(
            "Invalid roulette bet type."
        );
    }

    /*
     * Straight bets require a
     * valid roulette number.
     */

    if (
        type ===
        rouletteEngine.BET_TYPES.STRAIGHT
    ) {
        if (
            !Number.isSafeInteger(value) ||
            value < 0 ||
            value > 36
        ) {
            throw new Error(
                "Roulette number must be an integer between 0 and 36."
            );
        }
    }

    /*
     * Non-straight bets do not use
     * a number value.
     */

    if (
        type !==
        rouletteEngine.BET_TYPES.STRAIGHT
    ) {
        return {
            type,
            value: null,
        };
    }

    return {
        type,
        value,
    };
}


/*
 * -----------------------------
 * Minimum Bet
 * -----------------------------
 */

function getMinimumBet() {
    ensureConfiguration();

    return configurationService
        .getMinimumBet();
}


function validateMinimumBet(amount) {
    const minimumBet =
        getMinimumBet();

    if (
        amount < minimumBet
    ) {
        throw new Error(
            `Roulette minimum bet is ${minimumBet}.`
        );
    }
}


/*
 * -----------------------------
 * Roulette Mathematics
 * -----------------------------
 *
 * The engine remains the ONLY
 * authority for roulette math.
 */


/*
 * Calculate payout for a
 * particular roulette result.
 */

function calculatePayout(
    betAmount,
    bet,
    number
) {
    validateBetAmount(
        betAmount
    );

    const validatedBet =
        validateBet(bet);

    return rouletteEngine
        .calculatePayout(
            betAmount,
            validatedBet,
            number
        );
}


/*
 * Resolve a particular bet
 * against an already-generated
 * roulette number.
 */

function resolveBet(
    betAmount,
    bet,
    number
) {
    validateBetAmount(
        betAmount
    );

    const validatedBet =
        validateBet(bet);

    return rouletteEngine
        .resolveBet(
            betAmount,
            validatedBet,
            number
        );
}


/*
 * Generate ONE roulette result.
 *
 * Multiplayer roulette uses this
 * single number for EVERY player
 * in the round.
 */

function spin() {
    return rouletteEngine.spin();
}


/*
 * -----------------------------
 * Multiplayer Session Helpers
 * -----------------------------
 */


/*
 * Create a multiplayer roulette
 * lobby.
 *
 * Roulette uses the shared
 * multiplayer session system.
 */

function createSession(
    hostId,
    options = {}
) {
    validateUserId(
        hostId
    );

    const {
        playerLimit = 6,
        lobbyTimeoutMs,
        roundTimeoutMs,
    } = options;

    return multiplayerService.createSession({
        gameType:
            "roulette",

        hostId,

        playerLimit,

        lobbyTimeoutMs,

        roundTimeoutMs,

        gameData: {
            /*
             * Bets are temporary runtime
             * state and belong inside
             * the multiplayer session.
             */
            bets: {},

            result: null,

            resolved: false,
        },
    });
}


/*
 * Retrieve a multiplayer roulette
 * session.
 */

function getSession(
    sessionId
) {
    return multiplayerService
        .getSession(
            sessionId
        );
}


/*
 * Join roulette lobby.
 */

function joinSession(
    sessionId,
    userId
) {
    validateUserId(
        userId
    );

    return multiplayerService.join(
        sessionId,
        userId
    );
}


/*
 * Leave roulette lobby.
 */

function leaveSession(
    sessionId,
    userId
) {
    validateUserId(
        userId
    );

    return multiplayerService.leave(
        sessionId,
        userId
    );
}


/*
 * Host starts roulette lobby.
 */

function startSession(
    sessionId,
    userId
) {
    validateUserId(
        userId
    );

    return multiplayerService.start(
        sessionId,
        userId
    );
}


/*
 * Cancel roulette lobby.
 */

function cancelSession(
    sessionId,
    userId
) {
    validateUserId(
        userId
    );

    return multiplayerService.cancel(
        sessionId,
        userId
    );
}


/*
 * -----------------------------
 * Multiplayer Betting
 * -----------------------------
 */


/*
 * Place ONE roulette bet for
 * ONE player in the current round.
 *
 * IMPORTANT:
 *
 * Money is withdrawn when the bet
 * is accepted.
 *
 * The actual roulette result is NOT
 * generated here.
 */

function placeBet(
    sessionId,
    userId,
    betAmount,
    bet
) {
    validateUserId(
        userId
    );

    validateBetAmount(
        betAmount
    );

    validateMinimumBet(
        betAmount
    );

    const session =
        multiplayerService
            .getSession(
                sessionId
            );

    if (!session) {
        throw new Error(
            "Multiplayer roulette session not found."
        );
    }

    /*
     * Betting is only allowed during
     * the shared betting phase.
     */

    if (
        session.state !==
        multiplayerService.GAME_STATES.BETTING
    ) {
        throw new Error(
            "Roulette betting is not currently active."
        );
    }

    /*
     * Player must actually belong
     * to this roulette session.
     */

    if (
        !session.players.includes(
            userId
        )
    ) {
        throw new Error(
            "You are not a player in this roulette game."
        );
    }

    const validatedBet =
        validateBet(bet);

    const bets =
        session.gameData?.bets ?? {};

    /*
     * One bet per player per round.
     */

    if (
        bets[userId]
    ) {
        throw new Error(
            "You have already placed your roulette bet for this round."
        );
    }

    /*
     * Withdraw BEFORE storing the bet.
     *
     * If withdrawal fails, the bet
     * never enters the session.
     */

    const balanceAfterBet =
        economyService.withdraw(
            userId,
            betAmount
        );

    /*
     * Store only temporary runtime
     * game state.
     */

    const updatedBets = {
        ...bets,

        [userId]: {
            type:
                validatedBet.type,

            value:
                validatedBet.value,

            amount:
                betAmount,

            balanceAfterBet,
        },
    };

    multiplayerService
        .updateGameData(
            sessionId,
            {
                bets:
                    updatedBets,
            }
        );

    return {
        session:
            multiplayerService
                .getSession(
                    sessionId
                ),

        bet: {
            type:
                validatedBet.type,

            value:
                validatedBet.value,

            amount:
                betAmount,
        },

        balanceAfterBet,
    };
}


/*
 * -----------------------------
 * Betting State
 * -----------------------------
 */


/*
 * Move STARTING → BETTING.
 */

function beginBetting(
    sessionId
) {
    const session =
        multiplayerService
            .getSession(
                sessionId
            );

    if (
        !session
    ) {
        throw new Error(
            "Multiplayer roulette session not found."
        );
    }

    return multiplayerService
        .beginBetting(
            sessionId
        );
}


/*
 * Lock roulette betting.
 *
 * After this point nobody can
 * submit another bet.
 */

function lockBetting(
    sessionId
) {
    const session =
        multiplayerService
            .getSession(
                sessionId
            );

    if (
        !session
    ) {
        throw new Error(
            "Multiplayer roulette session not found."
        );
    }

    return multiplayerService
        .lockRound(
            sessionId
        );
}


/*
 * -----------------------------
 * Multiplayer Resolution
 * -----------------------------
 */


/*
 * Resolve the COMPLETE roulette
 * round.
 *
 * ONE wheel spin is generated.
 *
 * EVERY player's bet is resolved
 * against that SAME number.
 */

function resolveRound(
    sessionId
) {
    const session =
        multiplayerService
            .getSession(
                sessionId
            );

    if (
        !session
    ) {
        throw new Error(
            "Multiplayer roulette session not found."
        );
    }

    /*
     * Only LOCKED rounds may be
     * resolved.
     */

    if (
        session.state !==
        multiplayerService.GAME_STATES.LOCKED
    ) {
        throw new Error(
            "Roulette betting must be locked before resolving."
        );
    }

    /*
     * Enter resolving state BEFORE
     * generating the result.
     *
     * This prevents another resolver
     * from starting the same round.
     */

    multiplayerService
        .beginResolving(
            sessionId
        );

    const bets =
        session.gameData?.bets ?? {};

    /*
     * ONE shared roulette spin.
     */

    const number =
        rouletteEngine.spin();

    const color =
        rouletteEngine.getColor(
            number
        );

    const playerResults = {};

    try {
        /*
         * Resolve every player's bet
         * against the exact same number.
         */

        for (
            const playerId of
            session.players
        ) {
            const playerBet =
                bets[playerId];

            /*
             * A player is allowed to
             * participate in the lobby
             * without betting.
             *
             * No wager means no payout.
             */

            if (!playerBet) {
                playerResults[playerId] = {
                    userId:
                        playerId,

                    bet:
                        null,

                    number,

                    color,

                    won:
                        false,

                    multiplier:
                        0,

                    payout:
                        0,

                    balanceAfterBet:
                        null,

                    balanceAfterPayout:
                        null,
                };

                continue;
            }

            const result =
                rouletteEngine.resolveBet(
                    playerBet.amount,

                    {
                        type:
                            playerBet.type,

                        value:
                            playerBet.value,
                    },

                    number
                );

            let balanceAfterPayout =
                playerBet.balanceAfterBet;

            /*
             * Winning payout already
             * includes the original wager.
             */

            if (
                result.payout > 0
            ) {
                balanceAfterPayout =
                    economyService.deposit(
                        playerId,
                        result.payout
                    );
            }

            playerResults[playerId] = {
                userId:
                    playerId,

                bet:
                    result.bet,

                number:
                    result.number,

                color:
                    result.color,

                won:
                    result.won,

                multiplier:
                    result.multiplier,

                payout:
                    result.payout,

                balanceAfterBet:
                    playerBet.balanceAfterBet,

                balanceAfterPayout,
            };
        }

        /*
         * Store ONE shared result.
         */

        const roundResult = {
            number,

            color,

            players:
                playerResults,
        };

        multiplayerService
            .setResult(
                sessionId,
                roundResult
            );

        return roundResult;
    } catch (error) {
        /*
         * If resolution fails after
         * wagers were withdrawn, refund
         * every accepted wager.
         *
         * Only bets that have not already
         * received a payout are refunded.
         */

        for (
            const playerId of
            session.players
        ) {
            const playerBet =
                bets[playerId];

            if (!playerBet) {
                continue;
            }

            const playerResult =
                playerResults[playerId];

            /*
             * If this player's payout
             * was already deposited,
             * do NOT refund the wager too.
             */

            if (
                playerResult &&
                playerResult.payout > 0
            ) {
                continue;
            }

            try {
                economyService.deposit(
                    playerId,
                    playerBet.amount
                );
            } catch (_) {
                /*
                 * Preserve the original
                 * roulette error.
                 */
            }
        }

        /*
         * End the broken session rather
         * than leaving it stuck in
         * RESOLVING forever.
         */

        try {
            multiplayerService.end(
                sessionId
            );
        } catch (_) {
            // Preserve original error.
        }

        throw error;
    }
}


/*
 * -----------------------------
 * Next Round
 * -----------------------------
 */

function nextRound(
    sessionId
) {
    return multiplayerService
        .nextRound(
            sessionId
        );
}


/*
 * -----------------------------
 * End
 * -----------------------------
 */

function endSession(
    sessionId
) {
    return multiplayerService
        .end(
            sessionId
        );
}


/*
 * -----------------------------
 * Timing
 * -----------------------------
 */

function isLobbyExpired(
    sessionOrId
) {
    return multiplayerService
        .isLobbyExpired(
            sessionOrId
        );
}


function isRoundExpired(
    sessionOrId
) {
    return multiplayerService
        .isRoundExpired(
            sessionOrId
        );
}


function getRemainingRoundTime(
    sessionId
) {
    return multiplayerService
        .getRemainingRoundTime(
            sessionId
        );
}


/*
 * -----------------------------
 * Information
 * -----------------------------
 */

function getWheel() {
    return rouletteEngine.getWheel();
}


function getPayouts() {
    const enginePayouts =
        rouletteEngine.getPayouts();

    const betTypes =
        rouletteEngine.BET_TYPES;

    return {
        STRAIGHT:
            enginePayouts[
                betTypes.STRAIGHT
            ],

        RED:
            enginePayouts[
                betTypes.RED
            ],

        BLACK:
            enginePayouts[
                betTypes.BLACK
            ],

        ODD:
            enginePayouts[
                betTypes.ODD
            ],

        EVEN:
            enginePayouts[
                betTypes.EVEN
            ],

        LOW:
            enginePayouts[
                betTypes.LOW
            ],

        HIGH:
            enginePayouts[
                betTypes.HIGH
            ],

        DOZEN_1:
            enginePayouts[
                betTypes.DOZEN_1
            ],

        DOZEN_2:
            enginePayouts[
                betTypes.DOZEN_2
            ],

        DOZEN_3:
            enginePayouts[
                betTypes.DOZEN_3
            ],

        COLUMN_1:
            enginePayouts[
                betTypes.COLUMN_1
            ],

        COLUMN_2:
            enginePayouts[
                betTypes.COLUMN_2
            ],

        COLUMN_3:
            enginePayouts[
                betTypes.COLUMN_3
            ],
    };
}


function getBetTypes() {
    return rouletteEngine.getBetTypes();
}


function getHouseEdge() {
    return rouletteEngine.getHouseEdge();
}


function getRTP() {
    return rouletteEngine.getRTP();
}


function getColor(number) {
    return rouletteEngine.getColor(
        number
    );
}


function isWinningBet(
    bet,
    number
) {
    const validatedBet =
        validateBet(bet);

    return rouletteEngine
        .isWinningBet(
            validatedBet,
            number
        );
}


/*
 * -----------------------------
 * Exports
 * -----------------------------
 */

module.exports = {

    /*
     * Multiplayer roulette
     */

    createSession,
    getSession,

    joinSession,
    leaveSession,

    startSession,
    cancelSession,

    beginBetting,
    lockBetting,

    placeBet,

    resolveRound,

    nextRound,
    endSession,

    isLobbyExpired,
    isRoundExpired,
    getRemainingRoundTime,


    /*
     * Roulette mathematics
     */

    spin,

    calculatePayout,
    resolveBet,

    getWheel,
    getPayouts,
    getBetTypes,

    getHouseEdge,
    getRTP,

    getColor,
    isWinningBet,

    getMinimumBet,
};