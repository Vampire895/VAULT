const {
    ApplicationCommandOptionType,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");

const blackjackGameService =
    require("../services/blackjackGameService");

const blackjackSettlementService =
    require("../services/blackjackSettlementService");

const configurationService =
    require("../services/configurationService");

const { createEmbed } =
    require("../ui/embedBuilder");

const {
    animateBlackjackStart,
    animateBlackjackHit,
    animateBlackjackResolution,
} = require("../ui/gameAnimation");

function formatHand(hand) {
    return hand
        .map((card) => `${card.rank}${card.suit}`)
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
                "**Your Hand**",
                `${formatHand(game.playerHand)}  **(${playerValue})**`,
                "",
                "**Dealer**",
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
        lines.push(
            "**Your Hand**",
            `${formatHand(playerHand)}  **(${result.player.value})**`
        );
    }

    if (dealerHand.length > 0) {
        lines.push(
            "",
            "**Dealer**",
            `${formatHand(dealerHand)}  **(${result.dealer.value})**`
        );
    }

    lines.push(
        "",
        `💰 **Bet:** ${result.bet.toLocaleString()}`,
        result.doubled ? "⚡ **Doubled Down**" : "",
        `💵 **Payout:** ${
            result.payout > 0
                ? result.payout.toLocaleString()
                : "0"
        }`
    );

    return new EmbedBuilder()
        .setTitle(title)
        .setDescription(
            lines.filter(Boolean).join("\n")
        );
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

    try {
        const result =
            blackjackGameService.start(
                userId,
                bet
            );

        /*
         * Natural Blackjack / Dealer Blackjack
         * resolves immediately.
         */
        if (
            result.resolution.status !==
            "player_turn"
        ) {
            const settled =
                blackjackSettlementService.settle(
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

        await animateBlackjackStart(
            interaction,
            game,
            createEmbed,
            createButtons(userId)
        );
    } catch (error) {
        if (
            interaction.replied ||
            interaction.deferred
        ) {
            await interaction.editReply({
                content: `❌ ${error.message}`,
                embeds: [],
                components: [],
            });
        } else {
            await interaction.reply({
                content: `❌ ${error.message}`,
                flags: 64,
            });
        }
    }
}

async function handleButton(interaction) {
    const [
        prefix,
        action,
        ownerId,
    ] = interaction.customId.split("_");

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

    try {
        let result;

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
                                `💰 **Original bet:** ${result.bet.toLocaleString()}`
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

        /*
         * Player still has control.
         */
        if (
            result.status ===
            "player_turn"
        ) {
            const game =
                blackjackGameService.getGame(
                    ownerId
                );

            if (action === "hit") {
                await animateBlackjackHit(
                    interaction,
                    game,
                    createEmbed,
                    createButtons(ownerId)
                );
            } else {
                await interaction.update({
                    embeds: [
                        createGameEmbed(game),
                    ],
                    components: [
                        createButtons(ownerId),
                    ],
                });
            }

            return true;
        }

        /*
         * Round resolved.
         */
        await animateBlackjackResolution(
            interaction,
            result,
            createEmbed,
            getDisabledButtons(ownerId)
        );

        await interaction.editReply({
            embeds: [
                createFinalEmbed(result),
            ],
            components: [
                getDisabledButtons(ownerId),
            ],
        });

        return true;
    } catch (error) {
        await interaction.reply({
            content: `❌ ${error.message}`,
            ephemeral: true,
        });

        return true;
    }
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