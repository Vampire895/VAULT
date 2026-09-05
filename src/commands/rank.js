const {
    AttachmentBuilder,
    MessageFlags,
} = require("discord.js");


const rankService =
    require("../services/rankService");


const {
    createRankCard,
} = require("../ui/rankCard");


/*
 * --------------------------------
 * Command
 * --------------------------------
 */

module.exports = {

    name:
        "rank",

    aliases: [
        "r",
    ],

    description:
        "View your personal rank card.",

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

            /*
             * Get dynamic rank data.
             */

            const rankData =
                rankService.getUserRank(
                    interaction.user.id
                );


            /*
             * Generate the actual
             * PNG rank card.
             */

            const image =
                await createRankCard({

                    user:
                        interaction.user,

                    rank:
                        rankData.rank,

                    balance:
                        rankData.balance,

                    tier:
                        rankData.tier,
                });


            /*
             * Create Discord attachment.
             */

            const attachment =
                new AttachmentBuilder(
                    image,
                    {
                        name:
                            "fortune-rank.png",
                    }
                );


            /*
             * Send ONLY the image.
             *
             * No EmbedBuilder.
             */

            await interaction.reply({

                files: [
                    attachment,
                ],
            });

        } catch (error) {

            console.error(
                "❌ Rank command error:",
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
};