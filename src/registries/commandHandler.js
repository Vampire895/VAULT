const {
    MessageFlags,
} = require("discord.js");

const {
    getCommand,
} = require("./commandRegistry");

const {
    errorHandler,
} = require("../errors");

const {
    handleConfigurationInteraction,
} = require("../ui/configurationInteraction");

const {
    handleRouletteInteraction,
} = require("../ui/rouletteInteraction");


/*
 * --------------------------------
 * Button Command Routes
 * --------------------------------
 *
 * Each game that owns button
 * interactions registers its prefix
 * and command name here.
 *
 * This keeps button routing centralized
 * without creating giant switch blocks.
 */

const BUTTON_COMMAND_ROUTES = [
    {
        prefix: "bj_",
        command: "blackjack",
        label: "Blackjack",
    },

    {
        prefix: "mines_",
        command: "mines",
        label: "Mines",
    },

    {
        prefix: "crash_",
        command: "crash",
        label: "Crash",
    },

    {
        prefix: "leaderboard_",
        command: "leaderboard",
        label: "Leaderboard",
    },

    {
    prefix: "start_",
    command: "start",
    label: "Fortune Start",
},
];


/*
 * --------------------------------
 * Interaction Error Helpers
 * --------------------------------
 *
 * Kept for errors that happen before
 * a command-specific handler exists.
 *
 * Command execution errors now go
 * through the centralized errorHandler.
 */

async function replyError(
    interaction,
    content
) {

    if (
        interaction.replied ||
        interaction.deferred
    ) {

        await interaction.followUp({

            content,

            flags:
                MessageFlags.Ephemeral,
        });

        return;
    }


    await interaction.reply({

        content,

        flags:
            MessageFlags.Ephemeral,
    });
}


/*
 * --------------------------------
 * Button Command Handler
 * --------------------------------
 */

async function handleButtonCommand(
    interaction
) {

    if (
        !interaction.isButton()
    ) {
        return false;
    }


    const customId =
        interaction.customId;


    const route =
        BUTTON_COMMAND_ROUTES.find(
            (entry) =>
                customId.startsWith(
                    entry.prefix
                )
        );


    /*
     * This button does not belong
     * to one of our routed commands.
     */

    if (!route) {
        return false;
    }


    const command =
        getCommand(
            route.command
        );


    /*
     * A matching route exists but
     * the command has not been
     * registered.
     */

    if (
        !command ||
        typeof command.handleButton !==
            "function"
    ) {

        console.error(
            `❌ ${route.label} button handler is not registered.`
        );


        await replyError(
            interaction,
            `❌ ${route.label} is currently unavailable.`
        );


        return true;
    }


    try {

        const handled =
            await command.handleButton(
                interaction
            );


        /*
         * A command can explicitly
         * report that it did not handle
         * the interaction.
         *
         * Normally game handlers should
         * return true for their own IDs.
         */

        return handled !== false;

    } catch (error) {

        /*
         * --------------------------------
         * Centralized Error Handling
         * --------------------------------
         *
         * Known AppErrors get their
         * centralized user-facing message.
         *
         * Unexpected errors get a safe
         * generic message while the full
         * technical error is logged.
         */

        await errorHandler.handleError(
            interaction,
            error,
            {
                command:
                    route.command,

                context:
                    `${route.label} button`,
            }
        );


        return true;
    }
}


/*
 * --------------------------------
 * Configuration / General UI
 * --------------------------------
 */

async function handleGeneralInteraction(
    interaction
) {

    if (
        !(
            interaction.isButton() ||
            interaction.isRoleSelectMenu() ||
            interaction.isStringSelectMenu() ||
            interaction.isModalSubmit()
        )
    ) {

        return false;
    }


    try {

        const configurationHandled =
            await handleConfigurationInteraction(
                interaction
            );


        if (
            configurationHandled
        ) {

            return true;
        }


        const rouletteHandled =
            await handleRouletteInteraction(
                interaction
            );


        if (
            rouletteHandled
        ) {

            return true;
        }


        return false;

    } catch (error) {

        /*
         * Configuration / Roulette
         * interaction errors also use
         * the central error system.
         */

        await errorHandler.handleError(
            interaction,
            error,
            {
                context:
                    "general UI interaction",
            }
        );


        return true;
    }
}


/*
 * --------------------------------
 * Chat Input Command Handler
 * --------------------------------
 */

async function handleChatInputCommand(
    interaction
) {

    if (
        !interaction.isChatInputCommand()
    ) {

        return false;
    }


    const command =
        getCommand(
            interaction.commandName
        );


    /*
     * Command does not exist.
     */

    if (!command) {

        await replyError(
            interaction,
            "❌ Command not found."
        );


        return true;
    }


    try {

        await command.execute(
            interaction
        );


        return true;

    } catch (error) {

        /*
         * --------------------------------
         * Centralized Error Handling
         * --------------------------------
         */

        await errorHandler.handleError(
            interaction,
            error,
            {
                command:
                    interaction.commandName,
            }
        );


        return true;
    }
}


/*
 * --------------------------------
 * Main Interaction Handler
 * --------------------------------
 */

async function handleInteraction(
    interaction
) {

    /*
     * --------------------------------
     * General UI
     * --------------------------------
     *
     * Configuration and Roulette get
     * first chance to handle buttons,
     * menus and modals.
     */

    const generalHandled =
        await handleGeneralInteraction(
            interaction
        );


    if (
        generalHandled
    ) {

        return;
    }


    /*
     * --------------------------------
     * Game Buttons
     * --------------------------------
     *
     * Blackjack
     * Mines
     * Crash
     * Leaderboard
     *
     * All use the same centralized
     * dispatcher.
     */

    const buttonHandled =
        await handleButtonCommand(
            interaction
        );


    if (
        buttonHandled
    ) {

        return;
    }


    /*
     * --------------------------------
     * Chat Input Commands
     * --------------------------------
     */

    await handleChatInputCommand(
        interaction
    );
}


/*
 * --------------------------------
 * Exports
 * --------------------------------
 */

module.exports = {
    handleInteraction,
};