const repository = require("../database/repository");
const userRepository = require("../database/userRepository");
const coinflipEngine = require("../games/coinflip/coinflipEngine");
const slotCalculationService = require("./slotCalculationService");

const {
    AppError,
    ERROR_CODES,
} = require("../errors");

function play(userId, bet, choice) {
    if (!userId) {
        throw new AppError(
            ERROR_CODES.INVALID_INPUT,
            "User ID is required."
        );
    }

    return repository.transaction(() => {
        const account =
            userRepository.findById(userId);

        if (!account) {
            throw new AppError(
                ERROR_CODES.ACCOUNT_NOT_FOUND
            );
        }

        if (
            !Number.isSafeInteger(bet) ||
            bet <= 0
        ) {
            throw new AppError(
                ERROR_CODES.INVALID_BET
            );
        }

        if (account.balance < bet) {
            throw new AppError(
                ERROR_CODES.INSUFFICIENT_BALANCE
            );
        }

        const result =
            coinflipEngine.flip(choice);

        const payoutResult =
            slotCalculationService.calculatePayout(
                bet,
                result.multiplier
            );

        userRepository.deductBalanceInTransaction(
            userId,
            bet
        );

        if (payoutResult.payout > 0) {
            userRepository.addBalanceInTransaction(
                userId,
                payoutResult.payout
            );
        }

        const finalAccount =
            userRepository.findById(userId);

        return {
            ...result,
            bet,
            payout: payoutResult.payout,
            balanceBefore: account.balance,
            balanceAfter: finalAccount.balance,
        };
    });
}

module.exports = {
    play,
};