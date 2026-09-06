const sleep = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

const SLOT_SYMBOLS = [
    "🍒",
    "🍋",
    "🍊",
    "🍇",
    "🔔",
    "⭐",
    "💎",
    "7️⃣",
];

function randomSlotSymbol() {
    return SLOT_SYMBOLS[
        Math.floor(Math.random() * SLOT_SYMBOLS.length)
    ];
}

function createSpinFrame(reels) {
    return reels.join("  ");
}

function createAnimationEmbed(createEmbed, title, description) {
    return createEmbed({
        title,
        description,
    });
}

async function animateSpin(interaction, result, createEmbed) {
    const finalSymbols = result.symbols.map(
        (symbol) => symbol.display
    );

    const reels = [
        randomSlotSymbol(),
        randomSlotSymbol(),
        randomSlotSymbol(),
    ];

    const message = await interaction.reply({
        embeds: [
            createAnimationEmbed(
                createEmbed,
                "🎰  VAULT • CLASSIC",
                `## ${createSpinFrame(reels)}\n\n**🔄 SPINNING...**`
            ),
        ],
        fetchReply: true,
    });

    for (let i = 0; i < 12; i++) {
        reels[0] = randomSlotSymbol();
        reels[1] = randomSlotSymbol();
        reels[2] = randomSlotSymbol();

        await sleep(110);

        await message.edit({
            embeds: [
                createAnimationEmbed(
                    createEmbed,
                    "🎰  VAULT • CLASSIC",
                    `## ${createSpinFrame(reels)}\n\n**🔄 SPINNING...**`
                ),
            ],
        });
    }

    reels[0] = finalSymbols[0];

    await message.edit({
        embeds: [
            createAnimationEmbed(
                createEmbed,
                "🎰  VAULT • CLASSIC",
                `## ${createSpinFrame(reels)}\n\n**🔒 REEL 1 LOCKED**`
            ),
        ],
    });

    await sleep(850);

    reels[1] = finalSymbols[1];

    await message.edit({
        embeds: [
            createAnimationEmbed(
                createEmbed,
                "🎰  VAULT • CLASSIC",
                `## ${createSpinFrame(reels)}\n\n**🔒 REEL 2 LOCKED**`
            ),
        ],
    });

    await sleep(900);

    reels[2] = finalSymbols[2];

    await message.edit({
        embeds: [
            createAnimationEmbed(
                createEmbed,
                "🎰  VAULT • CLASSIC",
                `## ${createSpinFrame(reels)}\n\n**🎯 FINAL REEL...**`
            ),
        ],
    });

    await sleep(700);

    return message;
}

async function animateCoinflip(
    interaction,
    result,
    createEmbed
) {
    const finalResult =
        result.result === "heads"
            ? "HEADS"
            : "TAILS";

    const frames = [
        "        🪙",
        "        ◉",
        "        ●",
        "        ━",
        "        ●",
        "        ◉",
        "        🪙",
        "        ◉",
        "        ●",
        "        ━",
        "        ●",
        "        ◉",
        "        🪙",
    ];

    const message = await interaction.reply({
        embeds: [
            createAnimationEmbed(
                createEmbed,
                "🪙  VAULT • COINFLIP",
                `## ${frames[0]}\n\n**🪙 FLIPPING...**`
            ),
        ],
        fetchReply: true,
    });

    for (let i = 1; i < frames.length; i++) {
        await sleep(180);

        await message.edit({
            embeds: [
                createAnimationEmbed(
                    createEmbed,
                    "🪙  VAULT • COINFLIP",
                    `## ${frames[i]}\n\n**🪙 FLIPPING...**`
                ),
            ],
        });
    }

    await sleep(550);

    await message.edit({
        embeds: [
            createAnimationEmbed(
                createEmbed,
                "🪙  VAULT • COINFLIP",
                `## 🪙 ${finalResult}\n\n**🎯 RESULT REVEALED**`
            ),
        ],
    });

    await sleep(500);

    return message;
}

