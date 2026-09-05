const rngService =
    require("../../services/rngService");

const calculationService =
    require("../../services/calculationService");


const HOUSE_EDGE = 0.05;


/*
 * --------------------------------
 * Constants
 * --------------------------------
 */

const START_MULTIPLIER = 1.00;

const MULTIPLIER_STEP_MS = 100;


/*
 * --------------------------------
 * Crash Point
 * --------------------------------
 *
 * Generated exactly once per round.
 *
 * The result is completely independent
 * of the player's identity, bet amount,
 * previous games, or cash-out timing.
 */

function generateCrashPoint() {

    const randomValue =
        rngService.randomFloat();

    return calculationService
        .calculateCrashPoint(
            randomValue,
            HOUSE_EDGE
        );
}


/*
 * --------------------------------
 * Live Multiplier
 * --------------------------------
 *
 * Time-based progression.
 *
 * The Discord UI is only a visual
 * representation.
 *
 * The server remains authoritative.
 */

function calculateMultiplier(
    startedAt,
    now = Date.now()
) {

    if (!Number.isFinite(startedAt)) {
        throw new Error(
            "Invalid Crash start time."
        );
    }

    if (!Number.isFinite(now)) {
        throw new Error(
            "Invalid Crash current time."
        );
    }

    const elapsed =
        Math.max(
            0,
            now - startedAt
        );

    /*
     * Increase by 0.1x every 100ms.
     *
     * 0ms    → 1.00x
     * 100ms  → 1.10x
     * 200ms  → 1.20x
     * 300ms  → 1.30x
     * etc.
     */

    const steps =
        Math.floor(
            elapsed / 100
        );

    const multiplier =
        START_MULTIPLIER +
        (steps * 0.10);

    return Number(
        multiplier.toFixed(2)
    );
}


/*
 * --------------------------------
 * Round State
 * --------------------------------
 */

function getState(
    game,
    now = Date.now()
) {

    if (!game) {
        throw new Error(
            "Crash game is required."
        );
    }


    const multiplier =
        Math.min(
            game.crashPoint,
            calculateMultiplier(
                game.startedAt,
                now
            )
        );


    const crashed =
        multiplier >=
        game.crashPoint;


    return {
        multiplier,

        crashed,

        crashPoint:
            game.crashPoint,
    };
}


/*
 * --------------------------------
 * Exports
 * --------------------------------
 */

module.exports = {
    HOUSE_EDGE,

    START_MULTIPLIER,

    MULTIPLIER_STEP_MS,

    generateCrashPoint,

    calculateMultiplier,

    getState,
};