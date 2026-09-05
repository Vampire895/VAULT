const ERROR_MESSAGES = Object.freeze({

    /*
     * --------------------------------
     * General
     * --------------------------------
     */

    UNKNOWN_ERROR:
        "Something went wrong.",

    INTERNAL_ERROR:
        "Something went wrong while processing your request.",

    INVALID_INPUT:
        "The provided input is invalid.",


    /*
     * --------------------------------
     * Economy
     * --------------------------------
     */

    INVALID_AMOUNT:
        "Please enter a valid amount of Ethers.",

    INSUFFICIENT_BALANCE:
        "You don't have enough Ethers.",

    INVALID_TARGET:
        "That user is not a valid target.",

    ACCOUNT_NOT_FOUND:
        "Your Fortune account could not be found.",

    BALANCE_UPDATE_FAILED:
        "Your balance could not be updated.",

    TRANSACTION_FAILED:
        "The transaction could not be completed.",


    /*
     * --------------------------------
     * Games
     * --------------------------------
     */

    GAME_NOT_FOUND:
        "That game could not be found.",

    GAME_EXPIRED:
        "That game has expired.",

    GAME_ALREADY_ACTIVE:
        "You already have an active game.",

    GAME_NOT_ACTIVE:
        "There is no active game.",

    INVALID_GAME_STATE:
        "The game is currently in an invalid state.",

    INVALID_GAME_ACTION:
        "That action cannot be performed right now.",

    INVALID_BET:
        "That bet is invalid.",

    BET_TOO_LOW:
        "That bet is below the minimum allowed amount.",

    BET_TOO_HIGH:
        "That bet is above the maximum allowed amount.",


    /*
     * --------------------------------
     * Multiplayer
     * --------------------------------
     */

    LOBBY_NOT_FOUND:
        "That multiplayer lobby could not be found.",

    LOBBY_FULL:
        "That lobby is already full.",

    ALREADY_IN_LOBBY:
        "You are already in a lobby.",

    NOT_IN_LOBBY:
        "You are not in this lobby.",

    NOT_HOST:
        "Only the lobby host can do that.",

    GAME_ALREADY_STARTED:
        "That game has already started.",

    INVALID_LOBBY_STATE:
        "The lobby is not in the correct state for that action.",


    /*
     * --------------------------------
     * Jackpot
     * --------------------------------
     */

    JACKPOT_NOT_FOUND:
        "The Jackpot is currently unavailable.",

    INVALID_CONTRIBUTION:
        "That Jackpot contribution is invalid.",

    CONTRIBUTION_TOO_HIGH:
        "That contribution is too large for the current Jackpot.",

    JACKPOT_SETTLEMENT_FAILED:
        "The Jackpot could not be settled right now.",


    /*
     * --------------------------------
     * Configuration
     * --------------------------------
     */

    CONFIG_NOT_FOUND:
        "The requested configuration could not be found.",

    INVALID_CONFIGURATION:
        "That configuration is invalid.",

    UNSAVED_CONFIGURATION:
        "There are unsaved configuration changes.",


    /*
     * --------------------------------
     * Permissions
     * --------------------------------
     */

    PERMISSION_DENIED:
        "You don't have permission to do that.",

    DEVELOPER_ONLY:
        "This command is restricted to the Fortune developer.",

    ADMIN_ONLY:
        "You need administrator permission to do that.",


    /*
     * --------------------------------
     * Discord
     * --------------------------------
     */

    DISCORD_API_ERROR:
        "Discord could not complete that request.",

});


module.exports = ERROR_MESSAGES;