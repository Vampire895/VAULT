const {
    ApplicationCommandOptionType,
} = require("discord.js");

const coinflipSettlementService = require("../services/coinflipSettlementService");
const configurationService = require("../services/configurationService");

function formatNumber(value) {
    return value.toLocaleString("en-US");
}

function createCoinflipEmbed(result) {
    const resultDisplay =
        result.result === "heads"
            ? "HEADS"
            : "TAILS";

    const choiceDisplay =
        result.choice === "heads"
            ? "Heads"
            : "Tails";

    return {
        title: "🪙  VAULT • COINFLIP",

        description:
            `## ${resultDisplay}\n\n` +
            `You called **${choiceDisplay}**.`,

        fields: [
            {
                name: "Wager",
                value: `🪙 ${formatNumber(result.bet)}`,
                inline: true,
            },
            {
                name: result.won ? "Win" : "Payout",
                value: result.won
                    ? `🪙 ${formatNumber(result.payout)}`
                    : "🪙 0",
                inline: true,
            },
            {
                name: "Balance",
                value: `🪙 ${formatNumber(result.balanceAfter)}`,
                inline: true,
            },
        ],

        footer: {
            text: "VAULT • CoinFlip",
        },
    };
}

module.exports = {
    name: "coinflip",
    description: "Call heads or tails and flip the coin.",

    options: [
        {
            name: "bet",
            description: "The amount of coins to wager.",
            type: ApplicationCommandOptionType.Integer,
            required: true,
            min_value: 1,
        },
        {
            name: "choice",
            description: "Heads or tails. Defaults to heads.",
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
                {
                    name: "Heads",
                    value: "heads",
                },
                {
                    name: "Tails",
                    value: "tails",
                },
            ],
        },
    ],

    async execute(interaction) {
        const bet =
            interaction.options.getInteger("bet");

        const choice =
            interaction.options.getString("choice");

        const minimumBet =
            configurationService.getMinimumBet();

        if (
            !Number.isSafeInteger(bet) ||
            bet < minimumBet
        ) {
            await interaction.reply({
                content:
                    `❌ Minimum bet is ${formatNumber(minimumBet)} coins.`,
                flags: 64,
            });

            return;
        }

        try {
            const result =
                coinflipSettlementService.play(
                    interaction.user.id,
                    bet,
                    choice
                );

            await interaction.reply({
                embeds: [
                    createCoinflipEmbed(result),
                ],
            });
        } catch (error) {
            await interaction.reply({
                content: `❌ ${error.message}`,
                flags: 64,
            });
        }
    },
};