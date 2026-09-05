const {
    ActionRowBuilder,
    ButtonStyle,
} = require("discord.js");

const {
    createButton,
} = require("./buttonFactory");

const {
    createSelectMenu,
} = require("./selectFactory");

const {
    createTextModal,
} = require("./modalFactory");


/*
 * -----------------------------
 * Custom ID Helper
 * -----------------------------
 *
 * Every Roulette interaction carries
 * its multiplayer session ID.
 *
 * Format:
 *
 * roulette_action:sessionId
 *
 */

function rouletteId(
    action,
    sessionId
) {
    if (
        typeof sessionId !== "string" ||
        sessionId.trim() === ""
    ) {
        throw new Error(
            "Roulette session ID is required."
        );
    }

    return `${action}:${sessionId}`;
}


/*
 * -----------------------------
 * Lobby Buttons
 * -----------------------------
 */

function createRouletteLobbyButtons({
    sessionId,
    isHost = false,
} = {}) {
    const buttons = [];

    if (isHost) {
        buttons.push(
            createButton({
                customId:
                    rouletteId(
                        "roulette_start",
                        sessionId
                    ),

                label:
                    "Start Game",

                emoji:
                    "🎰",

                style:
                    ButtonStyle.Success,
            })
        );
    }

    buttons.push(
        createButton({
            customId:
                rouletteId(
                    "roulette_join",
                    sessionId
                ),

            label:
                "Join",

            emoji:
                "🎟️",

            style:
                ButtonStyle.Primary,
        }),

        createButton({
            customId:
                rouletteId(
                    "roulette_leave",
                    sessionId
                ),

            label:
                "Leave",

            emoji:
                "🚪",

            style:
                ButtonStyle.Secondary,
        }),

        createButton({
            customId:
                rouletteId(
                    "roulette_cancel",
                    sessionId
                ),

            label:
                "Cancel",

            emoji:
                "❌",

            style:
                ButtonStyle.Danger,

            disabled:
                !isHost,
        })
    );

    return new ActionRowBuilder()
        .addComponents(buttons);
}


/*
 * -----------------------------
 * Betting
 * -----------------------------
 */

function createRouletteBetTypeSelect(
    betTypes,
    sessionId
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

    const emojis = {
        straight: "🎯",
        red: "🔴",
        black: "⚫",
        dozen_1: "1️⃣",
        dozen_2: "2️⃣",
        dozen_3: "3️⃣",
        column_1: "1️⃣",
        column_2: "2️⃣",
        column_3: "3️⃣",
        low: "⬇️",
        high: "⬆️",
        odd: "🔢",
        even: "🔢",
    };

    const options =
        Object.entries(
            betTypes
        ).map(
            ([key, value]) => ({
                label:
                    labels[value] ??
                    value
                        .replace(
                            /_/g,
                            " "
                        )
                        .replace(
                            /\b\w/g,
                            (char) =>
                                char.toUpperCase()
                        ),

                value,

                emoji:
                    emojis[value] ??
                    "🎰",
            })
        );

    return new ActionRowBuilder()
        .addComponents(
            createSelectMenu({
                customId:
                    rouletteId(
                        "roulette_bet_type",
                        sessionId
                    ),

                placeholder:
                    "Choose your roulette bet",

                options,
            })
        );
}


/*
 * -----------------------------
 * Number Selection
 * -----------------------------
 */

function createRouletteNumberSelect(
    sessionId
) {
    const options = [];

    for (
        let number = 0;
        number <= 36;
        number++
    ) {
        options.push({
            label:
                String(number),

            value:
                String(number),

            emoji:
                number === 0
                    ? "🟢"
                    : "🎰",
        });
    }

    return new ActionRowBuilder()
        .addComponents(
            createSelectMenu({
                customId:
                    rouletteId(
                        "roulette_number",
                        sessionId
                    ),

                placeholder:
                    "Choose your number",

                options,
            })
        );
}


/*
 * -----------------------------
 * Bet Amount Modal
 * -----------------------------
 */

