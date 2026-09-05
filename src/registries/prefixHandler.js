const {
    ApplicationCommandOptionType,
} = require("discord.js");

const config = require("../config/config");

const {
    getCommand,
} = require("./commandRegistry");


/*
 * --------------------------------
 * Parse Prefix Arguments
 * --------------------------------
 */

function parseArguments(content) {

    return content
        .trim()
        .split(/\s+/)
        .slice(2);
}


/*
 * --------------------------------
 * Strip Prefix
 * --------------------------------
 */

function stripPrefix(content, prefix) {

    return content
        .slice(prefix.length)
        .trim();
}


/*
 * --------------------------------
 * Find Subcommand
 * --------------------------------
 */

function getSubcommandDefinition(command) {

    const options =
        command.options || [];

    return options.find(
        option =>
            option.type ===
            ApplicationCommandOptionType.Subcommand
    );
}


/*
 * --------------------------------
 * Find Subcommands
 * --------------------------------
 */

function getSubcommands(command) {

    return (command.options || [])
        .filter(
            option =>
                option.type ===
                ApplicationCommandOptionType.Subcommand
        );
}


/*
 * --------------------------------
 * Convert One Option
 * --------------------------------
 */

function parseOptionValue(
    option,
    rawValue
) {

    if (
        rawValue === undefined
    ) {

        if (option.required) {

            throw new Error(
                `Missing required option: ${option.name}.`
            );
        }

        return undefined;
    }


    switch (option.type) {

        /*
         * --------------------------------
         * Integer
         * --------------------------------
         */

        case ApplicationCommandOptionType.Integer: {

            const value =
                Number(rawValue);


            if (
                !Number.isSafeInteger(value)
            ) {

                throw new Error(
                    `\`${rawValue}\` is not a valid integer.`
                );
            }


            return value;
        }


        /*
         * --------------------------------
         * Number
         * --------------------------------
         */

        case ApplicationCommandOptionType.Number: {

            const value =
                Number(rawValue);


            if (
                !Number.isFinite(value)
            ) {

                throw new Error(
                    `\`${rawValue}\` is not a valid number.`
                );
            }


            return value;
        }


        /*
         * --------------------------------
         * Boolean
         * --------------------------------
         */

        case ApplicationCommandOptionType.Boolean: {

            const normalized =
                rawValue.toLowerCase();


            if (
                normalized === "true" ||
                normalized === "yes"
            ) {

                return true;
            }


            if (
                normalized === "false" ||
                normalized === "no"
            ) {

                return false;
            }


            throw new Error(
                `\`${rawValue}\` must be true/false.`
            );
        }


        /*
         * --------------------------------
         * String
         * --------------------------------
         */

        case ApplicationCommandOptionType.String:
        default:

            return rawValue;
    }
}


/*
 * --------------------------------
 * Create Normal Options
 * --------------------------------
 *
 * Used by commands without
 * subcommands.
 */

function createOptions(
    command,
    args
) {

    const values = {};

    const options =
        (command.options || [])
            .filter(
                option =>
                    option.type !==
                    ApplicationCommandOptionType.Subcommand
            );


    for (
        let i = 0;
        i < options.length;
        i++
    ) {

        const option =
            options[i];

        const rawValue =
            args[i];


        const value =
            parseOptionValue(
                option,
                rawValue
            );


        if (
            value !== undefined
        ) {

            values[option.name] =
                value;
        }
    }


    return values;
}


/*
 * --------------------------------
 * Create Subcommand Options
 * --------------------------------
 */

function createSubcommandOptions(
    subcommand,
    args
) {

    const values = {};

    const options =
        subcommand.options || [];


    for (
        let i = 0;
        i < options.length;
        i++
    ) {

        const option =
            options[i];

        const rawValue =
            args[i];


        const value =
            parseOptionValue(
                option,
                rawValue
            );


        if (
            value !== undefined
        ) {

            values[option.name] =
                value;
        }
    }


    return values;
}


/*
 * --------------------------------
 * Create Prefix Interaction
 * --------------------------------
 *
 * This creates a lightweight
 * Interaction-compatible object.
 *
 * Supports:
 *
 * Normal commands:
 *
 *     !balance
 *     !spin 100
 *
 * Subcommands:
 *
 *     !jackpot
 *     !jackpot add 100
 *
 * Slash commands and prefix commands
 * therefore reach the same command
 * implementation.
 */

