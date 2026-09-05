const repository =
    require("../database/repository");

const userRepository =
    require("../database/userRepository");

const {
    AppError,
} = require("../errors");


/*
 * --------------------------------
 * Blackjack Payout Multipliers
 * --------------------------------
 */

const PAYOUT_MULTIPLIERS = Object.freeze({

    blackjack:
        1.4,

    win:
        2,

    push:
        1,

    loss:
        0,
});


/*
 * --------------------------------
 * Validate User ID
 * --------------------------------
 */

function validateUserId(userId) {

    if (
        typeof userId !== "string" ||
        userId.trim() === ""
    ) {

        throw new AppError(
            "INVALID_INPUT"
        );
    }
}


/*
 * --------------------------------
 * Validate Bet
 * --------------------------------
 */

function validateBet(bet) {

    if (
        !Number.isSafeInteger(bet) ||
        bet <= 0
    ) {

        throw new AppError(
            "INVALID_BET"
        );
    }
}


/*
 * --------------------------------
 * Get Payout Multiplier
 * --------------------------------
 */

function getPayoutMultiplier(
    status
) {

    switch (status) {

        case "blackjack":

            return PAYOUT_MULTIPLIERS.blackjack;


        case "player_win":
        case "dealer_bust":

            return PAYOUT_MULTIPLIERS.win;


        case "push":

            return PAYOUT_MULTIPLIERS.push;


        case "player_bust":
        case "dealer_win":

            return PAYOUT_MULTIPLIERS.loss;


        default:

            throw new AppError(
                "INVALID_GAME_RESULT"
            );
    }
}


/*
 * --------------------------------
 * Calculate Payout
 * --------------------------------
 */

function calculatePayout(
    bet,
    status
) {

    validateBet(
        bet
    );


    const multiplier =
        getPayoutMultiplier(
            status
        );


    const payout =
        Math.floor(
            bet * multiplier
        );


    /*
     * Make sure the calculated
     * payout is still safe for
     * JavaScript integer operations.
     */

    if (
        !Number.isSafeInteger(
            payout
        )
    ) {

        throw new AppError(
            "PAYOUT_TOO_LARGE"
        );
    }


    return {

        bet,

        multiplier,

        payout,
    };
}


/*
 * --------------------------------
 * Settle Blackjack
 * --------------------------------
 *
 * The original bet was already
 * deducted when the round began.
 *
 * Settlement only credits the
 * resulting payout.
 *
 * The entire balance update is
 * atomic.
 */

function settle(
    userId,
    result
) {

    validateUserId(
        userId
    );


    /*
     * --------------------------------
     * Validate Result
     * --------------------------------
     */

    if (
        !result ||
        typeof result !== "object"
    ) {

        throw new AppError(
            "INVALID_GAME_RESULT"
        );
    }


    const {
        status,
        bet,
    } = result;


    /*
     * --------------------------------
     * Calculate Payout
     * --------------------------------
     *
     * Calculation happens before
     * the database transaction because
     * it does not modify persistent state.
     */

    const payoutResult =
        calculatePayout(
            bet,
            status
        );


    /*
     * --------------------------------
     * Atomic Settlement
     * --------------------------------
     */

    return repository.transaction(
        () => {

            const account =
                userRepository.findById(
                    userId
                );


            /*
             * --------------------------------
             * Account Check
             * --------------------------------
             */

            if (!account) {

                throw new AppError(
                    "ACCOUNT_NOT_FOUND"
                );
            }


            /*
             * --------------------------------
             * Credit Payout
             * --------------------------------
             *
             * The original bet has already
             * been deducted.
             *
             * Settlement only adds the
             * calculated payout.
             */

            if (
                payoutResult.payout > 0
            ) {

                userRepository.addBalanceInTransaction(
                    userId,
                    payoutResult.payout
                );
            }


            /*
             * --------------------------------
             * Read Final Balance
             * --------------------------------
             */

            const finalAccount =
                userRepository.findById(
                    userId
                );


            /*
             * --------------------------------
             * Settlement Result
             * --------------------------------
             */

            return {

                ...result,

                ...payoutResult,

                balanceBefore:
                    account.balance,

                balanceAfter:
                    finalAccount.balance,
            };
        }
    );
}


/*
 * --------------------------------
 * Exports
 * --------------------------------
 */

module.exports = {

    PAYOUT_MULTIPLIERS,

    calculatePayout,

    settle,
};