const developerIdentityService = require("../services/developerIdentityService");
const houseRepository = require("../database/houseRepository");

module.exports = {
    name: "devhouse",
    description: "View internal VAULT House state.",

    async execute(interaction) {
        if (
            !developerIdentityService.isDeveloperInteraction(
                interaction
            )
        ) {
            await interaction.reply({
                content: "❌ You do not have permission to use this command.",
                flags: 64,
            });

            return;
        }

        const house = houseRepository.getState();

        await interaction.reply({
            content:
                `🏦 **VAULT House**\n\n` +
                `💰 House Purse: **${house.housePurse.toLocaleString()}**\n` +
                `📅 Tax Last Run: **${house.taxLastRun ?? "Never"}**`,
            flags: 64,
        });
    },
};