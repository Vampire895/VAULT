/*
 * --------------------------------
 * Formatting
 * --------------------------------
 */

function formatEthers(amount) {

    return Number(
        amount
    ).toLocaleString(
        "en-US"
    );
}


/*
 * --------------------------------
 * Current Jackpot
 * --------------------------------
 */

function formatJackpot(
    amount
) {

    return [
        "🎰 **Daily Jackpot**",
        "",
        `💰 **${formatEthers(amount)} Ethers**`,
    ].join("\n");
}


/*
 * --------------------------------
 * Contribution Result
 * --------------------------------
 */

function formatContribution({
    contribution,
    jackpot,
}) {

    return [
        "🎰 **Jackpot Contribution**",
        "",
        `➕ Added **${formatEthers(contribution)} Ethers**`,
        `💰 Jackpot: **${formatEthers(jackpot)} Ethers**`,
    ].join("\n");
}


/*
 * --------------------------------
 * Settlement Result
 * --------------------------------
 */

function formatSettlement(
    result,
    client
) {

    if (
        result.reason ===
        "NO_CONTRIBUTORS"
    ) {

        return [
            "🎰 **Daily Jackpot Draw**",
            "",
            "Nobody contributed today.",
            `🏦 **${formatEthers(result.houseAmount)} Ethers** went to the House Purse.`,
        ].join("\n");
    }


    const winnerMention =
        `<@${result.winner.userId}>`;


    const lines = [
        "🎰 **Daily Jackpot Draw**",
        "",
        `🏆 Winner: ${winnerMention}`,
        `🎟️ Contribution: **${formatEthers(result.winner.contribution)} Ethers**`,
        `💰 Winner payout: **${formatEthers(result.winner.payout)} Ethers**`,
    ];


    if (
        result.distributions.length > 0
    ) {

        lines.push(
            "",
            "💎 **Contributor Distribution**"
        );


        for (
            const distribution
            of result.distributions
        ) {

            lines.push(
                `<@${distribution.userId}> → **${formatEthers(distribution.payout)} Ethers**`
            );
        }
    }


    if (
        result.houseRemainder > 0
    ) {

        lines.push(
            "",
            `🏦 House Purse: **${formatEthers(result.houseRemainder)} Ethers**`
        );
    }


    lines.push(
        "",
        `🎰 Next Jackpot: **${formatEthers(result.nextJackpot)} Ethers**`
    );


    return lines.join("\n");
}


module.exports = {

    formatEthers,

    formatJackpot,

    formatContribution,

    formatSettlement,

};