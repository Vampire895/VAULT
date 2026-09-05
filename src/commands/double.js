const {
    ApplicationCommandOptionType,
} = require("discord.js");

const doubleOrNothingService = require("../services/doubleOrNothingService");
const configurationService = require("../services/configurationService");

function formatNumber(value) {
    return value.toLocaleString("en-US");
}

function createDoubleEmbed(result) {
    const won = result.result === "win";

    return {
        title: "🎲  VAULT • DOUBLE OR NOTHING",

        description: won
            ? "## 🎉 DOUBLE!\n\nYou doubled your wager."
            : "## 💥 LOST!\n\nBetter luck next time.",

        fields: [
            {
                name: "Wager",
                value: `🪙 ${formatNumber(result.bet)}`,
                inline: true,
            },
            {
                name: won ? "Payout" : "Payout",
                value: won
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
            text: "VAULT • Double or Nothing",
        },
    };
}

module.exports = {
    name: "double",
    description: "Double your wager or lose it.",

    options: [
        {
            name: "bet",
            description: "The amount of coins to wager.",
            type: ApplicationCommandOptionType.Integer,
            required: true,
            min_value: 1,
        },
    ],

    async execute(interaction) {
        const bet =
            interaction.options.getInteger("bet");

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
                doubleOrNothingService.play(
                    interaction.user.id,
                    bet
                );

            await interaction.reply({
                embeds: [
                    createDoubleEmbed(result),
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