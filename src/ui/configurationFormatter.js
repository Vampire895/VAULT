const { createEmbed } = require("./embedBuilder");

function formatConfiguration(
    config,
    dirty = false
) {
    const roleGiftStatus =
        config.roleGiftsEnabled
            ? "Enabled"
            : "Disabled";

    let roleGiftText =
        `🎁 Role Gifts: **${roleGiftStatus}**`;

    if (
        config.roleGiftsEnabled &&
        config.roleGifts.length > 0
    ) {
        roleGiftText += "\n";

        roleGiftText += config.roleGifts
            .map(
                (gift, index) =>
                    `${index + 1}. <@&${gift.roleId}> → **${gift.amount.toLocaleString()}**`
            )
            .join("\n");
    }

    return createEmbed({
        title: "⚙️ VAULT Configuration",
        description:
            `💰 Starting Balance: **${config.startingBalance.toLocaleString()}**\n` +
            `🎰 Minimum Bet: **${config.minimumBet.toLocaleString()}**\n` +
            `📌 Default Prefix: **${config.defaultPrefix}**\n\n` +
            `${roleGiftText}\n\n` +
            `Status: **${dirty ? "Unsaved Changes" : "Saved"}**`,
    });
}

module.exports = {
    formatConfiguration,
};