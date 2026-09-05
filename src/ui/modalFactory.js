const {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
} = require("discord.js");

function createTextModal({
    customId,
    title,
    inputId,
    label,
    placeholder,
    style = TextInputStyle.Short,
    required = true,
}) {
    const input = new TextInputBuilder()
        .setCustomId(inputId)
        .setLabel(label)
        .setStyle(style)
        .setRequired(required);

    if (placeholder) {
        input.setPlaceholder(placeholder);
    }

    return new ModalBuilder()
        .setCustomId(customId)
        .setTitle(title)
        .addComponents(
            new ActionRowBuilder().addComponents(input)
        );
}

module.exports = {
    createTextModal,
};