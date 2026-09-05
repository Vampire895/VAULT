const blackjackEngine = require("../games/blackjack/blackjackEngine");
const sessionStore = require("../games/blackjack/blackjackSessionStore");

const repository = require("../database/repository");
const userRepository = require("../database/userRepository");

const blackjackRoundService = require("./blackjackRoundService");
const blackjackSettlementService = require("./blackjackSettlementService");

function getActiveSession(userId) {
    const session =
        sessionStore.getSession(userId);

    if (!session) {
        throw new Error(
            "No active Blackjack game found."
        );
    }

    return session;
}

function start(userId, bet) {
    return blackjackRoundService.start(
        userId,
        bet
    );
}

function getGame(userId) {
    const session =
        getActiveSession(userId);

    return {
        ...session,

        player:
            blackjackEngine.calculateHandValue(
                session.playerHand
            ),

        dealer:
            blackjackEngine.calculateHandValue(
                session.dealerHand
            ),
    };
}

/*
 * Settle a terminal Blackjack result and remove
 * the runtime session after successful settlement.
 *
 * The caller must claim the session BEFORE calling
 * this function.
 */
function settleAndCleanup(userId, result) {
    const settlement =
        blackjackSettlementService.settle(
            userId,
            result
        );

    sessionStore.deleteSession(userId);

    return {
        ...result,
        payout: settlement.payout,
        multiplier: settlement.multiplier,
        balanceBefore:
            settlement.balanceBefore,
        balanceAfter:
            settlement.balanceAfter,
    };
}

/*
 * Claim the session before performing a terminal
 * action.
 *
 * This changes:
 *
 * player_turn
 *      ↓
 * resolving
 *
 * A second simultaneous interaction can therefore
 * no longer resolve the same Blackjack game.
 */
function claimActiveSession(userId) {
    return sessionStore.claimSession(userId);
}

function hit(userId) {
    /*
     * First check that the game exists and is
     * currently playable.
     *
     * We do NOT claim yet because a normal Hit
     * may leave the game active.
     */
    const session =
        getActiveSession(userId);

    if (session.state !== "player_turn") {
        throw new Error(
            "You cannot hit right now."
        );
    }

    /*
     * Take a snapshot before modifying runtime state.
     *
     * If the engine fails, the session can be restored.
     */
    const originalPlayerHand =
        [...session.playerHand];

    const originalDealerHand =
        [...session.dealerHand];

    const originalDeck =
        [...session.deck];

    try {
        const result =
            blackjackEngine.hit(
                session.playerHand,
                session.deck
            );

        /*
         * Player busts.
         *
         * The session must be claimed BEFORE
         * settlement so a duplicate interaction
         * cannot receive another payout.
         */
        if (result.bust) {
            const claimedSession =
                claimActiveSession(userId);

            const finalResult = {
                status: "player_bust",

                player: result,

                dealer:
                    blackjackEngine.calculateHandValue(
                        claimedSession.dealerHand
                    ),

                bet: claimedSession.bet,
            };

            return settleAndCleanup(
                userId,
                finalResult
            );
        }

        /*
         * Reaching 21 automatically resolves the
         * player's hand.
         */
        if (result.value === 21) {
            const claimedSession =
                claimActiveSession(userId);

            blackjackEngine.dealerPlay(
                claimedSession.dealerHand,
                claimedSession.deck
            );

            const resolution =
                blackjackEngine.resolveFinalHand(
                    claimedSession.playerHand,
                    claimedSession.dealerHand
                );

            return settleAndCleanup(
                userId,
                {
                    ...resolution,
                    bet: claimedSession.bet,
                }
            );
        }

        /*
         * Normal Hit:
         *
         * The session remains active.
         */
        sessionStore.updateSession(userId, {
            state: "player_turn",
        });

        return {
            status: "player_turn",

            player: result,

            dealer:
                blackjackEngine.calculateHandValue(
                    session.dealerHand
                ),

            bet: session.bet,
        };
    } catch (error) {
        /*
         * Restore runtime state if the engine or
         * resolution process failed.
         *
         * No balance was changed by Hit itself,
         * so there is nothing to refund here.
         */
        const currentSession =
            sessionStore.getSession(userId);

        if (currentSession) {
            currentSession.playerHand.length = 0;
            currentSession.playerHand.push(
                ...originalPlayerHand
            );

            currentSession.dealerHand.length = 0;
            currentSession.dealerHand.push(
                ...originalDealerHand
            );

            currentSession.deck.length = 0;
            currentSession.deck.push(
                ...originalDeck
            );

            /*
             * If the session was claimed but settlement
             * failed, restore it to player_turn so the
             * game is not permanently stuck.
             */
            if (
                currentSession.state ===
                "resolving"
            ) {
                sessionStore.updateSession(userId, {
                    state: "player_turn",
                    resolvingAt: null,
                });
            }
        }

        throw error;
    }
}