function createRouletteBetAmountModal(
    sessionId
) {
    return createTextModal({
        customId:
            rouletteId(
                "roulette_bet_amount",
                sessionId
            ),

        title:
            "Roulette Bet Amount",

        inputId:
            "amount",

        label:
            "Bet Amount",

        placeholder:
            "Enter your wager",
    });
}


/*
 * -----------------------------
 * Bet Confirmation
 * -----------------------------
 */

function createRouletteConfirmationButtons({
    sessionId,
    disabled = false,
} = {}) {
    return new ActionRowBuilder()
        .addComponents(
            createButton({
                customId:
                    rouletteId(
                        "roulette_confirm_bet",
                        sessionId
                    ),

                label:
                    "Confirm Bet",

                emoji:
                    "✅",

                style:
                    ButtonStyle.Success,

                disabled,
            }),

            createButton({
                customId:
                    rouletteId(
                        "roulette_change_bet",
                        sessionId
                    ),

                label:
                    "Change Bet",

                emoji:
                    "↩️",

                style:
                    ButtonStyle.Secondary,

                disabled,
            })
        );
}


/*
 * -----------------------------
 * Betting Phase Controls
 * -----------------------------
 */

function createRouletteBettingButtons({
    sessionId,
    disabled = false,
} = {}) {
    return new ActionRowBuilder()
        .addComponents(
            createButton({
                customId:
                    rouletteId(
                        "roulette_submit_bet",
                        sessionId
                    ),

                label:
                    "Submit Bet",

                emoji:
                    "🎯",

                style:
                    ButtonStyle.Success,

                disabled,
            }),

            createButton({
                customId:
                    rouletteId(
                        "roulette_cancel_bet",
                        sessionId
                    ),

                label:
                    "Cancel Bet",

                emoji:
                    "❌",

                style:
                    ButtonStyle.Secondary,

                disabled,
            })
        );
}


/*
 * -----------------------------
 * Result Buttons
 * -----------------------------
 */

function createRouletteResultButtons({
    sessionId,
    isHost = false,
} = {}) {
    const buttons = [
        createButton({
            customId:
                rouletteId(
                    "roulette_next_round",
                    sessionId
                ),

            label:
                "Next Round",

            emoji:
                "🔄",

            style:
                ButtonStyle.Primary,

            disabled:
                !isHost,
        }),

        createButton({
            customId:
                rouletteId(
                    "roulette_leave",
                    sessionId
                ),

            label:
                "Leave",

            emoji:
                "🚪",

            style:
                ButtonStyle.Secondary,
        }),
    ];

    return new ActionRowBuilder()
        .addComponents(buttons);
}


/*
 * -----------------------------
 * Close
 * -----------------------------
 */

function createRouletteCloseButton(
    sessionId
) {
    return new ActionRowBuilder()
        .addComponents(
            createButton({
                customId:
                    rouletteId(
                        "roulette_close",
                        sessionId
                    ),

                label:
                    "Close",

                emoji:
                    "✖️",

                style:
                    ButtonStyle.Secondary,
            })
        );
}


/*
 * -----------------------------
 * Back
 * -----------------------------
 */

function createRouletteBackButton(
    sessionId
) {
    return new ActionRowBuilder()
        .addComponents(
            createButton({
                customId:
                    rouletteId(
                        "roulette_back",
                        sessionId
                    ),

                label:
                    "Back",

                emoji:
                    "↩️",

                style:
                    ButtonStyle.Secondary,
            }),

            createButton({
                customId:
                    rouletteId(
                        "roulette_cancel_bet",
                        sessionId
                    ),

                label:
                    "Cancel",

                emoji:
                    "❌",

                style:
                    ButtonStyle.Danger,
            })
        );
}


/*
 * -----------------------------
 * Exports
 * -----------------------------
 */

module.exports = {
    createRouletteLobbyButtons,

    createRouletteBetTypeSelect,
    createRouletteNumberSelect,
    createRouletteBetAmountModal,

    createRouletteConfirmationButtons,
    createRouletteBettingButtons,

    createRouletteResultButtons,

    createRouletteCloseButton,
    createRouletteBackButton,
};