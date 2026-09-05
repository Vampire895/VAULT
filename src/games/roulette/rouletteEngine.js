const rngService =
    require("../../services/rngService");


/*
 * -----------------------------
 * European Roulette Wheel
 * -----------------------------
 *
 * Single-zero European wheel.
 *
 * Numbers:
 * 0–36
 *
 * 37 total pockets.
 */

const WHEEL = Object.freeze([
    0,
    32, 15, 19, 4, 21, 2, 25, 17, 34,
    6, 27, 13, 36, 11, 30, 8, 23, 10,
    5, 24, 16, 33, 1, 20, 14, 31, 9, 22,
    18, 29, 7, 28, 12, 35, 3, 26,
]);


/*
 * -----------------------------
 * European Roulette Colors
 * -----------------------------
 */

const RED_NUMBERS = new Set([
    1, 3, 5, 7, 9,
    12, 14, 16, 18,
    19, 21, 23, 25, 27,
    30, 32, 34, 36,
]);


/*
 * -----------------------------
 * Bet Types
 * -----------------------------
 */

const BET_TYPES = Object.freeze({
    STRAIGHT: "straight",

    RED: "red",
    BLACK: "black",

    ODD: "odd",
    EVEN: "even",

    LOW: "low",
    HIGH: "high",

    DOZEN_1: "dozen_1",
    DOZEN_2: "dozen_2",
    DOZEN_3: "dozen_3",

    COLUMN_1: "column_1",
    COLUMN_2: "column_2",
    COLUMN_3: "column_3",
});


/*
 * -----------------------------
 * Standard European Payouts
 * -----------------------------
 *
 * These are NET payouts.
 *
 * Example:
 *
 * 100 on Red
 * 1:1 payout
 * total return = 200
 *
 * 100 on Straight
 * 35:1 payout
 * total return = 3600
 */

const PAYOUTS = Object.freeze({
    [BET_TYPES.STRAIGHT]: 35,

    [BET_TYPES.RED]: 1,
    [BET_TYPES.BLACK]: 1,

    [BET_TYPES.ODD]: 1,
    [BET_TYPES.EVEN]: 1,

    [BET_TYPES.LOW]: 1,
    [BET_TYPES.HIGH]: 1,

    [BET_TYPES.DOZEN_1]: 2,
    [BET_TYPES.DOZEN_2]: 2,
    [BET_TYPES.DOZEN_3]: 2,

    [BET_TYPES.COLUMN_1]: 2,
    [BET_TYPES.COLUMN_2]: 2,
    [BET_TYPES.COLUMN_3]: 2,
});


/*
 * -----------------------------
 * Validation
 * -----------------------------
 */

function validateNumber(number) {
    if (
        !Number.isSafeInteger(number) ||
        number < 0 ||
        number > 36
    ) {
        throw new Error(
            "Roulette number must be an integer between 0 and 36."
        );
    }
}


