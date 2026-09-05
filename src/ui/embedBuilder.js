const { EmbedBuilder } = require("discord.js");

function createEmbed(options = {}) {
    const embed = new EmbedBuilder();

    if (options.title) {
        embed.setTitle(options.title);
    }

    if (options.description) {
        embed.setDescription(options.description);
    }

    if (options.footer) {
        embed.setFooter({ text: options.footer });
    }

    if (options.timestamp) {
        embed.setTimestamp();
    }

    return embed;
}

module.exports = {
    createEmbed,
};