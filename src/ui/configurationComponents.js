const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    RoleSelectMenuBuilder,
} = require("discord.js");

function createConfigurationButtons({
    editing = false,
    roleGiftsEnabled = false,
} = {}) {
    if (editing) {
        return new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("config_role_add")
                .setLabel("Add Role")
                .setEmoji("➕")
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId("config_save")
                .setLabel("Save")
                .setEmoji("💾")
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId("config_discard")
                .setLabel("Discard")
                .setEmoji("↩️")
                .setStyle(ButtonStyle.Secondary)
        );
    }

    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("config_edit")
            .setLabel("Edit")
            .setEmoji("✏️")
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId(
                roleGiftsEnabled
                    ? "config_role_disable"
                    : "config_role_enable"
            )
            .setLabel(
                roleGiftsEnabled
                    ? "Disable"
                    : "Enable"
            )
            .setEmoji(
                roleGiftsEnabled
                    ? "🔴"
                    : "🟢"
            )
            .setStyle(
                roleGiftsEnabled
                    ? ButtonStyle.Danger
                    : ButtonStyle.Success
            )
    );
}

function createRoleSelect() {
    return new ActionRowBuilder().addComponents(
        new RoleSelectMenuBuilder()
            .setCustomId("config_role_select")
            .setPlaceholder("Select a role to reward")
            .setMinValues(1)
            .setMaxValues(1)
    );
}

module.exports = {
    createConfigurationButtons,
    createRoleSelect,
};