function validateBetType(type) {
    if (
        typeof type !== "string" ||
        !Object.values(BET_TYPES).includes(type)
    ) {
        throw new Error(
            "Invalid roulette bet type."
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

    validateBetType(type);

    /*
     * Only Straight requires a number.
     */

    if (
        type === BET_TYPES.STRAIGHT
    ) {
        validateNumber(value);
    }

    return {
        type,

        value:
            value ?? null,
    };
}


function validateBetAmount(
    betAmount
) {
    if (
        !Number.isSafeInteger(betAmount) ||
        betAmount <= 0
    ) {
        throw new Error(
            "Roulette bet amount must be a positive safe integer."
        );
    }
}


/*
 * -----------------------------
 * Color
 * -----------------------------
 */

function getColor(number) {
    validateNumber(number);

    if (
        number === 0
    ) {
        return "green";
    }

    return RED_NUMBERS.has(number)
        ? "red"
        : "black";
}


/*
 * -----------------------------
 * Even / Odd
 * -----------------------------
 */

function isOdd(number) {
    validateNumber(number);

    /*
     * Zero is neither odd nor even
     * in roulette betting.
     */

    return (
        number !== 0 &&
        number % 2 === 1
    );
}


function isEven(number) {
    validateNumber(number);

    /*
     * Zero is neither odd nor even
     * in roulette betting.
     */

    return (
        number !== 0 &&
        number % 2 === 0
    );
}


/*
 * -----------------------------
 * Low / High
 * -----------------------------
 */

function isLow(number) {
    validateNumber(number);

    return (
        number >= 1 &&
        number <= 18
    );
}


function isHigh(number) {
    validateNumber(number);

    return (
        number >= 19 &&
        number <= 36
    );
}


/*
 * -----------------------------
 * Dozens
 * -----------------------------
 */

function isDozen(
    number,
    dozen
) {
    validateNumber(number);

    if (
        !Number.isSafeInteger(dozen) ||
        dozen < 1 ||
        dozen > 3
    ) {
        throw new Error(
            "Dozen must be 1, 2, or 3."
        );
    }

    /*
     * Zero belongs to no dozen.
     */

    if (
        number === 0
    ) {
        return false;
    }

    const start =
        (dozen - 1) * 12 + 1;

    const end =
        dozen * 12;

    return (
        number >= start &&
        number <= end
    );
}


/*
 * -----------------------------
 * Columns
 * -----------------------------
 */

function isColumn(
    number,
    column
) {
    validateNumber(number);

    if (
        !Number.isSafeInteger(column) ||
        column < 1 ||
        column > 3
    ) {
        throw new Error(
            "Column must be 1, 2, or 3."
        );
    }

    /*
     * Zero belongs to no column.
     */

    if (
        number === 0
    ) {
        return false;
    }

    /*
     * European roulette columns:
     *
     * Column 1:
     * 1, 4, 7, 10, ...
     *
     * Column 2:
     * 2, 5, 8, 11, ...
     *
     * Column 3:
     * 3, 6, 9, 12, ...
     */

    return (
        number % 3 ===
        column % 3
    );
}


/*
 * -----------------------------
 * Winning Bet
 * -----------------------------
 */

function isWinningBet(
    bet,
    number
) {
    validateNumber(number);

    const validatedBet =
        validateBet(bet);

    const {
        type,
        value,
    } = validatedBet;

    switch (type) {
        case BET_TYPES.STRAIGHT:
            return number === value;

        case BET_TYPES.RED:
            return getColor(number) === "red";

        case BET_TYPES.BLACK:
            return getColor(number) === "black";

        case BET_TYPES.ODD:
            return isOdd(number);

        case BET_TYPES.EVEN:
            return isEven(number);

        case BET_TYPES.LOW:
            return isLow(number);

        case BET_TYPES.HIGH:
            return isHigh(number);

        case BET_TYPES.DOZEN_1:
            return isDozen(number, 1);

        case BET_TYPES.DOZEN_2:
            return isDozen(number, 2);

        case BET_TYPES.DOZEN_3:
            return isDozen(number, 3);

        case BET_TYPES.COLUMN_1:
            return isColumn(number, 1);

        case BET_TYPES.COLUMN_2:
            return isColumn(number, 2);

        case BET_TYPES.COLUMN_3:
            return isColumn(number, 3);

        default:
            return false;
    }
}


/*
 * -----------------------------
 * Payout Calculation
 * -----------------------------
 *
 * Returns TOTAL amount returned.
 *
 * The returned amount includes
 * the original wager.
 *
 * Example:
 *
 * 100 on Red
 * multiplier = 1
 * payout = 200
 *
 * 100 on Straight
 * multiplier = 35
 * payout = 3600
 */

function calculatePayout(
    betAmount,
    bet,
    number
) {
    validateBetAmount(
        betAmount
    );

    validateNumber(
        number
    );

    const validatedBet =
        validateBet(bet);

    if (
        !isWinningBet(
            validatedBet,
            number
        )
    ) {
        return 0;
    }

    const multiplier =
        PAYOUTS[
            validatedBet.type
        ];

    const payout =
        betAmount *
        (multiplier + 1);

    if (
        !Number.isSafeInteger(payout)
    ) {
        throw new Error(
            "Roulette payout exceeds the maximum safe value."
        );
    }

    return payout;
}


/*
 * -----------------------------
 * Spin
 * -----------------------------
 *
 * One RNG call.
 *
 * No player identity,
 * balance,
 * streak,
 * history,
 * or previous result
 * influences the outcome.
 */

function spin() {
    const index =
        rngService.randomInt(
            0,
            WHEEL.length - 1
        );

    return WHEEL[index];
}


/*
 * -----------------------------
 * Resolve Bet
 * -----------------------------
 *
 * Resolves a previously spun
 * roulette number.
 *
 * This is intentionally separate
 * from multiplayer/session logic.
 */

function resolveBet(
    betAmount,
    bet,
    number
) {
    validateBetAmount(
        betAmount
    );

    validateNumber(
        number
    );

    const validatedBet =
        validateBet(bet);

    const won =
        isWinningBet(
            validatedBet,
            number
        );

    const payout =
        won
            ? calculatePayout(
                  betAmount,
                  validatedBet,
                  number
              )
            : 0;

    return {
        bet: {
            type:
                validatedBet.type,

            value:
                validatedBet.value,

            amount:
                betAmount,
        },

        number,

        color:
            getColor(number),

        won,

        multiplier:
            won
                ? PAYOUTS[
                      validatedBet.type
                  ]
                : 0,

        payout,
    };
}


/*
 * -----------------------------
 * Single Spin Helper
 * -----------------------------
 *
 * This remains for compatibility
 * with lower-level callers/tests.
 *
 * Multiplayer Roulette should NOT
 * use this to manage players or
 * balances. The Roulette Service
 * handles that.
 */

function play(
    betAmount,
    bet
) {
    validateBetAmount(
        betAmount
    );

    const number =
        spin();

    return resolveBet(
        betAmount,
        bet,
        number
    );
}


/*
 * -----------------------------
 * Information
 * -----------------------------
 */

function getWheel() {
    return [
        ...WHEEL,
    ];
}


function getPayouts() {
    return {
        ...PAYOUTS,
    };
}


function getBetTypes() {
    return {
        ...BET_TYPES,
    };
}


/*
 * -----------------------------
 * European Roulette Mathematics
 * -----------------------------
 *
 * 37 pockets:
 *
 * 36 winning numbers for
 * even-money bets.
 *
 * RTP:
 *
 * 36 / 37
 * = 97.297297...%
 *
 * House Edge:
 *
 * 1 / 37
 * = 2.702702...%
 */

function getHouseEdge() {
    return 1 / 37;
}


function getRTP() {
    return 36 / 37;
}


/*
 * -----------------------------
 * Exports
 * -----------------------------
 */

module.exports = {
    BET_TYPES,
    PAYOUTS,

    getWheel,
    getBetTypes,
    getPayouts,

    getColor,

    isOdd,
    isEven,
    isLow,
    isHigh,
    isDozen,
    isColumn,

    isWinningBet,
    calculatePayout,

    spin,
    resolveBet,
    play,

    getHouseEdge,
    getRTP,
};