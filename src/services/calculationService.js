const AppError = require("../errors/AppError");

function validateHouseEdge(houseEdge) {
    if (
        typeof houseEdge !== "number" ||
        !Number.isFinite(houseEdge) ||
        houseEdge < 0 ||
        houseEdge >= 1
    ) {
        throw new AppError(
            "Invalid House Edge.",
            "INVALID_HOUSE_EDGE"
        );
    }
}

function calculateDoubleOrNothingProbability(
    houseEdge
) {
    validateHouseEdge(houseEdge);

    return (1 - houseEdge) / 2;
}

function calculateDoubleOrNothingExpectedReturn(
    bet,
    winProbability
) {
    if (
        !Number.isSafeInteger(bet) ||
        bet <= 0
    ) {
        throw new AppError(
            "Invalid bet.",
            "INVALID_BET"
        );
    }

    if (
        typeof winProbability !== "number" ||
        !Number.isFinite(winProbability) ||
        winProbability < 0 ||
        winProbability > 1
    ) {
        throw new AppError(
            "Invalid win probability.",
            "INVALID_PROBABILITY"
        );
    }

    return winProbability * (2 * bet);
}

function calculateRTP(
    expectedPayout,
    totalWagered
) {
    if (
        typeof expectedPayout !== "number" ||
        !Number.isFinite(expectedPayout) ||
        expectedPayout < 0
    ) {
        throw new AppError(
            "Invalid expected payout.",
            "INVALID_EXPECTED_PAYOUT"
        );
    }

    if (
        typeof totalWagered !== "number" ||
        !Number.isFinite(totalWagered) ||
        totalWagered <= 0
    ) {
        throw new AppError(
            "Invalid total wagered.",
            "INVALID_TOTAL_WAGERED"
        );
    }

    return expectedPayout / totalWagered;
}

function calculateHouseEdge(rtp) {
    if (
        typeof rtp !== "number" ||
        !Number.isFinite(rtp) ||
        rtp < 0 ||
        rtp > 1
    ) {
        throw new AppError(
            "Invalid RTP.",
            "INVALID_RTP"
        );
    }

    return 1 - rtp;
}

/*
 * --------------------------------
 * Mines
 * --------------------------------
 *
 * Mines uses a 3 × 3 board.
 *
 * The multiplier is based on the
 * probability of successfully
 * revealing the next safe tile.
 *
 * House edge:
 * 6%
 *
 * Therefore:
 *
 * RTP = 94%
 *
 * Fair multiplier for the current
 * successful position:
 *
 * 0.94 / probability of reaching
 * that position
 *
 * This keeps the game mathematically
 * consistent instead of hardcoding
 * arbitrary multipliers.
 */

function calculateMinesMultiplier(
    boardSize,
    mines,
    safeReveals,
    houseEdge = 0.06
) {
    if (
        !Number.isSafeInteger(boardSize) ||
        boardSize <= 0
    ) {
        throw new AppError(
            "Invalid Mines board size.",
            "INVALID_MINES_BOARD"
        );
    }

    if (
        !Number.isSafeInteger(mines) ||
        mines <= 0 ||
        mines >= boardSize
    ) {
        throw new AppError(
            "Invalid Mines count.",
            "INVALID_MINES_COUNT"
        );
    }

    if (
        !Number.isSafeInteger(safeReveals) ||
        safeReveals < 0 ||
        safeReveals >
            boardSize - mines
    ) {
        throw new AppError(
            "Invalid Mines safe reveal count.",
            "INVALID_MINES_REVEALS"
        );
    }

    validateHouseEdge(houseEdge);

    /*
     * No successful reveal yet.
     */
    if (safeReveals === 0) {
        return 1;
    }

    /*
     * Probability that the first
     * `safeReveals` selected tiles
     * are all safe.
     *
     * Example:
     *
     * 9 tiles / 3 mines
     *
     * First safe:
     * 6 / 9
     *
     * Second safe:
     * 5 / 8
     *
     * Third safe:
     * 4 / 7
     *
     * etc.
     */
    let probability = 1;

    for (
        let i = 0;
        i < safeReveals;
        i++
    ) {
        const safeTiles =
            boardSize -
            mines -
            i;

        const remainingTiles =
            boardSize - i;

        probability *=
            safeTiles /
            remainingTiles;
    }

    if (
        probability <= 0 ||
        !Number.isFinite(probability)
    ) {
        throw new AppError(
            "Unable to calculate Mines probability.",
            "MINES_PROBABILITY_ERROR"
        );
    }

    const multiplier =
        (1 - houseEdge) /
        probability;

    if (
        !Number.isFinite(multiplier) ||
        multiplier <= 0
    ) {
        throw new AppError(
            "Unable to calculate Mines multiplier.",
            "MINES_MULTIPLIER_ERROR"
        );
    }

    /*
     * Keep the displayed multiplier
     * clean without destroying the
     * underlying probability too much.
     */
    return Number(
        multiplier.toFixed(2)
    );
}


