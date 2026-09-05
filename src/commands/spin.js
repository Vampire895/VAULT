const {
    ApplicationCommandOptionType,
} = require("discord.js");

const slotSettlementService = require("../services/slotSettlementService");
const configurationService = require("../services/configurationService");

function formatNumber(value) {
    return value.toLocaleString("en-US");
}

function createSpinEmbed(result) {
    const symbols = result.symbols
        .map((symbol) => symbol.display)
        .join("  ");

    const isWin = result.payout > 0;

    return {
        title: "🎰  VAULT • CLASSIC",
        description:
            `## ${symbols}\n\n` +
            `**${result.outcome.tier.toUpperCase()}** · ${result.outcome.multiplier}×`,
        fields: [
            {
                name: "Wager",
                value: `🪙 ${formatNumber(result.bet)}`,
                inline: true,
            },
            {
                name: isWin ? "Win" : "Payout",
                value: `🪙 ${formatNumber(result.payout)}`,
                inline: true,
            },
            {
                name: "Balance",
                value: `🪙 ${formatNumber(result.balanceAfter)}`,
                inline: true,
            },
        ],
        footer: {
            text: "VAULT • Classic",
        },
    };
}

module.exports = {
    name: "spin",
    description: "Spin the Classic slot machine.",

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
                slotSettlementService.play(
                    interaction.user.id,
                    "classic",
                    bet
                );

            await interaction.reply({
                embeds: [
                    createSpinEmbed(result),
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