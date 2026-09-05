const AppError = require("../errors/AppError");
const errorMessages = require("../errors/errorMessages");
const configurationService = require("./configurationService");
const economyService = require("./economyService");
const {
    isPositiveSafeInteger,
} = require("../validation/validation");

function validateBet(userId, amount) {
    if (!isPositiveSafeInteger(amount)) {
        throw new AppError(
            errorMessages.INVALID_AMOUNT,
            "INVALID_BET"
        );
    }

    const minimumBet =
        configurationService.getMinimumBet();

    if (amount < minimumBet) {
        throw new AppError(
            `The minimum bet is ${minimumBet.toLocaleString()} coins.`,
            "BET_BELOW_MINIMUM"
        );
    }

    const balance =
        economyService.getBalance(userId);

    if (amount > balance) {
        throw new AppError(
            errorMessages.INSUFFICIENT_BALANCE,
            "INSUFFICIENT_BALANCE"
        );
    }

    return {
        userId,
        amount,
        balance,
        minimumBet,
    };
}

module.exports = {
    validateBet,
};