const {
    createEmbed,
} = require("./embedBuilder");


/*
 * -----------------------------
 * Helpers
 * -----------------------------
 */

function formatCoins(
    amount
) {
    return Number(
        amount
    ).toLocaleString();
}


function formatBetType(
    type
) {
    const labels = {
        straight: "Straight",
        red: "Red",
        black: "Black",
        dozen_1: "1st Dozen",
        dozen_2: "2nd Dozen",
        dozen_3: "3rd Dozen",
        column_1: "1st Column",
        column_2: "2nd Column",
        column_3: "3rd Column",
        low: "1–18",
        high: "19–36",
        odd: "Odd",
        even: "Even",
    };

    return (
        labels[type] ??
        String(type)
            .replace(
                /_/g,
                " "
            )
            .replace(
                /\b\w/g,
                (char) =>
                    char.toUpperCase()
            )
    );
}


function colorEmoji(
    color
) {
    if (color === "red") {
        return "🔴";
    }

    if (color === "black") {
        return "⚫";
    }

    if (color === "green") {
        return "🟢";
    }

    return "🎰";
}


function formatPlayerList(
    players = [],
    hostId = null
) {
    if (
        !players.length
    ) {
        return "No players yet.";
    }

    return players
        .map(
            (
                playerId,
                index
            ) => {
                const host =
                    playerId === hostId
                        ? " 👑"
                        : "";

                return (
                    `${index + 1}. <@${playerId}>${host}`
                );
            }
        )
        .join("\n");
}


/*
 * -----------------------------
 * Lobby
 * -----------------------------
 */

function formatRouletteLobby({
    session,
    minimumBet,
    houseEdge,
    rtp,
} = {}) {
    const players =
        session?.players ?? [];

    const maxPlayers =
        session?.maxPlayers ?? 6;

    const hostId =
        session?.hostId ?? null;

    return createEmbed({
        title:
            "🎰 VAULT Roulette",

        description:
            "European Roulette multiplayer lobby.\n\n" +

            `👥 Players: **${players.length}/${maxPlayers}**\n\n` +

            `${formatPlayerList(
                players,
                hostId
            )}\n\n` +

            `💰 Minimum Bet: **${formatCoins(
                minimumBet
            )}**\n` +

            `📈 RTP: **${(
                Number(rtp) * 100
            ).toFixed(2)}%**\n` +

            `🏠 House Edge: **${(
                Number(houseEdge) * 100
            ).toFixed(2)}%**\n\n` +

            "The host can start once at least **2 players** have joined.\n" +

            "All players will bet against the same roulette spin.",
    });
}


/*
 * -----------------------------
 * Betting
 * -----------------------------
 */

function formatRouletteBetting({
    session,
    minimumBet,
    remainingTime = null,
} = {}) {
    const players =
        session?.players ?? [];

    let description =
        `👥 Players: **${players.length}/${session?.maxPlayers ?? 6}**\n\n`;

    if (
        remainingTime !== null
    ) {
        const seconds =
            Math.ceil(
                Number(
                    remainingTime
                ) / 1000
            );

        description +=
            `⏱️ Betting closes in **${seconds}s**\n\n`;
    }

    description +=
        `💰 Minimum Bet: **${formatCoins(
            minimumBet
        )}**\n\n` +

        "Choose your roulette bet and wager.\n" +

        "Each player submits their own bet before the round locks.";

    return createEmbed({
        title:
            "🎰 Roulette — Betting",

        description,
    });
}


/*
 * -----------------------------
 * Number Selection
 * -----------------------------
 */

function formatNumberSelection({
    betType,
} = {}) {
    return createEmbed({
        title:
            "🎯 Roulette Number",

        description:
            `Bet Type: **${formatBetType(
                betType
            )}**\n\n` +

            "Choose the number you want to bet on.",
    });
}


/*
 * -----------------------------
 * Amount Selection
 * -----------------------------
 */

function formatBetAmount({
    betType,
    value = null,
    minimumBet,
} = {}) {
    let description =
        `Bet Type: **${formatBetType(
            betType
        )}**`;

    if (
        value !== null &&
        value !== undefined
    ) {
        description +=
            `\nNumber: **${value}**`;
    }

    description +=
        `\n\n💰 Minimum Bet: **${formatCoins(
            minimumBet
        )}**\n\n` +

        "Enter your wager amount.";

    return createEmbed({
        title:
            "💰 Roulette Wager",

        description,
    });
}


/*
 * -----------------------------
 * Bet Confirmation
 * -----------------------------
 */

