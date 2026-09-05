const economyService = require("../services/economyService");
const { formatBalance } = require("../ui/economyFormatter");

module.exports = {
    name: "balance",
    description: "Check your current coin balance.",

    async execute(interaction) {
        const balance = economyService.getBalance(
    interaction.user.id
);

        const embed = formatBalance({
            user: interaction.user,
            balance,
        });

        await interaction.reply({
            embeds: [embed],
        });
    },
};