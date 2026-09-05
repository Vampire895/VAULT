module.exports = {
    name: "test",
    description: "Check whether VAULT is working.",

    async execute(interaction) {
        await interaction.reply("🟢 VAULT command system is working!");
    },
};