function createPrefixInteraction(
    message,
    command,
    args
) {

    const subcommands =
        getSubcommands(command);


    let subcommandName =
        null;

    let subcommandDefinition =
        null;

    let optionArgs =
        args;


    /*
     * --------------------------------
     * Resolve Subcommand
     * --------------------------------
     *
     * If the command contains
     * subcommands, the first prefix
     * argument is treated as the
     * subcommand name.
     */

    if (
        subcommands.length > 0
    ) {

        const possibleSubcommand =
            args[0]?.toLowerCase();


        subcommandDefinition =
            subcommands.find(
                subcommand =>
                    subcommand.name
                        .toLowerCase() ===
                    possibleSubcommand
            );


        if (
            !subcommandDefinition
        ) {

            /*
             * If no subcommand was
             * supplied, allow commands
             * such as:
             *
             *     !jackpot
             *
             * to execute without one.
             *
             * The command itself decides
             * what that means.
             */

            optionArgs =
                args;

        } else {

            subcommandName =
                subcommandDefinition.name;


            optionArgs =
                args.slice(1);
        }
    }


    /*
     * --------------------------------
     * Parse Options
     * --------------------------------
     */

    let values = {};


    if (
        subcommandDefinition
    ) {

        values =
            createSubcommandOptions(
                subcommandDefinition,
                optionArgs
            );

    } else if (
        subcommands.length === 0
    ) {

        values =
            createOptions(
                command,
                optionArgs
            );
    }


    /*
     * --------------------------------
     * Reply State
     * --------------------------------
     */

    let repliedMessage =
        null;


    /*
     * --------------------------------
     * Interaction Object
     * --------------------------------
     */

    return {

        user:
            message.author,

        member:
            message.member,

        guild:
            message.guild,

        channel:
            message.channel,


        /*
         * --------------------------------
         * Options
         * --------------------------------
         */

        options: {

            /*
             * getSubcommand()
             */

            getSubcommand(required = true) {
    if (!subcommandName) {
        if (required === false) {
            return null;
        }

        throw new Error(
            "No subcommand was provided."
        );
    }

    return subcommandName;
},


            /*
             * getInteger()
             */

            getInteger(name) {

                return values[name] ??
                    null;
            },


            /*
             * getNumber()
             */

            getNumber(name) {

                return values[name] ??
                    null;
            },


            /*
             * getString()
             */

            getString(name) {

                return values[name] ??
                    null;
            },


            /*
             * getBoolean()
             */

            getBoolean(name) {

                return values[name] ??
                    null;
            },


            /*
             * getUser()
             */

            getUser(name) {

                return values[name] ??
                    null;
            },


            /*
             * getRole()
             */

            getRole(name) {

                return values[name] ??
                    null;
            },


            /*
             * getChannel()
             */

            getChannel(name) {

                return values[name] ??
                    null;
            },


            /*
             * Generic get()
             */

            get(name) {

                const value =
                    values[name];


                if (
                    value === undefined
                ) {

                    return null;
                }


                return {
                    value,
                };
            },
        },


        /*
         * --------------------------------
         * Reply
         * --------------------------------
         */

        async reply(payload) {

            repliedMessage =
                await message.reply(
                    payload
                );


            return repliedMessage;
        },


        /*
         * --------------------------------
         * Follow Up
         * --------------------------------
         */

        async followUp(payload) {

            return message.reply(
                payload
            );
        },


        /*
         * --------------------------------
         * Fetch Reply
         * --------------------------------
         */

        async fetchReply() {

            if (
                repliedMessage
            ) {

                return repliedMessage;
            }


            throw new Error(
                "No reply has been sent yet."
            );
        },


        /*
         * --------------------------------
         * Interaction State
         * --------------------------------
         */

        get replied() {

            return repliedMessage !== null;
        },


        deferred:
            false,


        /*
         * --------------------------------
         * Interaction Type
         * --------------------------------
         */

        isChatInputCommand() {

            return true;
        },
    };
}


/*
 * --------------------------------
 * Handle Prefix Message
 * --------------------------------
 */

async function handlePrefixMessage(
    message
) {

    /*
     * Ignore DMs.
     */

    if (
        !message.guild ||
        message.author.bot
    ) {

        return;
    }


    /*
     * Get configured prefix.
     */

    const prefix =
        config.bot.defaultPrefix;


    if (
        typeof prefix !== "string" ||
        prefix.trim() === ""
    ) {

        return;
    }


    const content =
        message.content.trim();


    const normalizedContent =
        content.toLowerCase();


    const normalizedPrefix =
        prefix.toLowerCase();


    /*
     * Check prefix.
     */

    if (
        !normalizedContent.startsWith(
            normalizedPrefix
        )
    ) {

        return;
    }


    /*
     * Prevent:
     *
     * !betting
     *
     * from matching:
     *
     * !bet
     */

    const nextCharacter =
        content[prefix.length];


    if (
        nextCharacter &&
        !/\s/.test(nextCharacter)
    ) {

        return;
    }


    /*
     * Remove prefix.
     */

    const commandContent =
        stripPrefix(
            content,
            prefix
        );


    /*
     * Split command.
     */

    const parts =
        commandContent
            .trim()
            .split(/\s+/);


    /*
     * Extract command name.
     */

    const commandName =
        parts
            .shift()
            ?.toLowerCase();


    if (!commandName) {

        return;
    }


    /*
     * Find command.
     */

    const command =
        getCommand(
            commandName
        );


    if (!command) {

        return;
    }


    try {

        /*
         * Build compatible interaction.
         */

        const interaction =
            createPrefixInteraction(
                message,
                command,
                parts
            );


        /*
         * Execute the SAME command
         * implementation used by
         * slash commands.
         */

        await command.execute(
            interaction
        );

    } catch (error) {

        console.error(
            `❌ Prefix command "${commandName}" failed:`,
            error
        );


        await message.reply({

            content:
                `❌ ${
                    error.message ||
                    "Something went wrong while executing this command."
                }`,
        });
    }
}


/*
 * --------------------------------
 * Exports
 * --------------------------------
 */

module.exports = {

    handlePrefixMessage,

};