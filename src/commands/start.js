const { ActionRowBuilder, ButtonStyle } = require("discord.js");

const economyService = require("../services/economyService");

const { createEmbed } = require("../ui/embedBuilder");
const { createButton } = require("../ui/buttonFactory");

const { handleError } = require("../errors");

const START_TIMEOUT = 3 * 60 * 1000;

function createStartEmbed() {
    return createEmbed({
        title: "🎰 Welcome to Fortune",
        description: "Welcome to **Fortune** — your server's economy and casino.\n\nBefore you start, please read the basic rules below.",
        footer: "You must agree before receiving your starting balance.",
    });
}

function createRulesEmbed() {
    return createEmbed({
        title: "📜 Fortune Rules",
        description: "• Your Fortune balance is your responsibility.\n• Gambling bets must follow Fortune's minimum bet rules.\n• Do not exploit bugs, duplicate interactions, or game errors.\n• Fortune outcomes are determined by the game's defined mathematics and RNG.\n\n**Starting Balance:** `1,000 Ethers`\n\nClick **Agree** to create your Fortune account.",
    });
}

function createStartButtons(userId, disabled = false) {
    return new ActionRowBuilder().addComponents(
        createButton({ customId: `start_agree_${userId}`, label: "Agree", style: ButtonStyle.Success, disabled }),
        createButton({ customId: `start_cancel_${userId}`, label: "Cancel", style: ButtonStyle.Danger, disabled })
    );
}

async function execute(interaction) {
    const userId = interaction.user.id;

    if (economyService.hasAccount(userId)) {
        await interaction.reply({
            embeds: [createEmbed({ title: "🎰 Fortune Account", description: "You already have a Fortune account.\n\nYour starting balance has already been claimed. You can use Fortune in this server without creating another account. 🪙" })],
            ephemeral: true,
        });
        return;
    }

    await interaction.reply({
        embeds: [createStartEmbed(), createRulesEmbed()],
        components: [createStartButtons(userId)],
    });

    const message = await interaction.fetchReply();
    const timeout = setTimeout(async () => {
        try { await message.edit({ components: [createStartButtons(userId, true)] }); } catch {}
    }, START_TIMEOUT);

    if (typeof timeout.unref === "function") timeout.unref();
}

async function handleButton(interaction) {
    const parts = interaction.customId.split("_");
    if (parts.length !== 3 || parts[0] !== "start") return;

    const action = parts[1];
    const ownerId = parts[2];

    if (interaction.user.id !== ownerId) {
        await interaction.reply({ content: "❌ This onboarding belongs to another user.", ephemeral: true });
        return;
    }

    await interaction.deferUpdate();

    try { await interaction.message.edit({ components: [createStartButtons(ownerId, true)] }); } catch {}

    try {
        if (action === "cancel") {
            await interaction.message.edit({
                embeds: [createEmbed({ title: "❌ Fortune Onboarding Cancelled", description: "No Fortune account was created.\n\nYou can use `/start` again whenever you're ready." })],
                components: [createStartButtons(ownerId, true)],
            });
            return;
        }

        if (action === "agree") {
            const existingAccount = economyService.getExistingAccount(ownerId);

            if (existingAccount) {
                await interaction.message.edit({
                    embeds: [createEmbed({ title: "🎰 Fortune Account Already Exists", description: "You already have a Fortune account.\n\nYour starting balance has already been claimed, so no additional starting balance was added. 🪙" })],
                    components: [createStartButtons(ownerId, true)],
                });
                return;
            }

            const account = economyService.createAccount(ownerId);

            await interaction.message.edit({
                embeds: [createEmbed({ title: "🎉 Welcome to Fortune!", description: "Your Fortune account has been created!\n\n" + `🪙 Starting Balance: **${account.balance.toLocaleString()} Ethers**\n\n` + "You're ready to play. Good luck! 🍀" })],
                components: [createStartButtons(ownerId, true)],
            });
        }
    } catch (error) {
        await handleError(error, interaction, "start");
    }
}

module.exports = { name: "start", description: "Create your Fortune account and receive your starting balance.", execute, handleButton };