function formatRouletteConfirmation({
    betType,
    value = null,
    amount,
} = {}) {
    let description =
        `🎯 Bet: **${formatBetType(
            betType
        )}**`;

    if (
        value !== null &&
        value !== undefined
    ) {
        description +=
            `\n🔢 Number: **${value}**`;
    }

    description +=
        `\n💰 Wager: **${formatCoins(
            amount
        )}**\n\n` +

        "Confirm your bet to enter the current round.";

    return createEmbed({
        title:
            "🎰 Confirm Roulette Bet",

        description,
    });
}


/*
 * -----------------------------
 * Submitted Bet
 * -----------------------------
 */

function formatRouletteBetSubmitted({
    betType,
    value = null,
    amount,
    remainingTime = null,
} = {}) {
    let description =
        "✅ **Your bet has been submitted.**\n\n" +

        `🎯 Bet: **${formatBetType(
            betType
        )}**`;

    if (
        value !== null &&
        value !== undefined
    ) {
        description +=
            `\n🔢 Number: **${value}**`;
    }

    description +=
        `\n💰 Wager: **${formatCoins(
            amount
        )}**`;

    if (
        remainingTime !== null
    ) {
        description +=
            `\n\n⏱️ Remaining: **${Math.ceil(
                Number(
                    remainingTime
                ) / 1000
            )}s**`;
    }

    description +=
        "\n\nWaiting for the round to lock...";

    return createEmbed({
        title:
            "🎯 Bet Submitted",
        description,
    });
}


/*
 * -----------------------------
 * Locked
 * -----------------------------
 */

function formatRouletteLocked({
    session,
} = {}) {
    const players =
        session?.players ?? [];

    return createEmbed({
        title:
            "🔒 Roulette — Bets Locked",

        description:
            `👥 Players: **${players.length}/${session?.maxPlayers ?? 6}**\n\n` +

            "All bets are locked.\n\n" +

            "🎡 The European roulette wheel is spinning...\n\n" +

            "No further bets can be submitted for this round.",
    });
}


/*
 * -----------------------------
 * Result
 * -----------------------------
 */

function formatRouletteResult({
    result,
    playerResults = [],
} = {}) {
    const number =
        result?.number;

    const color =
        result?.color;

    let description =
        `${colorEmoji(
            color
        )} The wheel landed on **${number}** (${color}).\n\n`;

    if (
        playerResults.length
    ) {
        description +=
            playerResults
                .map(
                    (
                        player
                    ) => {
                        const outcome =
                            player.won
                                ? "🎉 WON"
                                : "💀 LOST";

                        const payout =
                            formatCoins(
                                player.payout ??
                                0
                            );

                        return (
                            `<@${player.userId}> — ` +
                            `${formatBetType(
                                player.bet?.type
                            )} ` +
                            `• ${formatCoins(
                                player.bet?.amount ??
                                0
                            )} wager ` +
                            `• ${outcome} ` +
                            `• Payout: **${payout}**`
                        );
                    }
                )
                .join("\n")
                + "\n";
    }

    description +=
        "\n🎡 Same wheel result resolved every player's bet.";

    return createEmbed({
        title:
            "🎰 Roulette — Round Result",

        description,
    });
}


/*
 * -----------------------------
 * Waiting For Next Round
 * -----------------------------
 */

function formatRouletteNextRound({
    session,
} = {}) {
    return createEmbed({
        title:
            "🔄 Roulette — Next Round",

        description:
            `👥 Players: **${(
                session?.players?.length ??
                0
            )}/${session?.maxPlayers ?? 6}**\n\n` +

            "The previous round is complete.\n\n" +

            "The host can start the next round.",
    });
}


/*
 * -----------------------------
 * Ended
 * -----------------------------
 */

function formatRouletteEnded({
    reason =
        "The roulette game has ended.",
} = {}) {
    return createEmbed({
        title:
            "🏁 Roulette Ended",

        description:
            String(reason),
    });
}


/*
 * -----------------------------
 * Error
 * -----------------------------
 */

function formatRouletteError(
    message
) {
    return createEmbed({
        title:
            "❌ Roulette Error",

        description:
            String(message),
    });
}


/*
 * -----------------------------
 * Exports
 * -----------------------------
 */

module.exports = {
    formatRouletteLobby,
    formatRouletteBetting,
    formatNumberSelection,
    formatBetAmount,
    formatRouletteConfirmation,
    formatRouletteBetSubmitted,
    formatRouletteLocked,
    formatRouletteResult,
    formatRouletteNextRound,
    formatRouletteEnded,
    formatRouletteError,
    formatBetType,
};