function stand(userId) {
    /*
     * Atomically claim the session first.
     *
     * Only one Stand interaction can pass this point.
     */
    const session =
        claimActiveSession(userId);

    const originalPlayerHand =
        [...session.playerHand];

    const originalDealerHand =
        [...session.dealerHand];

    const originalDeck =
        [...session.deck];

    try {
        blackjackEngine.dealerPlay(
            session.dealerHand,
            session.deck
        );

        const resolution =
            blackjackEngine.resolveFinalHand(
                session.playerHand,
                session.dealerHand
            );

        return settleAndCleanup(
            userId,
            {
                ...resolution,
                bet: session.bet,
            }
        );
    } catch (error) {
        /*
         * Restore the runtime session if resolution
         * fails before settlement completes.
         */
        const currentSession =
            sessionStore.getSession(userId);

        if (currentSession) {
            currentSession.playerHand.length = 0;
            currentSession.playerHand.push(
                ...originalPlayerHand
            );

            currentSession.dealerHand.length = 0;
            currentSession.dealerHand.push(
                ...originalDealerHand
            );

            currentSession.deck.length = 0;
            currentSession.deck.push(
                ...originalDeck
            );

            sessionStore.updateSession(userId, {
                state: "player_turn",
                resolvingAt: null,
            });
        }

        throw error;
    }
}

function doubleDown(userId) {
    /*
     * Claim the session BEFORE touching the balance.
     *
     * This prevents two rapid Double Down interactions
     * from both deducting the extra bet.
     */
    const session =
        claimActiveSession(userId);

    if (session.playerHand.length !== 2) {
        sessionStore.updateSession(userId, {
            state: "player_turn",
            resolvingAt: null,
        });

        throw new Error(
            "Double Down is only available on your initial hand."
        );
    }

    const doubledBet =
        session.bet * 2;

    if (!Number.isSafeInteger(doubledBet)) {
        sessionStore.updateSession(userId, {
            state: "player_turn",
            resolvingAt: null,
        });

        throw new Error(
            "Double Down bet exceeds the maximum safe value."
        );
    }

    /*
     * Double Down requires one additional bet
     * equal to the original bet.
     */
    const extraBet = session.bet;

    let extraBetDeducted = false;

    const originalPlayerHand =
        [...session.playerHand];

    const originalDealerHand =
        [...session.dealerHand];

    const originalDeck =
        [...session.deck];

    try {
        /*
         * Atomically verify and deduct the extra bet.
         */
        repository.transaction(() => {
            const account =
                userRepository.findById(userId);

            if (!account) {
                throw new Error(
                    "Account not found."
                );
            }

            if (account.balance < extraBet) {
                throw new Error(
                    "Insufficient balance for Double Down."
                );
            }

            userRepository.deductBalanceInTransaction(
                userId,
                extraBet
            );
        });

        extraBetDeducted = true;

        /*
         * Double Down means exactly one additional card.
         */
        const result =
            blackjackEngine.hit(
                session.playerHand,
                session.deck
            );

        /*
         * Player busts immediately.
         */
        if (result.bust) {
            return settleAndCleanup(
                userId,
                {
                    status: "player_bust",

                    player: result,

                    dealer:
                        blackjackEngine.calculateHandValue(
                            session.dealerHand
                        ),

                    bet: doubledBet,
                    doubled: true,
                }
            );
        }

        /*
         * Dealer automatically plays after
         * the one Double Down card.
         */
        blackjackEngine.dealerPlay(
            session.dealerHand,
            session.deck
        );

        const resolution =
            blackjackEngine.resolveFinalHand(
                session.playerHand,
                session.dealerHand
            );

        return settleAndCleanup(
            userId,
            {
                ...resolution,
                bet: doubledBet,
                doubled: true,
            }
        );
    } catch (error) {
        /*
         * Restore runtime game state.
         */
        const currentSession =
            sessionStore.getSession(userId);

        if (currentSession) {
            currentSession.playerHand.length = 0;
            currentSession.playerHand.push(
                ...originalPlayerHand
            );

            currentSession.dealerHand.length = 0;
            currentSession.dealerHand.push(
                ...originalDealerHand
            );

            currentSession.deck.length = 0;
            currentSession.deck.push(
                ...originalDeck
            );

            /*
             * Return the session to a playable state.
             */
            sessionStore.updateSession(userId, {
                state: "player_turn",
                resolvingAt: null,
            });
        }

        /*
         * Refund ONLY if the extra bet was actually
         * committed to SQLite.
         */
        if (extraBetDeducted) {
            try {
                repository.transaction(() => {
                    const account =
                        userRepository.findById(userId);

                    if (account) {
                        userRepository.addBalanceInTransaction(
                            userId,
                            extraBet
                        );
                    }
                });
            } catch (refundError) {
                /*
                 * Never hide the original failure.
                 */
                console.error(
                    "❌ Blackjack Double Down refund failed:",
                    refundError
                );
            }
        }

        throw error;
    }
}

function cancel(userId) {
    const session =
        getActiveSession(userId);

    sessionStore.deleteSession(userId);

    return {
        cancelled: true,
        bet: session.bet,
    };
}

module.exports = {
    start,
    getGame,
    hit,
    stand,
    doubleDown,
    cancel,
};