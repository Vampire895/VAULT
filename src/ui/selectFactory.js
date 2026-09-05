const {
    StringSelectMenuBuilder,
} = require("discord.js");

function createSelectMenu({
    customId,
    placeholder,
    options,
    minValues = 1,
    maxValues = 1,
}) {
    return new StringSelectMenuBuilder()
        .setCustomId(customId)
        .setPlaceholder(placeholder)
        .setMinValues(minValues)
        .setMaxValues(maxValues)
        .addOptions(options);
}

module.exports = {
    createSelectMenu,
};