async function animateDouble(
    interaction,
    result,
    createEmbed
) {
    const finalResult =
        result.result === "win"
            ? "DOUBLE!"
            : "LOST!";

    const frames = [
        "        🎲",
        "        ⚄",
        "        ⚂",
        "        ⚀",
        "        ⚂",
        "        ⚅",
        "        ⚄",
        "        ⚂",
        "        ⚀",
        "        ⚅",
        "        ⚄",
        "        🎲",
    ];

    const message = await interaction.reply({
        embeds: [
            createAnimationEmbed(
                createEmbed,
                "🎲  VAULT • DOUBLE OR NOTHING",
                `## ${frames[0]}\n\n**🎲 ROLLING...**`
            ),
        ],
        fetchReply: true,
    });

    for (let i = 1; i < frames.length; i++) {
        await sleep(190);

        await message.edit({
            embeds: [
                createAnimationEmbed(
                    createEmbed,
                    "🎲  VAULT • DOUBLE OR NOTHING",
                    `## ${frames[i]}\n\n**🎲 ROLLING...**`
                ),
            ],
        });
    }

    await sleep(500);

    await message.edit({
        embeds: [
            createAnimationEmbed(
                createEmbed,
                "🎲  VAULT • DOUBLE OR NOTHING",
                `## ${finalResult}\n\n**🎯 RESULT REVEALED**`
            ),
        ],
    });

    return message;
}

/*
 * BLACKJACK
 *
 * Animation helpers intentionally do NOT perform
 * RNG, settlement, or game calculations.
 */

function formatBlackjackCard(card) {
    if (!card) return "🂠";

    return `${card.rank}${card.suit}`;
}

function formatBlackjackHand(hand = []) {
    return hand
        .map(formatBlackjackCard)
        .join("  ");
}

function createBlackjackAnimationDescription(
    playerHand,
    dealerHand,
    playerValue,
    dealerValue,
    status
) {
    const lines = [
        "**Your Hand**",
        `${formatBlackjackHand(playerHand)}  **(${playerValue})**`,
        "",
        "**Dealer**",
        `${formatBlackjackHand(dealerHand)}${
            dealerValue !== undefined
                ? `  **(${dealerValue})**`
                : ""
        }`,
        "",
        `**${status}**`,
    ];

    return lines.join("\n");
}

async function animateBlackjackStart(
    interaction,
    game,
    createEmbed,
    components
) {
    const playerHand = [];
    const dealerHand = [];

    const initialDealer = game.dealerHand?.[0];

    const message = await interaction.reply({
        embeds: [
            createAnimationEmbed(
                createEmbed,
                "🃏  VAULT • BLACKJACK",
                `## 🃏 DEALING...\n\n**Your Hand**\n🂠\n\n**Dealer**\n🂠  🂠`
            ),
        ],
        components: [],
        fetchReply: true,
    });

    await sleep(500);

    if (game.playerHand?.[0]) {
        playerHand.push(game.playerHand[0]);
    }

    await message.edit({
        embeds: [
            createAnimationEmbed(
                createEmbed,
                "🃏  VAULT • BLACKJACK",
                createBlackjackAnimationDescription(
                    playerHand,
                    [initialDealer, { rank: "?", suit: "" }],
                    undefined,
                    undefined,
                    "🃏 DEALING..."
                )
            ),
        ],
    });

    await sleep(500);

    if (game.playerHand?.[1]) {
        playerHand.push(game.playerHand[1]);
    }

    await message.edit({
        embeds: [
            createAnimationEmbed(
                createEmbed,
                "🃏  VAULT • BLACKJACK",
                createBlackjackAnimationDescription(
                    playerHand,
                    [initialDealer, { rank: "?", suit: "" }],
                    game.player?.value,
                    undefined,
                    "🃏 DEALING..."
                )
            ),
        ],
    });

    await sleep(500);

    await message.edit({
        embeds: [
            createAnimationEmbed(
                createEmbed,
                "🃏  VAULT • BLACKJACK",
                createBlackjackAnimationDescription(
                    game.playerHand || [],
                    [initialDealer, { rank: "?", suit: "" }],
                    game.player?.value,
                    undefined,
                    "🎯 YOUR TURN"
                )
            ),
        ],
        components,
    });

    return message;
}

async function animateBlackjackHit(
    interaction,
    game,
    createEmbed,
    components
) {
    const hand = game.playerHand || [];

    await interaction.update({
        embeds: [
            createAnimationEmbed(
                createEmbed,
                "🃏  VAULT • BLACKJACK",
                createBlackjackAnimationDescription(
                    hand.slice(0, -1),
                    [game.dealerHand?.[0], { rank: "?", suit: "" }],
                    undefined,
                    undefined,
                    "👊 DRAWING CARD..."
                )
            ),
        ],
        components: [],
    });

    await sleep(650);

    return interaction.editReply({
        embeds: [
            createAnimationEmbed(
                createEmbed,
                "🃏  VAULT • BLACKJACK",
                createBlackjackAnimationDescription(
                    hand,
                    [game.dealerHand?.[0], { rank: "?", suit: "" }],
                    game.player?.value,
                    undefined,
                    "🎯 YOUR TURN"
                )
            ),
        ],
        components,
    });
}

