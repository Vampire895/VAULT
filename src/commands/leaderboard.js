const {
    ApplicationCommandOptionType,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    MessageFlags,
} = require("discord.js");

const leaderboardService =
    require("../services/leaderboardService");

const {
    createPaginator,
} = require("../ui/paginator");


/*
 * --------------------------------
 * Runtime Pagination State
 * --------------------------------
 *
 * Leaderboard pages are temporary
 * UI state.
 *
 * Nothing here is persisted.
 *
 * Key:
 * Discord message ID
 *
 * Value:
 * Current page
 */

const activeLeaderboards =
    new Map();


/*
 * --------------------------------
 * Constants
 * --------------------------------
 */

const PAGE_SIZE = 10;


/*
 * --------------------------------
 * Formatting
 * --------------------------------
 */

function formatBalance(
    balance
) {

    return Number(
        balance
    ).toLocaleString(
        "en-US"
    );
}


function getRankDisplay(
    rank
) {

    if (rank === 1) {
        return "🥇";
    }

    if (rank === 2) {
        return "🥈";
    }

    if (rank === 3) {
        return "🥉";
    }

    return `**${rank}.**`;
}


/*
 * --------------------------------
 * Leaderboard Embed
 * --------------------------------
 */

function createLeaderboardEmbed(
    leaderboard
) {

    const {
        entries,
        page,
        totalPages,
        total,
    } = leaderboard;


    let description = "";


    if (
        entries.length === 0
    ) {

        description =
            "There are no users on the leaderboard yet.";

    } else {

        description =
            entries
                .map(
                    (entry) => {

                        return (
                            `${getRankDisplay(
                                entry.rank
                            )} ` +
                            `<@${entry.userId}>` +
                            ` — ` +
                            `🪙 **${formatBalance(
                                entry.balance
                            )}**`
                        );
                    }
                )
                .join("\n");
    }


    description +=
        `\n\n**Page ${page} / ${totalPages}**`;


    return new EmbedBuilder()
        .setTitle(
            "🏆 VAULT • LEADERBOARD"
        )
        .setDescription(
            description
        )
        .setFooter({
            text:
                `${total} player${total === 1 ? "" : "s"} ranked by balance`,
        });
}


/*
 * --------------------------------
 * Build Page
 * --------------------------------
 */

function buildLeaderboardPage(
    page
) {

    return leaderboardService.getPage(
        page,
        PAGE_SIZE
    );
}


/*
 * --------------------------------
 * Build Components
 * --------------------------------
 */

function createLeaderboardButtons(
    currentPage,
    totalPages
) {

    const previousButton =
        new ButtonBuilder()
            .setCustomId(
                "leaderboard_previous"
            )
            .setLabel(
                "Previous"
            )
            .setStyle(
                ButtonStyle.Secondary
            )
            .setDisabled(
                currentPage <= 1
            );


    const nextButton =
        new ButtonBuilder()
            .setCustomId(
                "leaderboard_next"
            )
            .setLabel(
                "Next"
            )
            .setStyle(
                ButtonStyle.Secondary
            )
            .setDisabled(
                currentPage >= totalPages
            );


    return [
        new ActionRowBuilder()
            .addComponents(
                previousButton,
                nextButton
            ),
    ];
}


/*
 * --------------------------------
 * Render
 * --------------------------------
 */

function renderLeaderboard(
    page
) {

    const leaderboard =
        buildLeaderboardPage(
            page
        );


    return {
        embeds: [
            createLeaderboardEmbed(
                leaderboard
            ),
        ],

        components:
            createLeaderboardButtons(
                leaderboard.page,
                leaderboard.totalPages
            ),

        page:
            leaderboard.page,

        totalPages:
            leaderboard.totalPages,
    };
}


/*
 * --------------------------------
 * Cleanup
 * --------------------------------
 */

function cleanupLeaderboard(
    messageId
) {

    activeLeaderboards.delete(
        messageId
    );
}


/*
 * --------------------------------
 * Command
 * --------------------------------
 */

module.exports = {

    name:
        "leaderboard",

    
        aliases: [
        "lb",
    ],    

    description:
        "View the richest players in the economy.",


    options: [],


    /*
     * --------------------------------
     * Execute
     * --------------------------------
     */

    async execute(
        interaction
    ) {

        try {

            const rendered =
                renderLeaderboard(
                    1
                );


            await interaction.reply({

                embeds:
                    rendered.embeds,

                components:
                    rendered.components,
            });


            const message =
                await interaction.fetchReply();


            /*
             * Store only temporary
             * pagination state.
             */

            activeLeaderboards.set(
                message.id,
                {
                    page:
                        rendered.page,

                    ownerId:
                        interaction.user.id,
                }
            );

        } catch (error) {

            console.error(
                "❌ Leaderboard command error:",
                error
            );


            if (
                interaction.replied ||
                interaction.deferred
            ) {

                await interaction.followUp({

                    content:
                        `❌ ${error.message}`,

                    flags:
                        MessageFlags.Ephemeral,
                });

            } else {

                await interaction.reply({

                    content:
                        `❌ ${error.message}`,

                    flags:
                        MessageFlags.Ephemeral,
                });
            }
        }
    },


    /*
     * --------------------------------
     * Button Handler
     * --------------------------------
     */

    async handleButton(
        interaction
    ) {

        const customId =
            interaction.customId;


        if (
            customId !==
                "leaderboard_previous" &&
            customId !==
                "leaderboard_next"
        ) {
            return false;
        }


        const messageId =
            interaction.message.id;


        const panel =
            activeLeaderboards.get(
                messageId
            );


        /*
         * Bot restarted or the
         * temporary state disappeared.
         */

        if (!panel) {

            await interaction.reply({

                content:
                    "❌ This leaderboard has expired. Run `/leaderboard` again.",

                flags:
                    MessageFlags.Ephemeral,
            });

            return true;
        }


        let newPage =
            panel.page;


        if (
            customId ===
            "leaderboard_previous"
        ) {

            newPage =
                Math.max(
                    1,
                    panel.page - 1
                );

        } else {

            newPage =
                panel.page + 1;
        }


        try {

            /*
             * Re-query SQLite every time.
             *
             * This means balances and
             * rankings are always current.
             */

            const rendered =
                renderLeaderboard(
                    newPage
                );


            /*
             * Update runtime page.
             */

            panel.page =
                rendered.page;


            await interaction.update({

                embeds:
                    rendered.embeds,

                components:
                    rendered.components,
            });


        } catch (error) {

            console.error(
                "❌ Leaderboard pagination error:",
                error
            );


            if (
                interaction.replied ||
                interaction.deferred
            ) {

                await interaction.followUp({

                    content:
                        "❌ Unable to update the leaderboard.",

                    flags:
                        MessageFlags.Ephemeral,
                });

            } else {

                await interaction.reply({

                    content:
                        "❌ Unable to update the leaderboard.",

                    flags:
                        MessageFlags.Ephemeral,
                });
            }
        }


        return true;
    },
};