const blackjackEngine = require("../src/games/blackjack/blackjackEngine");

const ROUNDS = 1_000_000;
const BET = 500;

const stats = {
    rounds: 0,

    playerBlackjack: 0,
    dealerBlackjack: 0,

    playerWins: 0,
    dealerWins: 0,
    pushes: 0,

    playerBusts: 0,
    dealerBusts: 0,

    totalWagered: 0,
    totalPayout: 0,
};

function getDealerUpCardValue(dealerHand) {
    const card = dealerHand[0];

    if (!card) {
        throw new Error("Dealer up-card is missing.");
    }

    return card.value === 11 ? 11 : card.value;
}

/*
 * Diagnostic player strategy.
 *
 * This is intentionally kept simple and deterministic.
 *
 * Hard hands:
 *   <= 11  -> Hit
 *   12     -> Stand vs 4-6, otherwise Hit
 *   13-16  -> Stand vs 2-6, otherwise Hit
 *   17+    -> Stand
 *
 * Soft hands:
 *   Soft 17 or below -> Hit
 *   Soft 18+         -> Stand
 *
 * This is NOT intended to be a perfect basic-strategy
 * implementation. It is simply much more informative
 * than "hit everything below 17".
 */
function shouldHit(playerValue, dealerUpCard) {
    const {
        value,
        soft,
    } = playerValue;

    if (value >= 21) {
        return false;
    }

    /*
     * Soft hand strategy.
     */
    if (soft) {
        return value < 18;
    }

    /*
     * Hard hand strategy.
     */

    if (value <= 11) {
        return true;
    }

    if (value === 12) {
        return !(
            dealerUpCard >= 4 &&
            dealerUpCard <= 6
        );
    }

    if (
        value >= 13 &&
        value <= 16
    ) {
        return !(
            dealerUpCard >= 2 &&
            dealerUpCard <= 6
        );
    }

    return false;
}

function payoutForStatus(status) {
    switch (status) {
        /*
         * Player Blackjack
         */
        case "blackjack":
            return BET * 1.5;

        /*
         * Normal player win
         * Dealer bust = player win
         */
        case "player_win":
        case "dealer_bust":
            return BET * 2;

        /*
         * Push / both Blackjack
         */
        case "push":
            return BET;

        /*
         * Dealer Blackjack
         * Dealer normal win
         * Player bust
         */
        case "dealer_blackjack":
        case "dealer_win":
        case "player_bust":
            return 0;

        default:
            throw new Error(
                `Unknown Blackjack status: ${status}`
            );
    }
}

function playOneRound() {
    const dealt =
        blackjackEngine.dealInitialHands();

    const playerHand = [
        ...dealt.playerHand,
    ];

    const dealerHand = [
        ...dealt.dealerHand,
    ];

    const deck = [
        ...dealt.deck,
    ];

    /*
     * Check natural Blackjack /
     * dealer Blackjack first.
     */
    const initialResolution =
        blackjackEngine.resolveInitialDeal(
            playerHand,
            dealerHand
        );

    if (
        initialResolution.status !==
        "player_turn"
    ) {
        return initialResolution;
    }

    const dealerUpCard =
        getDealerUpCardValue(
            dealerHand
        );

    /*
     * Player turn.
     */
    while (true) {
        const playerValue =
            blackjackEngine.calculateHandValue(
                playerHand
            );

        if (playerValue.bust) {
            return {
                status: "player_bust",
                player: playerValue,
                dealer:
                    blackjackEngine.calculateHandValue(
                        dealerHand
                    ),
            };
        }

        if (
            !shouldHit(
                playerValue,
                dealerUpCard
            )
        ) {
            break;
        }

        const hitResult =
            blackjackEngine.hit(
                playerHand,
                deck
            );

        if (hitResult.bust) {
            return {
                status: "player_bust",
                player: hitResult,
                dealer:
                    blackjackEngine.calculateHandValue(
                        dealerHand
                    ),
            };
        }

        if (hitResult.value === 21) {
            break;
        }
    }

    /*
     * Dealer follows the production engine's
     * exact rules.
     */
    blackjackEngine.dealerPlay(
        dealerHand,
        deck
    );

    return blackjackEngine.resolveFinalHand(
        playerHand,
        dealerHand
    );
}

