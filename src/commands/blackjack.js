const {
    ApplicationCommandOptionType,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");

const blackjackGameService =
    require("../services/blackjackGameService");

function formatHand(hand) {
    return hand
        .map(card => `${card.rank}${card.suit}`)
        .join("  ");
}

function createGameEmbed(game) {
    const playerValue = game.player.value;

    const dealerVisibleHand = [
        game.dealerHand[0],
        {
            rank: "?",
            suit: "",
        },
    ];

    return new EmbedBuilder()
        .setTitle("🃏 Blackjack")
        .setDescription(
            [
                `**Your Hand**`,
                `${formatHand(game.playerHand)}  **(${playerValue})**`,
                "",
                `**Dealer**`,
                `${formatHand(dealerVisibleHand)}`,
                "",
                `💰 **Bet:** ${game.bet.toLocaleString()}`,
            ].join("\n")
        );
}

function createButtons(userId) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`bj_hit_${userId}`)
            .setLabel("Hit")
            .setEmoji("👊")
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId(`bj_stand_${userId}`)
            .setLabel("Stand")
            .setEmoji("🛑")
            .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
            .setCustomId(`bj_double_${userId}`)
            .setLabel("Double")
            .setEmoji("💰")
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId(`bj_cancel_${userId}`)
            .setLabel("Cancel")
            .setEmoji("❌")
            .setStyle(ButtonStyle.Danger)
    );
}

function createFinalEmbed(result) {
    const playerHand = result.player?.hand || [];
    const dealerHand = result.dealer?.hand || [];

    let title = "🃏 Blackjack";

    switch (result.status) {
        case "blackjack":
            title = "🎉 Blackjack!";
            break;

        case "player_win":
            title = "🎉 You Win!";
            break;

        case "push":
            title = "🤝 Push!";
            break;

        case "dealer_win":
            title = "💀 Dealer Wins";
            break;

        case "dealer_bust":
            title = "💥 Dealer Busts!";
            break;

        case "player_bust":
            title = "💥 You Busted!";
            break;
    }

    const lines = [];

    if (playerHand.length > 0) {
        const playerValue =
            result.player.value;

        lines.push(
            `**Your Hand**`,
            `${formatHand(playerHand)}  **(${playerValue})**`
        );
    }

    if (dealerHand.length > 0) {
        const dealerValue =
            result.dealer.value;

        lines.push(
            "",
            `**Dealer**`,
            `${formatHand(dealerHand)}  **(${dealerValue})**`
        );
    }

    lines.push(
        "",
        `💰 **Bet:** ${result.bet.toLocaleString()}`
    );

    if (result.doubled) {
        lines.push("⚡ **Doubled Down**");
    }

    if (result.payout > 0) {
        lines.push(
            `💵 **Payout:** ${result.payout.toLocaleString()}`
        );
    } else {
        lines.push("💵 **Payout:** 0");
    }

    return new EmbedBuilder()
        .setTitle(title)
        .setDescription(lines.join("\n"));
}

function getDisabledButtons(userId) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`bj_hit_${userId}`)
            .setLabel("Hit")
            .setEmoji("👊")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true),

        new ButtonBuilder()
            .setCustomId(`bj_stand_${userId}`)
            .setLabel("Stand")
            .setEmoji("🛑")
            .setStyle(ButtonStyle.Success)
            .setDisabled(true),

        new ButtonBuilder()
            .setCustomId(`bj_double_${userId}`)
            .setLabel("Double")
            .setEmoji("💰")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),

        new ButtonBuilder()
            .setCustomId(`bj_cancel_${userId}`)
            .setLabel("Cancel")
            .setEmoji("❌")
            .setStyle(ButtonStyle.Danger)
            .setDisabled(true)
    );
}

async function execute(interaction) {
    const bet =
        interaction.options.getInteger("bet");

    const userId =
        interaction.user.id;

    const result =
        blackjackGameService.start(
            userId,
            bet
        );

    /*
     * Natural Blackjack / Dealer Blackjack
     * resolves immediately and does not create
     * an active session.
     */
    if (result.resolution.status !== "player_turn") {
        /*
         * Settlement belongs to the service layer.
         *
         * The round service has already deducted
         * the original bet, so settle the result here.
         */
        const finalResult =
            require("../services/blackjackGameService");

        const settlement =
            require("../services/blackjackSettlementService");

        const settled =
            settlement.settle(
                userId,
                {
                    ...result.resolution,
                    bet: result.bet,
                }
            );

        await interaction.reply({
            embeds: [
                createFinalEmbed({
                    ...result.resolution,
                    bet: result.bet,
                    payout: settled.payout,
                    doubled: false,
                }),
            ],
        });

        return;
    }

    const game =
        blackjackGameService.getGame(userId);

    await interaction.reply({
        embeds: [
            createGameEmbed(game),
        ],
        components: [
            createButtons(userId),
        ],
    });
}

async function handleButton(interaction) {
    const [prefix, action, ownerId] =
        interaction.customId.split("_");

    if (prefix !== "bj") {
        return false;
    }

    if (interaction.user.id !== ownerId) {
        await interaction.reply({
            content:
                "❌ This isn't your Blackjack game.",
            ephemeral: true,
        });

        return true;
    }

    let result;

    try {
        switch (action) {
            case "hit":
                result =
                    blackjackGameService.hit(
                        ownerId
                    );
                break;

            case "stand":
                result =
                    blackjackGameService.stand(
                        ownerId
                    );
                break;

            case "double":
                result =
                    blackjackGameService.doubleDown(
                        ownerId
                    );
                break;

            case "cancel":
                result =
                    blackjackGameService.cancel(
                        ownerId
                    );

                await interaction.update({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(
                                "❌ Blackjack Cancelled"
                            )
                            .setDescription(
                                `Your active Blackjack game was cancelled.\n\n` +
                                `💰 Original bet: **${result.bet.toLocaleString()}**`
                            ),
                    ],
                    components: [
                        getDisabledButtons(
                            ownerId
                        ),
                    ],
                });

                return true;

            default:
                return false;
        }
    } catch (error) {
        await interaction.reply({
            content: `❌ ${error.message}`,
            ephemeral: true,
        });

        return true;
    }

    /*
     * Player is still choosing.
     */
    if (result.status === "player_turn") {
        const game =
            blackjackGameService.getGame(
                ownerId
            );

        await interaction.update({
            embeds: [
                createGameEmbed(game),
            ],
            components: [
                createButtons(ownerId),
            ],
        });

        return true;
    }

    /*
     * Round has resolved.
     */
    await interaction.update({
        embeds: [
            createFinalEmbed(result),
        ],
        components: [
            getDisabledButtons(ownerId),
        ],
    });

    return true;
}

module.exports = {
    name: "blackjack",
    aliases: ["bj"],
    description: "Play Blackjack against the dealer.",

    options: [
        {
            name: "bet",
            description: "The amount of coins to bet.",
            type: ApplicationCommandOptionType.Integer,
            required: true,
            min_value: 1,
        },
    ],

    execute,
    handleButton,
};