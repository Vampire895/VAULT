const crashEngine =
    require("../games/crash/crashEngine");

const economyService =
    require("./economyService");

const calculationService =
    require("./calculationService");

const {
    AppError,
    ERROR_CODES,
} = require("../errors");


/*
 * --------------------------------
 * Runtime State
 * --------------------------------
 */

const activeGames =
    new Map();


/*
 * --------------------------------
 * Constants
 * --------------------------------
 */

const INACTIVITY_TIMEOUT_MS =
    3 * 60 * 1000;


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
        throw new AppError(
            ERROR_CODES.INVALID_INPUT,
            "User ID is required."
        );
    }
}


function validateBet(bet) {

    if (
        !Number.isSafeInteger(bet) ||
        bet <= 0
    ) {
        throw new AppError(
            ERROR_CODES.INVALID_BET,
            "Invalid Crash bet."
        );
    }
}


/*
 * --------------------------------
 * Get Game
 * --------------------------------
 */

function getGame(userId) {

    validateUserId(userId);

    return activeGames.get(userId) || null;
}


/*
 * --------------------------------
 * Start
 * --------------------------------
 */

function start(
    userId,
    bet
) {

    validateUserId(userId);
    validateBet(bet);

    if (
        activeGames.has(userId)
    ) {
        throw new AppError(
            ERROR_CODES.GAME_ALREADY_ACTIVE
        );
    }


    /*
     * Generate the crash point BEFORE
     * taking the player's money.
     *
     * This keeps game creation
     * deterministic and avoids a
     * half-created game.
     */

    const crashPoint =
        crashEngine.generateCrashPoint();


    /*
     * Withdraw wager through the
     * centralized Economy Service.
     */

    economyService.withdraw(
        userId,
        bet
    );


    const now =
        Date.now();


    const game = {
        userId,

        bet,

        crashPoint,

        startedAt:
            now,

        lastActivityAt:
            now,

        state:
            "active",
    };


    activeGames.set(
        userId,
        game
    );


    return getPublicGame(
        game
    );
}


/*
 * --------------------------------
 * Public Game
 * --------------------------------
 */

function getPublicGame(
    game
) {

    const state =
        crashEngine.getState(
            game
        );


    return {
        userId:
            game.userId,

        bet:
            game.bet,

        startedAt:
            game.startedAt,

        lastActivityAt:
            game.lastActivityAt,

        multiplier:
            state.multiplier,

        state:
            game.state,
    };
}


/*
 * --------------------------------
 * Current State
 * --------------------------------
 */

function getCurrentState(
    userId
) {

    const game =
        activeGames.get(
            userId
        );

    if (!game) {
        throw new AppError(
            ERROR_CODES.GAME_NOT_ACTIVE
        );
    }


    const now =
        Date.now();


    /*
     * Inactivity check.
     */

    if (
        now -
        game.lastActivityAt >=
        INACTIVITY_TIMEOUT_MS
    ) {

        game.state =
            "expired";

        activeGames.delete(
            userId
        );

        return {
            ...getPublicGame(game),

            multiplier:
                crashEngine
                    .calculateMultiplier(
                        game.startedAt,
                        now
                    ),

            state:
                "expired",
        };
    }


    const state =
        crashEngine.getState(
            game,
            now
        );


    /*
     * Automatic crash.
     */

    if (
        state.crashed
    ) {

        game.state =
            "crashed";

        activeGames.delete(
            userId
        );

        return {
            ...getPublicGame(game),

            multiplier:
                game.crashPoint,

            state:
                "crashed",
        };
    }


    return {
        ...getPublicGame(game),

        multiplier:
            state.multiplier,

        state:
            "active",
    };
}


/*
 * --------------------------------
 * Activity
 * --------------------------------
 */

function touch(
    userId
) {

    const game =
        activeGames.get(
            userId
        );

    if (!game) {
        return;
    }

    game.lastActivityAt =
        Date.now();
}


/*
 * --------------------------------
 * Cash Out
 * --------------------------------
 */

function cashOut(
    userId
) {

    const game =
        activeGames.get(
            userId
        );

    if (!game) {
        throw new AppError(
            ERROR_CODES.GAME_NOT_ACTIVE
        );
    }


    /*
     * Check the authoritative
     * server state BEFORE paying.
     */

    const state =
        getCurrentState(
            userId
        );


    if (
        state.state ===
        "crashed"
    ) {
        throw new AppError(
            ERROR_CODES.INVALID_GAME_ACTION,
            "Too late. The Crash already happened."
        );
    }


    if (
        state.state ===
        "expired"
    ) {
        throw new AppError(
            ERROR_CODES.GAME_EXPIRED,
            "This Crash game expired after 3 minutes of inactivity."
        );
    }


    const multiplier =
        state.multiplier;


    const payout =
        calculationService
            .calculateCrashPayout(
                game.bet,
                multiplier
            );


    /*
     * Pay exactly once.
     */

    economyService.deposit(
        userId,
        payout
    );


    /*
     * Remove the active game
     * immediately after settlement.
     */

    activeGames.delete(
        userId
    );


    return {
        cashedOut:
            true,

        bet:
            game.bet,

        multiplier,

        payout,

        state:
            "cashed_out",
    };
}


/*
 * --------------------------------
 * Force Crash
 * --------------------------------
 *
 * Used by the command runtime when
 * the calculated crash point is reached.
 */

function resolve(
    userId
) {

    const game =
        activeGames.get(
            userId
        );

    if (!game) {
        return null;
    }


    const state =
        getCurrentState(
            userId
        );


    if (
        state.state !==
        "crashed"
    ) {
        return null;
    }


    return {
        crashed:
            true,

        bet:
            game.bet,

        multiplier:
            game.crashPoint,

        payout:
            0,

        state:
            "crashed",
    };
}


/*
 * --------------------------------
 * Exports
 * --------------------------------
 */

module.exports = {
    INACTIVITY_TIMEOUT_MS,

    start,
    getGame,
    getCurrentState,
    touch,
    cashOut,
    resolve,
};