function calculateMinesPayout(
    bet,
    multiplier
) {
    if (
        !Number.isSafeInteger(bet) ||
        bet <= 0
    ) {
        throw new AppError(
            "Invalid Mines bet.",
            "INVALID_MINES_BET"
        );
    }

    if (
        typeof multiplier !== "number" ||
        !Number.isFinite(multiplier) ||
        multiplier < 1
    ) {
        throw new AppError(
            "Invalid Mines multiplier.",
            "INVALID_MINES_MULTIPLIER"
        );
    }

    const payout =
        Math.floor(
            bet * multiplier
        );

    if (
        !Number.isSafeInteger(payout)
    ) {
        throw new AppError(
            "Mines payout exceeds the maximum safe value.",
            "MINES_PAYOUT_OVERFLOW"
        );
    }

    return payout;
}

/*
 * --------------------------------
 * Crash
 * --------------------------------
 *
 * Generates the predetermined crash
 * point for a round.
 *
 * House edge:
 * 5%
 *
 * RTP:
 * 95%
 *
 * The crash point is generated ONCE
 * when the round starts.
 *
 * It must NEVER depend on:
 * - user identity
 * - bet size
 * - previous results
 * - streaks
 * - animation timing
 * - cash-out timing
 */

function calculateCrashPoint(
    randomFloat,
    houseEdge = 0.05
) {
    validateHouseEdge(houseEdge);

    if (
        typeof randomFloat !== "number" ||
        !Number.isFinite(randomFloat) ||
        randomFloat < 0 ||
        randomFloat >= 1
    ) {
        throw new AppError(
            "Invalid Crash random value.",
            "INVALID_CRASH_RANDOM"
        );
    }

    const random =
        Math.max(
            Number.EPSILON,
            randomFloat
        );

    const rtp =
        1 - houseEdge;

    const crashPoint =
        rtp / random;

    return Math.max(
        1,
        Number(
            crashPoint.toFixed(2)
        )
    );
}

/*
 * --------------------------------
 * Crash
 * --------------------------------
 *
 * Crash uses a 5% house edge.
 *
 * RTP:
 * 95%
 *
 * The crash point is generated once
 * when the game starts.
 *
 * The multiplier shown to the player
 * is only the current progression.
 *
 * The actual crash result MUST NOT
 * depend on animation timing.
 */

function calculateCrashPayout(
    bet,
    multiplier
) {
    if (
        !Number.isSafeInteger(bet) ||
        bet <= 0
    ) {
        throw new AppError(
            "Invalid Crash bet.",
            "INVALID_CRASH_BET"
        );
    }

    if (
        typeof multiplier !== "number" ||
        !Number.isFinite(multiplier) ||
        multiplier < 1
    ) {
        throw new AppError(
            "Invalid Crash multiplier.",
            "INVALID_CRASH_MULTIPLIER"
        );
    }

    const payout =
        Math.floor(
            bet * multiplier
        );

    if (
        !Number.isSafeInteger(payout)
    ) {
        throw new AppError(
            "Crash payout exceeds the maximum safe value.",
            "CRASH_PAYOUT_OVERFLOW"
        );
    }

    return payout;
}

module.exports = {
    calculateDoubleOrNothingProbability,
    calculateDoubleOrNothingExpectedReturn,
    calculateRTP,
    calculateHouseEdge,
    calculateMinesMultiplier,
    calculateMinesPayout,
    calculateCrashPoint,
    calculateCrashPayout,
};