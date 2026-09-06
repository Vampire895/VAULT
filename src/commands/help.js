const { createEmbed } = require("../ui/embedBuilder");
const { getCommands } = require("../registries/commandRegistry");

module.exports = {
    name: "help",
    description: "List all Fortune commands.",

    async execute(interaction) {
        const commands = getCommands();
        const commandNames = [...commands.keys()];

        const embed = createEmbed({
            title: "🎰 Fortune Commands",
            description: commandNames.join(", "),
            footer: "Use /daily every 24 hours to claim your daily reward.",
        });

        await interaction.reply({ embeds: [embed] });
    },
};