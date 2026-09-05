const {
    AppError,
    ERROR_CODES,
} = require("../errors");

const betValidationService =
    require("./betValidationService");

const userRepository =
    require("../database/userRepository");

const repository =
    require("../database/repository");


function play({
    userId,
    bet,
    resolve,
}) {
    if (typeof resolve !== "function") {
        throw new AppError(
            ERROR_CODES.INVALID_GAME_RESOLVER
        );
    }

    /*
     * Validate before opening the transaction.
     *
     * This checks:
     * - positive safe integer
     * - minimum bet
     * - sufficient balance
     */
    const validatedBet =
        betValidationService.validateBet(
            userId,
            bet
        );

    /*
     * The entire wager + game resolution + payout
     * happens inside ONE SQLite transaction.
     *
     * If anything throws, SQLite rolls everything back.
     */
    return repository.transaction(() => {
        const wager =
            userRepository.deductBalanceInTransaction(
                userId,
                validatedBet.amount
            );

        let result;

        try {
            result = resolve({
                userId,
                bet: validatedBet.amount,
                balanceBefore:
                    wager.balanceBefore,
            });
        } catch (error) {
            throw new AppError(
                ERROR_CODES.GAME_RESOLUTION_FAILED
            );
        }

        if (
            !result ||
            typeof result !== "object"
        ) {
            throw new AppError(
                ERROR_CODES.INVALID_GAME_RESULT
            );
        }

        const payout =
            result.payout ?? 0;

        if (
            !Number.isSafeInteger(payout) ||
            payout < 0
        ) {
            throw new AppError(
                ERROR_CODES.INVALID_PAYOUT
            );
        }

        let settlement = null;

        if (payout > 0) {
            settlement =
                userRepository.addBalanceInTransaction(
                    userId,
                    payout
                );
        }

        const account =
            userRepository.findById(userId);

        if (!account) {
            throw new AppError(
                ERROR_CODES.ACCOUNT_NOT_FOUND
            );
        }

        const finalBalance =
            account.balance;

        return {
            userId,
            bet: validatedBet.amount,
            payout,
            result,
            balanceBefore:
                wager.balanceBefore,
            balanceAfter:
                finalBalance,
            settlement,
        };
    });
}


module.exports = {
    play,
};