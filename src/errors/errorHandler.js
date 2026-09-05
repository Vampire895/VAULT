const {
    MessageFlags,
} = require("discord.js");

const AppError =
    require("./AppError");


/*
 * --------------------------------
 * Safe User Error Message
 * --------------------------------
 */

function getUserMessage(
    error
) {

    if (
        error instanceof AppError
    ) {

        return error.message;
    }


    return "Something went wrong while processing your request.";
}


/*
 * --------------------------------
 * Log Error
 * --------------------------------
 */

function logError(
    error,
    context = {}
) {

    const command =
        context.command
            ? `/${context.command}`
            : "unknown";


    if (
        error instanceof AppError
    ) {

        console.error(
            `⚠️ [${error.code}] ${command}: ${error.message}`
        );


        /*
         * Operational errors are
         * expected application failures.
         *
         * Don't dump a giant stack trace
         * unless there is a useful cause.
         */

        if (
            error.cause
        ) {

            console.error(
                "Cause:",
                error.cause
            );
        }


        return;
    }


    /*
     * Unexpected programming /
     * infrastructure error.
     */

    console.error(
        `❌ [INTERNAL_ERROR] ${command}:`,
        error
    );
}


/*
 * --------------------------------
 * Reply To Interaction
 * -------------------------------- */

async function reply(
    interaction,
    content
) {

    /*
     * Already replied or deferred.
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


        return;
    }


    /*
     * First response.
     */

    await interaction.reply({

        content,

        flags:
            MessageFlags.Ephemeral,
    });
}


/*
 * --------------------------------
 * Handle Error
 * --------------------------------
 */

async function handleError(
    interaction,
    error,
    context = {}
) {

    logError(
        error,
        context
    );


    const message =
        getUserMessage(
            error
        );


    try {

        await reply(
            interaction,
            `❌ ${message}`
        );

    } catch (replyError) {

        /*
         * Discord may reject a response
         * if the interaction expired or
         * was already acknowledged.
         *
         * Never hide the original error.
         */

        console.error(
            "❌ Failed to send error response:",
            replyError
        );
    }
}


/*
 * --------------------------------
 * Exports
 * --------------------------------
 */

module.exports = {

    getUserMessage,

    logError,

    reply,

    handleError,

};