async function animateBlackjackResolution(
    interaction,
    result,
    createEmbed,
    components
) {
    const playerHand = result.player?.hand || [];
    const dealerHand = result.dealer?.hand || [];

    await interaction.update({
        embeds: [
            createAnimationEmbed(
                createEmbed,
                "🃏  VAULT • BLACKJACK",
                createBlackjackAnimationDescription(
                    playerHand,
                    dealerHand.length
                        ? [dealerHand[0], { rank: "?", suit: "" }]
                        : [],
                    result.player?.value,
                    undefined,
                    "🎴 DEALER REVEALING..."
                )
            ),
        ],
        components: [],
    });

    await sleep(800);

    await interaction.editReply({
        embeds: [
            createAnimationEmbed(
                createEmbed,
                "🃏  VAULT • BLACKJACK",
                createBlackjackAnimationDescription(
                    playerHand,
                    dealerHand,
                    result.player?.value,
                    result.dealer?.value,
                    "🎲 DEALER PLAYING..."
                )
            ),
        ],
        components: [],
    });

    await sleep(900);

    return interaction.editReply({
        embeds: [
            createAnimationEmbed(
                createEmbed,
                "🃏  VAULT • BLACKJACK",
                createBlackjackAnimationDescription(
                    playerHand,
                    dealerHand,
                    result.player?.value,
                    result.dealer?.value,
                    "🎯 RESULT REVEALED"
                )
            ),
        ],
        components,
    });
}

/*
 * GIVE
 *
 * Shows the transfer progressing through the
 * presentation states. The actual transfer has
 * already been handled by the economy service.
 */
async function animateGive(
    interaction,
    result,
    createEmbed
) {
    const message = await interaction.reply({
        embeds: [
            createAnimationEmbed(
                createEmbed,
                "💸  VAULT • TRANSFER",
                "## 📤 SENDING...\n\nPreparing your transfer."
            ),
        ],
        fetchReply: true,
    });

    await sleep(700);

    await message.edit({
        embeds: [
            createAnimationEmbed(
                createEmbed,
                "💸  VAULT • TRANSFER",
                "## 🔐 SECURING...\n\nSecuring the transaction."
            ),
        ],
    });

    await sleep(800);

    await message.edit({
        embeds: [
            createAnimationEmbed(
                createEmbed,
                "💸  VAULT • TRANSFER",
                "## ✅ SENT\n\nYour transfer has been completed."
            ),
        ],
    });

    await sleep(2500);

    return message;
}

/*
 * JACKPOT
 *
 * The animation only presents the already-resolved
 * jackpot result. It does not select a winner,
 * calculate payouts, or modify balances.
 */
async function animateJackpot(
    interaction,
    result,
    createEmbed
) {
    const message = await interaction.reply({
        embeds: [
            createAnimationEmbed(
                createEmbed,
                "🎰  VAULT • JACKPOT",
                "## 🎰 JACKPOT\n\nThe jackpot is being drawn..."
            ),
        ],
        fetchReply: true,
    });

    await sleep(700);

    await message.edit({
        embeds: [
            createAnimationEmbed(
                createEmbed,
                "🎰  VAULT • JACKPOT",
                "## 🎲 DRAWING...\n\nSelecting the winning contribution..."
            ),
        ],
    });

    await sleep(900);

    await message.edit({
        embeds: [
            createAnimationEmbed(
                createEmbed,
                "🎰  VAULT • JACKPOT",
                "## 🎯 WINNER...\n\nThe jackpot winner is being revealed..."
            ),
        ],
    });

    await sleep(1000);

    const winner =
        result.winner?.username ||
        result.winner?.name ||
        result.winnerName ||
        "WINNER";

    const payout =
        result.payout ??
        result.winnerPayout ??
        0;

    await message.edit({
        embeds: [
            createAnimationEmbed(
                createEmbed,
                "🎰  VAULT • JACKPOT",
                `## 🏆 ${winner}\n\n**🎉 JACKPOT WINNER!**\n\n💰 **Payout:** ${payout.toLocaleString()}`
            ),
        ],
    });

    await sleep(2500);

    return message;
}

module.exports = {
    animateSpin,
    animateCoinflip,
    animateDouble,
    animateBlackjackStart,
    animateBlackjackHit,
    animateBlackjackResolution,
    animateGive,
    animateJackpot,
};