const jackpotRepository =
    require("../database/jackpotRepository");

const userRepository =
    require("../database/userRepository");

const economyService =
    require("./economyService");

const rngService =
    require("./rngService");

const {
    AppError,
    ERROR_CODES,
} = require("../errors");


/*
 * --------------------------------
 * Constants
 * --------------------------------
 */

const JACKPOT_SEED =
    jackpotRepository.JACKPOT_SEED;


/*
 * --------------------------------
 * Validation
 * --------------------------------
 */

function validateAmount(amount) {

    if (
        typeof amount !== "number" ||
        !Number.isSafeInteger(amount) ||
        amount <= 0
    ) {

        throw new AppError(
            ERROR_CODES.INVALID_AMOUNT,
            "Invalid Jackpot contribution amount."
        );
    }
}


/*
 * --------------------------------
 * Initialize
 * --------------------------------
 */

function initialize() {

    jackpotRepository.initialize();
}


/*
 * --------------------------------
 * Get Jackpot
 * --------------------------------
 */

function getJackpotAmount() {

    initialize();

    return jackpotRepository.getAmount();
}


/*
 * --------------------------------
 * Add Contribution
 * --------------------------------
 *
 * Player money is removed through
 * the centralized Economy Service.
 *
 * Jackpot itself never modifies
 * player balances directly.
 */

function addContribution(
    userId,
    amount
) {

    validateAmount(amount);

    initialize();

    /*
     * Make sure the account exists.
     */

    economyService.getAccount(
        userId
    );


    /*
     * Withdraw from player first.
     *
     * If insufficient balance,
     * nothing is added to Jackpot.
     */

    economyService.withdraw(
        userId,
        amount
    );


    /*
     * Record contribution.
     */

    jackpotRepository.addContribution(
        userId,
        amount
    );


    /*
     * Increase current jackpot.
     */

    jackpotRepository.addAmount(
        amount
    );


    return {
        userId,
        amount,
        jackpot:
            jackpotRepository.getAmount(),
    };
}


/*
 * --------------------------------
 * Weighted Winner
 * --------------------------------
 *
 * Every Ether contributed gives
 * one unit of winning weight.
 *
 * More contribution =
 * proportionally greater chance.
 *
 * Outcome is NOT based on:
 * - balance
 * - identity
 * - previous wins
 * - streak
 * - activity
 */

function selectWinner(
    contributors
) {

    if (
        !Array.isArray(contributors) ||
        contributors.length === 0
    ) {

        return null;
    }


    let totalWeight = 0;

    for (
        const contributor
        of contributors
    ) {

        if (
            !Number.isSafeInteger(
                contributor.amount
            ) ||
            contributor.amount <= 0
        ) {

            continue;
        }

        totalWeight +=
            contributor.amount;
    }


    if (
        !Number.isSafeInteger(
            totalWeight
        ) ||
        totalWeight <= 0
    ) {

        return null;
    }


    const winningWeight =
        rngService.randomInt(
            1,
            totalWeight
        );


    let cumulative = 0;


    for (
        const contributor
        of contributors
    ) {

        cumulative +=
            contributor.amount;


        if (
            winningWeight <=
            cumulative
        ) {

            return contributor;
        }
    }


    return contributors[
        contributors.length - 1
    ];
}


/*
 * --------------------------------
 * Calculate Settlement
 * --------------------------------
 *
 * Winner:
 *
 * exactly 2 × contribution
 *
 * Remaining jackpot:
 *
 * distributed proportionally among
 * OTHER contributors.
 *
 * Winner does NOT participate in
 * the remaining pool.
 */

