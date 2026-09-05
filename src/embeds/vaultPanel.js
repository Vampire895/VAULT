const { ActionRowBuilder, ButtonStyle } = require("discord.js");

const { createEmbed } = require("../ui/embedBuilder");
const { createButton } = require("../ui/buttonFactory");

function buildVaultPanel(interaction) {
    const guild = interaction.guild;
    const clientId = interaction.client.user.id;

    const inviteUrl =
        `https://discord.com/oauth2/authorize` +
        `?client_id=${clientId}` +
        `&scope=bot%20applications.commands` +
        `&permissions=0`;

    const embed = createEmbed({
        title: "🎰 VAULT — Getting Started",
        description:
            "Welcome to **VAULT**, a Discord economy & casino bot built for your server.\n" +
            "Create your account, manage your Ethers, and explore the available games.",
        footer: "VAULT • Economy & Casino",
    });

    // Server icon on the right side.
    if (guild?.iconURL) {
        embed.setThumbnail(
            guild.iconURL({
                size: 256,
                extension: "png",
            })
        );
    }

    // Server banner at the bottom.
    if (guild?.bannerURL) {
        embed.setImage(
            guild.bannerURL({
                size: 1024,
                extension: "png",
            })
        );
    }

    embed.addFields(
        {
            name: "🚀 How to Get Started",
            value:
                "• **Create your account** — Use `/start` and press **Agree** to receive **1,000 Ethers**.\n" +
                "• **Check your balance** — Use `/balance` to view your Ethers.\n" +
                "• **Explore commands** — Use `/help` to see all available commands.\n" +
                "• **Start playing** — Choose a game and place your bet.\n" +
                "• **Play responsibly** — Follow your server rules and gamble responsibly.",
        },
        {
            name: "👑 Created By",
            value:
                "• **Creator:** Vampire 🧛‍♂️\n" +
                "• **Language:** JavaScript\n" +
                "• **Runtime:** Node.js\n" +
                "• **Library:** Discord.js\n" +
                "• **Purpose:** Discord Economy & Casino",
        }
    );

    const inviteButton = createButton({
        label: "Invite VAULT",
        style: ButtonStyle.Link,
        emoji: "➕",
        url: inviteUrl,
    });

    return {
        embeds: [embed],
        components: [
            new ActionRowBuilder().addComponents(inviteButton),
        ],
    };
}

module.exports = {
    name: "vaultPanel",
    build: buildVaultPanel,
};