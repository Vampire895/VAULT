const fs = require("fs");
const path = require("path");

const { PermissionFlagsBits } = require("discord.js");

const { createEmbed } = require("../ui/embedBuilder");

const { AppError, ERROR_CODES } = require("../errors");

const EMBEDS_DIRECTORY = path.join(__dirname, "../embeds");

function loadEmbeds() {
    const files = fs.readdirSync(EMBEDS_DIRECTORY);
    const embeds = new Map();

    for (const file of files) {
        if (!file.endsWith(".js")) continue;

        const filePath = path.join(EMBEDS_DIRECTORY, file);

        delete require.cache[require.resolve(filePath)];

        const embed = require(filePath);

        if (
            !embed ||
            typeof embed.name !== "string" ||
            typeof embed.build !== "function"
        ) {
            continue;
        }

        embeds.set(embed.name, embed);
    }

    return embeds;
}

function getEmbedChoices() {
    return [...loadEmbeds().keys()];
}

module.exports = {
    name: "embed",

    description: "Send a permanent VAULT information panel.",

    options: [
        {
            name: "name",
            description: "The embed panel to send.",
            type: 3,
            required: true,
            autocomplete: true,
        },
    ],

    async autocomplete(interaction) {
        const focused = interaction.options
            .getFocused()
            .toLowerCase();

        const choices = getEmbedChoices()
            .filter(name =>
                name.toLowerCase().includes(focused)
            )
            .slice(0, 25);

        await interaction.respond(
            choices.map(name => ({
                name,
                value: name,
            }))
        );
    },

    async execute(interaction) {
        if (
            !interaction.memberPermissions?.has(
                PermissionFlagsBits.Administrator
            )
        ) {
            throw new AppError(ERROR_CODES.ADMIN_ONLY);
        }

        const embedName = interaction.options.getString(
            "name",
            true
        );

        const embeds = loadEmbeds();
        const embed = embeds.get(embedName);

        if (!embed) {
            throw new AppError(
                ERROR_CODES.INVALID_INPUT,
                `Unknown embed panel: ${embedName}`
            );
        }

        const payload = await embed.build(interaction);

        if (
            !payload ||
            !Array.isArray(payload.embeds)
        ) {
            throw new AppError(
                ERROR_CODES.INVALID_INPUT,
                "The selected embed panel is invalid."
            );
        }

        await interaction.channel.send(payload);

        const confirmation = createEmbed({
            title: "✅ Embed Sent",
            description:
                `The **${embedName}** panel has been sent to this channel.`,
        });

        await interaction.reply({
            embeds: [confirmation],
            ephemeral: true,
        });
    },
};