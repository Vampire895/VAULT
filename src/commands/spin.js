const {
    ApplicationCommandOptionType,
} = require("discord.js");

const slotSettlementService =
    require("../services/slotSettlementService");

const configurationService =
    require("../services/configurationService");

const { createEmbed } =
    require("../ui/embedBuilder");

const { animateSpin } =
    require("../ui/gameAnimation");

function formatNumber(value) {
    return value.toLocaleString("en-US");
}

function createSpinEmbed(result) {
    const symbols = result.symbols
        .map((symbol) => symbol.display)
        .join("  ");

    const isWin = result.payout > 0;

    return createEmbed({
        title: "🎰  VAULT • CLASSIC",
        description:
            `## ${symbols}\n\n` +
            `**${result.outcome.tier.toUpperCase()}** · ${result.outcome.multiplier}×`,
        footer: "VAULT • Classic",
    }).addFields(
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
        }
    );
}

module.exports = {
    name: "spin",
    aliases: ["s"],
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

            await animateSpin(
                interaction,
                result,
                createEmbed
            );

            const message =
                await interaction.fetchReply();

            await message.edit({
                embeds: [
                    createSpinEmbed(result),
                ],
            });
        } catch (error) {
            if (
                interaction.replied ||
                interaction.deferred
            ) {
                await interaction.followUp({
                    content: `❌ ${error.message}`,
                    flags: 64,
                });
            } else {
                await interaction.reply({
                    content: `❌ ${error.message}`,
                    flags: 64,
                });
            }
        }
    },
};