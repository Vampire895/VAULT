const repository =
    require("../database/repository");

const userRepository =
    require("../database/userRepository");

const {
    AppError,
} = require("../errors");


const blackjackEngine =
    require("../games/blackjack/blackjackEngine");

const sessionStore =
    require("../games/blackjack/blackjackSessionStore");

const blackjackSettlementService =
    require("./blackjackSettlementService");


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
 * Validate Blackjack Bet
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
 * Start Blackjack Round
 * --------------------------------
 */

function start(
    userId,
    bet
) {

    validateUserId(
        userId
    );

    validateBet(
        bet
    );


    /*
     * --------------------------------
     * Prevent Duplicate Active Game
     * --------------------------------
     */

    if (
        sessionStore.hasSession(
            userId
        )
    ) {

        throw new AppError(
            "GAME_ALREADY_ACTIVE"
        );
    }


    /*
     * --------------------------------
     * Deal Initial Hands
     * --------------------------------
     *
     * Deal before changing the
     * player's balance.
     */

    const dealt =
        blackjackEngine.dealInitialHands();


    const resolution =
        blackjackEngine.resolveInitialDeal(
            dealt.playerHand,
            dealt.dealerHand
        );


    const needsSession =
        resolution.status ===
        "player_turn";


    /*
     * --------------------------------
     * Bet + Session Transaction
     * --------------------------------
     *
     * The balance deduction and
     * temporary session creation
     * happen together.
     *
     * If anything fails, the SQLite
     * transaction rolls back.
     */

    const round =
        repository.transaction(() => {

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
             * Balance Check
             * --------------------------------
             */

            if (
                account.balance < bet
            ) {

                throw new AppError(
                    "INSUFFICIENT_BALANCE"
                );
            }


            /*
             * --------------------------------
             * Deduct Bet
             * --------------------------------
             */

            userRepository.deductBalanceInTransaction(
                userId,
                bet
            );


            let session =
                null;


            /*
             * --------------------------------
             * Create Active Session
             * --------------------------------
             */

            if (
                needsSession
            ) {

                try {

                    session =
                        sessionStore.createSession(
                            userId,
                            {
                                bet,

                                deck:
                                    dealt.deck,

                                playerHand:
                                    dealt.playerHand,

                                dealerHand:
                                    dealt.dealerHand,

                                state:
                                    resolution.status,
                            }
                        );

                } catch (error) {

                    /*
                     * Remove partially-created
                     * RAM state.
                     *
                     * SQLite transaction will
                     * still roll back.
                     */

                    sessionStore.deleteSession(
                        userId
                    );


                    throw error;
                }
            }


            /*
             * --------------------------------
             * Final Account State
             * --------------------------------
             */

            const finalAccount =
                userRepository.findById(
                    userId
                );


            return {

                session,

                resolution,

                bet,

                balanceBefore:
                    account.balance,

                balanceAfter:
                    finalAccount.balance,
            };
        });


    /*
     * --------------------------------
     * Active Player Turn
     * --------------------------------
     */

    if (
        needsSession
    ) {

        return round;
    }


    /*
     * --------------------------------
     * Immediate Settlement
     * --------------------------------
     *
     * Blackjack / dealer Blackjack /
     * push are settled only after the
     * bet transaction has committed.
     */

    const settlement =
        blackjackSettlementService.settle(
            userId,
            {
                status:
                    resolution.status,

                bet,
            }
        );


    return {

        session:
            null,

        resolution,

        bet,

        balanceBefore:
            round.balanceBefore,

        balanceAfter:
            settlement.balanceAfter,

        payout:
            settlement.payout,

        multiplier:
            settlement.multiplier,

        settlement,
    };
}


/*
 * --------------------------------
 * Exports
 * --------------------------------
 */

module.exports = {
    start,
};