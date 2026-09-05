const repository = require("../database/repository");
const userRepository = require("../database/userRepository");

const economyService = require("./economyService");
const configurationService = require("./configurationService");

const doubleOrNothingEngine =
    require("../games/doubleOrNothing/doubleOrNothingEngine");

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
            ERROR_CODES.INVALID_BET
        );
    }

    const minimumBet =
        configurationService.getMinimumBet();

    if (bet < minimumBet) {
        throw new AppError(
            ERROR_CODES.BET_TOO_LOW,
            `Minimum bet is ${minimumBet.toLocaleString()} coins.`
        );
    }
}

function play(userId, bet) {
    validateBet(bet);

    /*
     * Make sure the account exists before
     * attempting the wager.
     */
    economyService.getAccount(userId);

    /*
     * The wager must be deducted atomically.
     *
     * No game logic runs before the wager
     * is successfully secured.
     */
    const balanceBefore =
        economyService.getBalance(userId);

    if (balanceBefore < bet) {
        throw new AppError(
            ERROR_CODES.INSUFFICIENT_BALANCE
        );
    }

    /*
     * Deduct the wager.
     */
    repository.transaction(() => {
        const account =
            userRepository.findById(userId);

        if (!account) {
            throw new AppError(
                ERROR_CODES.ACCOUNT_NOT_FOUND
            );
        }

        if (account.balance < bet) {
            throw new AppError(
                ERROR_CODES.INSUFFICIENT_BALANCE
            );
        }

        userRepository.deductBalanceInTransaction(
            userId,
            bet
        );
    });

    /*
     * Determine the outcome only after the
     * wager has been successfully deducted.
     */
    let result;

    try {
        result =
            doubleOrNothingEngine.play();
    } catch (error) {
        /*
         * If RNG/game calculation somehow fails,
         * refund the wager so the player cannot
         * lose coins because of an internal error.
         */
        try {
            repository.transaction(() => {
                userRepository.addBalanceInTransaction(
                    userId,
                    bet
                );
            });
        } catch (refundError) {
            console.error(
                "❌ Double or Nothing refund failed:",
                refundError
            );
        }

        throw error;
    }

    const payout =
        result.won
            ? bet * 2
            : 0;

    /*
     * Validate payout before settlement.
     */
    if (
        payout > 0 &&
        !Number.isSafeInteger(payout)
    ) {
        try {
            repository.transaction(() => {
                userRepository.addBalanceInTransaction(
                    userId,
                    bet
                );
            });
        } catch (refundError) {
            console.error(
                "❌ Double or Nothing payout validation refund failed:",
                refundError
            );
        }

        throw new AppError(
            ERROR_CODES.PAYOUT_TOO_LARGE
        );
    }

    /*
     * Winning payout is added atomically.
     *
     * Losing rounds receive no payout.
     */
    if (payout > 0) {
        repository.transaction(() => {
            userRepository.addBalanceInTransaction(
                userId,
                payout
            );
        });
    }

    const balanceAfter =
        economyService.getBalance(userId);

    return {
        result: result.result,
        won: result.won,
        bet,
        payout,
        multiplier: result.won ? 2 : 0,
        balanceBefore,
        balanceAfter,
    };
}

module.exports = {
    play,
};