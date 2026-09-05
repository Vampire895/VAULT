const configurationService = require("../services/configurationService");
const { formatConfiguration } = require("../ui/configurationFormatter");
const {
    createConfigurationButtons,
} = require("../ui/configurationComponents");

module.exports = {
    name: "config",
    description: "Manage VAULT configuration.",

    async execute(interaction) {
        if (!interaction.memberPermissions?.has("Administrator")) {
            await interaction.reply({
                content: "❌ You do not have permission to use this command.",
                flags: 64,
            });

            return;
        }

        const config = {
            startingBalance:
                configurationService.getStaged("startingBalance"),

            minimumBet:
                configurationService.getStaged("minimumBet"),

            defaultPrefix:
                configurationService.getStaged("defaultPrefix"),
        };

        const embed = formatConfiguration(
            config,
            configurationService.isDirty()
        );

        await interaction.reply({
    embeds: [embed],
    components: [createConfigurationButtons()],
});
    },
};