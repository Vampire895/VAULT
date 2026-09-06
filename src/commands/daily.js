const dailyService = require("../services/dailyService");
const { createEmbed } = require("../ui/embedBuilder");
const { handleError } = require("../errors");

module.exports = {
    name: "daily",
    description: "Claim your daily Ether reward.",

    async execute(interaction) {
        try {
            const result = dailyService.claim(interaction.user.id);

            if (!result.claimed) {
                await interaction.reply({
                    embeds: [createEmbed({
                        title: "🌅 Daily Reward",
                        description: "You have already claimed your Daily reward today.\n\nCome back tomorrow for your next reward! 🪙",
                    })],
                    ephemeral: true,
                });
                return;
            }

            await interaction.reply({
                embeds: [createEmbed({
                    title: "🎁 Daily Reward Claimed!",
                    description: `You received **${result.reward.toLocaleString()} Ethers**!\n\n` +
                        `📅 Daily Claims: **${result.claimCount}**\n` +
                        `💰 New Balance: **${result.balance.toLocaleString()} Ethers**\n\n` +
                        `Your Daily reward increases by **50 Ethers** with every successful claim. 🔥`,
                })],
            });
        } catch (error) {
            await handleError(error, interaction, "daily");
        }
    },
};
