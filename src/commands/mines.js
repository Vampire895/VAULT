const {
    ApplicationCommandOptionType,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");

const minesGameService =
    require("../services/minesGameService");

const minesEngine =
    require("../games/mines/minesEngine");


/*
 * --------------------------------
 * Helpers
 * --------------------------------
 */

function formatNumber(number) {
    return number.toLocaleString();
}


/*
 * --------------------------------
 * Board
 * --------------------------------
 *
 * 3 × 3 board.
 *
 * Positions:
 *
 * 0 1 2
 * 3 4 5
 * 6 7 8
 *
 * During an active game:
 * - Safe revealed tiles = 💚
 * - Hidden tiles = 💎
 * - Mines remain hidden
 *
 * After a loss:
 * - Safe revealed tiles = 💚
 * - Mines = 💣
 *
 * After win:
 * - All safe tiles = 💚
 * - Mines = 💣
 *
 * After cash out:
 * - Revealed safe tiles = 💚
 * - Unrevealed tiles remain 💎
 * - Mines remain hidden
 */

function createBoardButtons(
    game,
    userId,
    disabled = false,
    revealMines = false
) {
    const rows = [];

    const revealed =
        game.revealedPositions || new Set();

    const minePositions =
        game.minePositions || new Set();

    for (
        let row = 0;
        row < 3;
        row++
    ) {
        const actionRow =
            new ActionRowBuilder();

        for (
            let column = 0;
            column < 3;
            column++
        ) {
            const position =
                row * 3 + column;

            const isRevealed =
                revealed.has(position);

            const isMine =
                minePositions.has(position);

            let label = "💎";

            let style =
                ButtonStyle.Secondary;


            /*
             * Revealed safe tile.
             */

            if (
                isRevealed &&
                !isMine
            ) {
                label = "💚";

                style =
                    ButtonStyle.Success;
            }


            /*
             * Reveal mines only when
             * the game has been lost or
             * completely cleared.
             */

            if (
                revealMines &&
                isMine
            ) {
                label = "💣";

                style =
                    ButtonStyle.Danger;
            }


            /*
             * Revealed tiles and finished
             * games cannot be clicked.
             */

            const buttonDisabled =
                disabled ||
                isRevealed;


            actionRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(
                        `mines_tile_${userId}_${position}`
                    )
                    .setLabel(label)
                    .setStyle(style)
                    .setDisabled(
                        buttonDisabled
                    )
            );
        }

        rows.push(actionRow);
    }

    return rows;
}


/*
 * --------------------------------
 * Cash Out Button
 * --------------------------------
 */

function createCashOutButton(
    userId,
    disabled = false
) {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(
                    `mines_cashout_${userId}`
                )
                .setLabel("Cash Out")
                .setEmoji("💰")
                .setStyle(
                    ButtonStyle.Primary
                )
                .setDisabled(
                    disabled
                )
        );
}


/*
 * --------------------------------
 * Active Game Embed
 * --------------------------------
 */

function createGameEmbed(game) {
    const cashout =
        Math.floor(
            game.bet *
            game.multiplier
        );

    return new EmbedBuilder()
        .setTitle("💣 Mines")
        .setDescription(
            [
                "Pick a tile and pray. 😈",
                "",
                `💰 **Bet:** ${formatNumber(game.bet)}`,
                `💣 **Mines:** ${game.mines}`,
                `✨ **Safe Tiles:** ${game.safeReveals}`,
                `📈 **Multiplier:** ${game.multiplier.toFixed(2)}x`,
                `💵 **Cash Out:** ${formatNumber(cashout)}`,
                "",
                "Choose a tile below.",
            ].join("\n")
        );
}


/*
 * --------------------------------
 * Lost Embed
 * --------------------------------
 */

function createLostEmbed(result) {
    return new EmbedBuilder()
        .setTitle("💥 BOOM!")
        .setDescription(
            [
                "You hit a mine. 💀",
                "",
                `💰 **Bet:** ${formatNumber(result.bet)}`,
                `💣 **Mines:** ${result.mines}`,
                `✨ **Safe Tiles:** ${result.safeReveals}`,
                "",
                "💵 **Payout:** 0",
            ].join("\n")
        );
}


/*
 * --------------------------------
 * Won Embed
 * --------------------------------
 */

function createWonEmbed(result) {
    return new EmbedBuilder()
        .setTitle("🎉 Board Cleared!")
        .setDescription(
            [
                "You found every safe tile! 🤑",
                "",
                `💰 **Bet:** ${formatNumber(result.bet)}`,
                `💣 **Mines:** ${result.mines}`,
                `✨ **Safe Tiles:** ${result.safeReveals}`,
                `📈 **Multiplier:** ${result.multiplier.toFixed(2)}x`,
                "",
                `💵 **Payout:** ${formatNumber(result.payout)}`,
            ].join("\n")
        );
}


/*
 * --------------------------------
 * Cash Out Embed
 * --------------------------------
 */

function createCashOutEmbed(result) {
    return new EmbedBuilder()
        .setTitle("💰 Cashed Out!")
        .setDescription(
            [
                "Nice. You knew when to walk away. 😎",
                "",
                `💰 **Bet:** ${formatNumber(result.bet)}`,
                `✨ **Safe Tiles:** ${result.safeReveals}`,
                `📈 **Multiplier:** ${result.multiplier.toFixed(2)}x`,
                "",
                `💵 **Payout:** ${formatNumber(result.payout)}`,
            ].join("\n")
        );
}


