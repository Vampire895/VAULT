const repository =
    require("../database/repository");

const userRepository =
    require("../database/userRepository");

const slotGameService =
    require("./slotGameService");

const {
    AppError,
    ERROR_CODES,
} = require("../errors");


function play(
    userId,
    machineId,
    bet
) {
    if (!userId) {
        throw new AppError(
            ERROR_CODES.INVALID_INPUT,
            "User ID is required."
        );
    }

    return repository.transaction(() => {
        const account =
            userRepository.findById(
                userId
            );

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
                ERROR_CODES.INVALID_BET,
                "Invalid bet amount."
            );
        }

        if (
            account.balance < bet
        ) {
            throw new AppError(
                ERROR_CODES.INSUFFICIENT_BALANCE
            );
        }

        /*
         * Resolve the game before committing
         * the balance changes.
         *
         * The actual money movement remains
         * inside this transaction.
         */
        const result =
            slotGameService.play(
                machineId,
                bet
            );

        userRepository
            .deductBalanceInTransaction(
                userId,
                bet
            );

        if (
            result.payout > 0
        ) {
            userRepository
                .addBalanceInTransaction(
                    userId,
                    result.payout
                );
        }

        const finalAccount =
            userRepository.findById(
                userId
            );

        if (!finalAccount) {
            throw new AppError(
                ERROR_CODES.ACCOUNT_NOT_FOUND
            );
        }

        return {
            ...result,

            balanceBefore:
                account.balance,

            balanceAfter:
                finalAccount.balance,
        };
    });
}


module.exports = {
    play,
};