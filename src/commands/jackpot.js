const {
    MessageFlags,
} = require("discord.js");


const jackpotService =
    require("../services/jackpotService");


const {
    formatJackpot,
    formatContribution,
} =
    require("../ui/jackpotFormatter");


module.exports = {

    name:
        "jackpot",

    /*
     * Prefix alias:
     *
     * jackpot
     * jp
     */
    aliases: [
        "jp",
    ],

    description:
        "View the current daily Jackpot.",


    options: [

        {
            type: 1,

            name: "add",

            description:
                "Contribute Ethers to today's Jackpot.",

            options: [

                {
                    type: 4,

                    name: "amount",

                    description:
                        "Amount of Ethers to contribute.",

                    required: true,

                    min_value:
                        1,
                },
            ],
        },
    ],


    async execute(
        interaction
    ) {

        try {

            /*
             * --------------------------------
             * Determine Subcommand
             * --------------------------------
             *
             * Passing false means:
             *
             * - return null when there is
             *   no subcommand
             *
             * - do not throw an error
             *
             * This works for both:
             *
             * /jackpot
             *
             * and:
             *
             * bet jackpot
             */

            const subcommand =
                interaction.options.getSubcommand(
                    false
                );


            /*
             * --------------------------------
             * /jackpot
             *
             * bet jackpot
             *
             * --------------------------------
             */

            if (
                !subcommand
            ) {

                const amount =
                    jackpotService.getJackpotAmount();


                await interaction.reply({

                    content:
                        formatJackpot(
                            amount
                        ),
                });


                return;
            }


            /*
             * --------------------------------
             * /jackpot add
             *
             * bet jackpot add 100
             * --------------------------------
             */

            if (
                subcommand === "add"
            ) {

                const amount =
                    interaction.options.getInteger(
                        "amount",
                        true
                    );


                const result =
                    jackpotService.addContribution(
                        interaction.user.id,
                        amount
                    );


                await interaction.reply({

                    content:
                        formatContribution({

                            contribution:
                                result.amount,

                            jackpot:
                                result.jackpot,
                        }),
                });


                return;
            }


            /*
             * --------------------------------
             * Unknown Action
             * --------------------------------
             */

            throw new Error(
                "Unknown Jackpot action."
            );


        } catch (error) {

            console.error(
                "❌ Jackpot command error:",
                error
            );


            const content =
                `❌ ${error.message}`;


            /*
             * --------------------------------
             * Error Reply
             * --------------------------------
             */

            if (
                interaction.replied ||
                interaction.deferred
            ) {

                await interaction.followUp({

                    content,

                    flags:
                        MessageFlags.Ephemeral,
                });

            } else {

                await interaction.reply({

                    content,

                    flags:
                        MessageFlags.Ephemeral,
                });
            }
        }
    },
};