function calculateSettlement({
    jackpotAmount,
    contributors,
    winner,
}) {

    if (
        !winner
    ) {

        return {
            winner: null,
            winnerPayout: 0,
            remainingPool: jackpotAmount,
            distributions: [],
            houseRemainder: jackpotAmount,
        };
    }


    const winnerContribution =
        Number(
            winner.amount
        );


    const winnerPayout =
        winnerContribution * 2;


    if (
        !Number.isSafeInteger(
            winnerPayout
        )
    ) {

        throw new AppError(
            ERROR_CODES.PAYOUT_TOO_LARGE,
            "Jackpot winner payout exceeds the maximum safe value."
        );
    }


    /*
     * The winner must actually be
     * payable from the jackpot.
     */

    if (
        winnerPayout >
        jackpotAmount
    ) {

        throw new AppError(
            ERROR_CODES.JACKPOT_SETTLEMENT_FAILED,
            "Jackpot cannot cover the winner payout."
        );
    }


    const remainingPool =
        jackpotAmount -
        winnerPayout;


    const otherContributors =
        contributors.filter(
            contributor =>
                contributor.user_id !==
                winner.user_id
        );


    const totalOtherContribution =
        otherContributors.reduce(
            (
                total,
                contributor
            ) =>
                total +
                Number(
                    contributor.amount
                ),
            0
        );


    const distributions = [];


    if (
        remainingPool > 0 &&
        totalOtherContribution > 0
    ) {

        let distributed =
            0;


        for (
            let index = 0;
            index <
            otherContributors.length;
            index++
        ) {

            const contributor =
                otherContributors[index];


            let payout;


            /*
             * Last contributor receives
             * the remainder so integer
             * rounding cannot destroy
             * Ethers.
             */

            if (
                index ===
                otherContributors.length - 1
            ) {

                payout =
                    remainingPool -
                    distributed;

            } else {

                payout =
                    Math.floor(
                        remainingPool *
                        contributor.amount /
                        totalOtherContribution
                    );
            }


            if (
                payout > 0
            ) {

                distributions.push({
                    userId:
                        contributor.user_id,

                    contribution:
                        contributor.amount,

                    payout,
                });

                distributed +=
                    payout;
            }
        }
    }


    const distributedToOthers =
        distributions.reduce(
            (
                total,
                distribution
            ) =>
                total +
                distribution.payout,
            0
        );


    const houseRemainder =
        remainingPool -
        distributedToOthers;


    return {

        winner: {
            userId:
                winner.user_id,

            contribution:
                winnerContribution,

            payout:
                winnerPayout,
        },

        winnerPayout,

        remainingPool,

        distributions,

        houseRemainder,

    };
}


/*
 * --------------------------------
 * Settle Jackpot
 * --------------------------------
 */

function settleJackpot() {

    initialize();


    const jackpotAmount =
        jackpotRepository.getAmount();


    const contributors =
        jackpotRepository.getContributors();


    /*
     * Nobody contributed.
     *
     * Entire 10k seed goes to House.
     */

    if (
        contributors.length === 0
    ) {

        return {
            settled: false,
            reason:
                "NO_CONTRIBUTORS",

            jackpotAmount,

            houseAmount:
                jackpotAmount,
        };
    }


    const winner =
        selectWinner(
            contributors
        );


    if (!winner) {

        throw new AppError(
            ERROR_CODES.INVALID_GAME_RESULT,
            "Unable to select a Jackpot winner."
        );
    }


    const settlement =
        calculateSettlement({
            jackpotAmount,
            contributors,
            winner,
        });


    /*
     * EVERYTHING BELOW MUST HAPPEN
     * IN ONE SQLITE TRANSACTION.
     */

    jackpotRepository.atomic(() => {

        /*
         * Re-read current state inside
         * transaction.
         */

        const currentAmount =
            jackpotRepository.getAmount();


        const currentContributors =
            jackpotRepository.getContributors();


        if (
            currentAmount !==
            jackpotAmount
        ) {

            throw new AppError(
                ERROR_CODES.JACKPOT_SETTLEMENT_FAILED,
                "Jackpot changed during settlement."
            );
        }


        if (
            currentContributors.length !==
            contributors.length
        ) {

            throw new AppError(
                ERROR_CODES.JACKPOT_SETTLEMENT_FAILED,
                "Jackpot contributors changed during settlement."
            );
        }


        /*
         * Winner payout.
         *
         * IMPORTANT:
         *
         * We use the repository's
         * in-transaction balance
         * operation rather than creating
         * another transaction.
         */

        userRepository.addBalanceInTransaction(
            settlement.winner.userId,
            settlement.winner.payout
        );


        /*
         * Remaining contributors.
         */

        for (
            const distribution
            of settlement.distributions
        ) {

            userRepository.addBalanceInTransaction(
                distribution.userId,
                distribution.payout
            );
        }


        /*
         * House remainder.
         *
         * --------------------------------
         * INTEGRATION POINT
         * --------------------------------
         *
         * Replace this with the existing
         * House Repository's IN-TRANSACTION
         * purse method once we inspect
         * houseRepository.js.
         */

        if (
            settlement.houseRemainder > 0
        ) {

            throw new AppError(
                ERROR_CODES.JACKPOT_SETTLEMENT_FAILED,
                "House purse integration is required before Jackpot settlement can run."
            );
        }


        /*
         * Reset Jackpot for the next
         * 24-hour cycle.
         */

        jackpotRepository.reset();
    });


    return {
        settled: true,

        jackpotAmount,

        winner:
            settlement.winner,

        distributions:
            settlement.distributions,

        houseRemainder:
            settlement.houseRemainder,

        nextJackpot:
            JACKPOT_SEED,
    };
}


module.exports = {

    JACKPOT_SEED,

    initialize,

    getJackpotAmount,

    addContribution,

    selectWinner,

    calculateSettlement,

    settleJackpot,

};