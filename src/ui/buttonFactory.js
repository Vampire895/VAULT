const {
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");


function createButton({
    customId,
    label,
    style = ButtonStyle.Secondary,
    emoji,
    disabled = false,
    url,
}) {

    const button =
        new ButtonBuilder()
            .setLabel(label)
            .setStyle(style);


    if (url) {
        button.setURL(url);
    } else if (customId) {
        button.setCustomId(customId);
        button.setDisabled(disabled);
    } else {
        throw new Error(
            "A button requires either customId or url."
        );
    }


    if (emoji) {
        button.setEmoji(emoji);
    }


    return button;
}


module.exports = {
    createButton,
};