/*
 * --------------------------------
 * Start Command
 * --------------------------------
 */

async function execute(interaction) {
    const bet =
        interaction.options.getInteger(
            "bet"
        );

    const mines =
        interaction.options.getInteger(
            "mines"
        ) ??
        minesEngine.DEFAULT_MINES;

    const userId =
        interaction.user.id;

    try {
        const game =
            minesGameService.start(
                userId,
                bet,
                mines
            );

        await interaction.reply({
            embeds: [
                createGameEmbed(game),
            ],

            components: [
                ...createBoardButtons(
                    game,
                    userId
                ),

                createCashOutButton(
                    userId
                ),
            ],
        });

        return true;

    } catch (error) {

        await interaction.reply({
            content:
                `❌ ${error.message}`,

            ephemeral: true,
        });

        return true;
    }
}


/*
 * --------------------------------
 * Button Handler
 * --------------------------------
 */

async function handleButton(
    interaction
) {
    const parts =
        interaction.customId.split("_");


    /*
     * Expected:
     *
     * mines_tile_<userId>_<position>
     *
     * mines_cashout_<userId>
     */

    if (
        parts[0] !== "mines"
    ) {
        return false;
    }


    const action =
        parts[1];

    const ownerId =
        parts[2];


    /*
     * Only the player who started
     * the game can interact with it.
     */

    if (
        interaction.user.id !== ownerId
    ) {
        await interaction.reply({
            content:
                "❌ This isn't your Mines game.",

            ephemeral: true,
        });

        return true;
    }


    /*
     * --------------------------------
     * Cash Out
     * --------------------------------
     */

    if (
        action === "cashout"
    ) {
        try {
            const result =
                minesGameService.cashOut(
                    ownerId
                );


            /*
             * The service returns the
             * complete board snapshot
             * before deleting the session.
             *
             * Keep revealed safe tiles
             * visible, but do NOT reveal
             * hidden mines on cash out.
             */

            await interaction.update({
                embeds: [
                    createCashOutEmbed(
                        result
                    ),
                ],

                components: [
                    ...createBoardButtons(
                        result,
                        ownerId,
                        true,
                        false
                    ),
                ],
            });

            return true;

        } catch (error) {

            await interaction.reply({
                content:
                    `❌ ${error.message}`,

                ephemeral: true,
            });

            return true;
        }
    }


    /*
     * --------------------------------
     * Tile
     * --------------------------------
     */

    if (
        action !== "tile"
    ) {
        return false;
    }


    const position =
        Number(parts[3]);


    if (
        !Number.isSafeInteger(
            position
        )
    ) {
        await interaction.reply({
            content:
                "❌ Invalid Mines tile.",

            ephemeral: true,
        });

        return true;
    }


    try {

        /*
         * Reveal selected tile.
         */

        const result =
            minesGameService.reveal(
                ownerId,
                position
            );


        /*
         * --------------------------------
         * Mine Hit
         * --------------------------------
         */

        if (
            result.mine
        ) {

            /*
             * IMPORTANT:
             *
             * minesGameService now returns
             * the complete final board.
             *
             * Therefore we use:
             *
             * result.minePositions
             * result.revealedPositions
             *
             * instead of inventing a board
             * from the clicked tile.
             */

            await interaction.update({
                embeds: [
                    createLostEmbed(
                        result
                    ),
                ],

                components: [
                    ...createBoardButtons(
                        result,
                        ownerId,
                        true,
                        true
                    ),
                ],
            });

            return true;
        }


        /*
         * --------------------------------
         * Automatic Win
         * --------------------------------
         */

        if (
            result.state ===
            "won"
        ) {

            /*
             * Service returns the complete
             * final board.
             *
             * Reveal all mines visually
             * because the game is finished.
             */

            await interaction.update({
                embeds: [
                    createWonEmbed(
                        result
                    ),
                ],

                components: [
                    ...createBoardButtons(
                        result,
                        ownerId,
                        true,
                        true
                    ),
                ],
            });

            return true;
        }


        /*
         * --------------------------------
         * Game Continues
         * --------------------------------
         *
         * The reveal result already contains
         * the updated board state.
         *
         * No second service lookup is needed.
         */

        await interaction.update({
            embeds: [
                createGameEmbed(
                    result
                ),
            ],

            components: [
                ...createBoardButtons(
                    result,
                    ownerId,
                    false,
                    false
                ),

                createCashOutButton(
                    ownerId
                ),
            ],
        });

        return true;

    } catch (error) {

        await interaction.reply({
            content:
                `❌ ${error.message}`,

            ephemeral: true,
        });

        return true;
    }
}


/*
 * --------------------------------
 * Command Export
 * --------------------------------
 */

module.exports = {
    name: "mines",
    aliases: ["m"],
    description:
        "Play Mines.",

    options: [
        {
            name: "bet",

            description:
                "The amount of coins to bet.",

            type:
                ApplicationCommandOptionType.Integer,

            required: true,

            min_value: 1,
        },

        {
            name: "mines",

            description:
                "Number of mines (default: 3).",

            type:
                ApplicationCommandOptionType.Integer,

            required: false,

            min_value:
                minesEngine.MIN_MINES,

            max_value:
                minesEngine.MAX_MINES,
        },
    ],

    execute,
    handleButton,
};