/*
 * Run simulation.
 */
for (let i = 0; i < ROUNDS; i++) {
    const result =
        playOneRound();

    stats.rounds++;
    stats.totalWagered += BET;

    const payout =
        payoutForStatus(
            result.status
        );

    stats.totalPayout += payout;

    switch (result.status) {
        case "blackjack":
            stats.playerBlackjack++;
            break;

        case "dealer_blackjack":
            stats.dealerBlackjack++;
            break;

        case "player_win":
            stats.playerWins++;
            break;

        case "dealer_win":
            stats.dealerWins++;
            break;

        case "push":
            stats.pushes++;
            break;

        case "player_bust":
            stats.playerBusts++;
            break;

        case "dealer_bust":
            stats.dealerBusts++;
            break;

        default:
            throw new Error(
                `Unhandled result: ${result.status}`
            );
    }
}

/*
 * Economics.
 */
const rtp =
    stats.totalPayout /
    stats.totalWagered;

const houseEdge =
    1 - rtp;

const playerBlackjackRate =
    stats.playerBlackjack /
    stats.rounds;

const dealerBlackjackRate =
    stats.dealerBlackjack /
    stats.rounds;

const playerWinRate =
    stats.playerWins /
    stats.rounds;

const dealerWinRate =
    stats.dealerWins /
    stats.rounds;

const pushRate =
    stats.pushes /
    stats.rounds;

const playerBustRate =
    stats.playerBusts /
    stats.rounds;

const dealerBustRate =
    stats.dealerBusts /
    stats.rounds;

/*
 * Output.
 */
console.log(
    "\n🃏 FORTUNE BLACKJACK SIMULATION"
);

console.log(
    "================================"
);

console.log(
    `Rounds:             ${stats.rounds.toLocaleString()}`
);

console.log(
    `Bet per round:      ${BET.toLocaleString()}`
);

console.log(
    `Total wagered:      ${stats.totalWagered.toLocaleString()}`
);

console.log(
    `Total payout:       ${stats.totalPayout.toLocaleString()}`
);

console.log("\n📊 RESULTS");
console.log("--------------------------------");

console.log(
    `Player Blackjack:   ${stats.playerBlackjack.toLocaleString()}`
);

console.log(
    `Dealer Blackjack:   ${stats.dealerBlackjack.toLocaleString()}`
);

console.log(
    `Player wins:        ${stats.playerWins.toLocaleString()}`
);

console.log(
    `Dealer wins:        ${stats.dealerWins.toLocaleString()}`
);

console.log(
    `Pushes:             ${stats.pushes.toLocaleString()}`
);

console.log(
    `Player busts:       ${stats.playerBusts.toLocaleString()}`
);

console.log(
    `Dealer busts:       ${stats.dealerBusts.toLocaleString()}`
);

console.log("\n📈 RATES");
console.log("--------------------------------");

console.log(
    `Player Blackjack:   ${(playerBlackjackRate * 100).toFixed(4)}%`
);

console.log(
    `Dealer Blackjack:   ${(dealerBlackjackRate * 100).toFixed(4)}%`
);

console.log(
    `Player wins:        ${(playerWinRate * 100).toFixed(4)}%`
);

console.log(
    `Dealer wins:        ${(dealerWinRate * 100).toFixed(4)}%`
);

console.log(
    `Pushes:             ${(pushRate * 100).toFixed(4)}%`
);

console.log(
    `Player busts:       ${(playerBustRate * 100).toFixed(4)}%`
);

console.log(
    `Dealer busts:       ${(dealerBustRate * 100).toFixed(4)}%`
);

console.log("\n💰 ECONOMICS");
console.log("--------------------------------");

console.log(
    `RTP:                ${(rtp * 100).toFixed(4)}%`
);

console.log(
    `House Edge:         ${(houseEdge * 100).toFixed(4)}%`
);

console.log("\n🎯 TARGET");
console.log("--------------------------------");

console.log(
    "Target RTP:         95.0000%"
);

console.log(
    "Target Edge:        5.0000%"
);

console.log("\n");