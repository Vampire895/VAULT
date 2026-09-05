const rng = require("../../services/rngService");

const SUITS = ["♠", "♥", "♦", "♣"];

const RANKS = [
    { rank: "2", value: 2 },
    { rank: "3", value: 3 },
    { rank: "4", value: 4 },
    { rank: "5", value: 5 },
    { rank: "6", value: 6 },
    { rank: "7", value: 7 },
    { rank: "8", value: 8 },
    { rank: "9", value: 9 },
    { rank: "10", value: 10 },
    { rank: "J", value: 10 },
    { rank: "Q", value: 10 },
    { rank: "K", value: 10 },
    { rank: "A", value: 11 },
];

function createDeck() {
    const deck = [];

    for (const suit of SUITS) {
        for (const card of RANKS) {
            deck.push({
                rank: card.rank,
                suit,
                value: card.value,
            });
        }
    }

    return deck;
}

function shuffleDeck(deck) {
    const shuffled = [...deck];

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = rng.randomInt(0, i);

        [shuffled[i], shuffled[j]] =
            [shuffled[j], shuffled[i]];
    }

    return shuffled;
}

function createShuffledDeck() {
    return shuffleDeck(createDeck());
}

function drawCard(deck) {
    if (!Array.isArray(deck) || deck.length === 0) {
        throw new Error("Cannot draw from an empty deck.");
    }

    return deck.pop();
}

function calculateHandValue(hand) {
    if (!Array.isArray(hand)) {
        throw new Error("Invalid Blackjack hand.");
    }

    let total = 0;
    let aces = 0;

    for (const card of hand) {
        total += card.value;

        if (card.rank === "A") {
            aces++;
        }
    }

    while (total > 21 && aces > 0) {
        total -= 10;
        aces--;
    }

    return {
        value: total,
        soft: aces > 0,
        blackjack:
            hand.length === 2 && total === 21,
        bust: total > 21,
    };
}

function dealInitialHands() {
    const deck = createShuffledDeck();

    const playerHand = [
        drawCard(deck),
        drawCard(deck),
    ];

    const dealerHand = [
        drawCard(deck),
        drawCard(deck),
    ];

    return {
        deck,
        playerHand,
        dealerHand,
    };
}

function hit(playerHand, deck) {
    if (
        !Array.isArray(playerHand) ||
        !Array.isArray(deck)
    ) {
        throw new Error("Invalid Blackjack state.");
    }

    const card = drawCard(deck);

    playerHand.push(card);

    return {
        card,
        hand: playerHand,
        ...calculateHandValue(playerHand),
    };
}

function dealerPlay(dealerHand, deck) {
    if (
        !Array.isArray(dealerHand) ||
        !Array.isArray(deck)
    ) {
        throw new Error("Invalid Blackjack state.");
    }

    while (true) {
        const handValue =
            calculateHandValue(dealerHand);

        if (handValue.value >= 17) {
            return {
                hand: dealerHand,
                ...handValue,
            };
        }

        drawCardIntoHand(dealerHand, deck);
    }
}

function drawCardIntoHand(hand, deck) {
    const card = drawCard(deck);
    hand.push(card);
    return card;
}

function resolveInitialDeal(playerHand, dealerHand) {
    const player =
        calculateHandValue(playerHand);

    const dealer =
        calculateHandValue(dealerHand);

    if (player.blackjack && dealer.blackjack) {
        return {
            status: "push",
            reason: "both_blackjack",
            player,
            dealer,
        };
    }

    if (player.blackjack) {
        return {
            status: "blackjack",
            reason: "player_blackjack",
            player,
            dealer,
        };
    }

    if (dealer.blackjack) {
        return {
            status: "dealer_blackjack",
            reason: "dealer_blackjack",
            player,
            dealer,
        };
    }

    return {
        status: "player_turn",
        reason: null,
        player,
        dealer,
    };
}

function resolveFinalHand(playerHand, dealerHand) {
    const player =
        calculateHandValue(playerHand);

    const dealer =
        calculateHandValue(dealerHand);

    if (player.bust) {
        return {
            status: "player_bust",
            player,
            dealer,
        };
    }

    if (dealer.bust) {
        return {
            status: "dealer_bust",
            player,
            dealer,
        };
    }

    if (player.value > dealer.value) {
        return {
            status: "player_win",
            player,
            dealer,
        };
    }

    if (player.value < dealer.value) {
        return {
            status: "dealer_win",
            player,
            dealer,
        };
    }

    return {
        status: "push",
        player,
        dealer,
    };
}

module.exports = {
    createDeck,
    shuffleDeck,
    createShuffledDeck,
    drawCard,
    calculateHandValue,
    dealInitialHands,
    hit,
    dealerPlay,
    resolveInitialDeal,
    resolveFinalHand,
};