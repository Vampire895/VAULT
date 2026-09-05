const { createEmbed } = require("./embedBuilder");

function formatBalance({ user, balance }) {
    return createEmbed({
        title: "💰 Balance",
        description: `${user}, you currently have **${balance.toLocaleString()} coins**.`,
    });
}

function formatTransfer({ sender, recipient, amount }) {
    return createEmbed({
        title: "💸 Transfer Complete",
        description:
            `${sender} sent **${amount.toLocaleString()} coins** to ${recipient}.`,
    });
}

module.exports = {
    formatBalance,
    formatTransfer,
};