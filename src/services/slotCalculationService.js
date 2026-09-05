const {
    AppError,
    ERROR_CODES,
} = require("../errors");


function validateBet(bet) {
    if (
        !Number.isSafeInteger(bet) ||
        bet <= 0
    ) {
        throw new AppError(
            ERROR_CODES.INVALID_BET,
            "Bet must be a positive safe integer."
        );
    }
}


function validateMultiplier(multiplier) {
    if (
        typeof multiplier !== "number" ||
        !Number.isFinite(multiplier) ||
        multiplier < 0
    ) {
        throw new AppError(
            ERROR_CODES.INVALID_INPUT,
            "Invalid payout multiplier."
        );
    }
}


function calculatePayout(
    bet,
    multiplier
) {
    validateBet(bet);
    validateMultiplier(multiplier);

    const payout = Math.floor(
        bet * multiplier
    );

    if (!Number.isSafeInteger(payout)) {
        throw new AppError(
            ERROR_CODES.PAYOUT_TOO_LARGE,
            "Payout exceeds the maximum safe value."
        );
    }

    return {
        bet,
        multiplier,
        payout,
    };
}


module.exports = {
    calculatePayout,
};