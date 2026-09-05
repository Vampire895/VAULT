const ERROR_CODES = Object.freeze({

    /*
     * --------------------------------
     * General
     * --------------------------------
     */

    UNKNOWN_ERROR:
        "UNKNOWN_ERROR",

    INTERNAL_ERROR:
        "INTERNAL_ERROR",

    INVALID_INPUT:
        "INVALID_INPUT",


    /*
     * --------------------------------
     * Economy
     * --------------------------------
     */

    INVALID_AMOUNT:
        "INVALID_AMOUNT",

    INSUFFICIENT_BALANCE:
        "INSUFFICIENT_BALANCE",

    INVALID_TARGET:
        "INVALID_TARGET",

    ACCOUNT_NOT_FOUND:
        "ACCOUNT_NOT_FOUND",

    BALANCE_UPDATE_FAILED:
        "BALANCE_UPDATE_FAILED",

    TRANSACTION_FAILED:
        "TRANSACTION_FAILED",


    /*
     * --------------------------------
     * Games
     * --------------------------------
     */

    GAME_NOT_FOUND:
        "GAME_NOT_FOUND",

    GAME_EXPIRED:
        "GAME_EXPIRED",

    GAME_ALREADY_ACTIVE:
        "GAME_ALREADY_ACTIVE",

    GAME_NOT_ACTIVE:
        "GAME_NOT_ACTIVE",

    INVALID_GAME_STATE:
        "INVALID_GAME_STATE",

    INVALID_GAME_ACTION:
        "INVALID_GAME_ACTION",

    INVALID_BET:
        "INVALID_BET",

    BET_TOO_LOW:
        "BET_TOO_LOW",

    BET_TOO_HIGH:
        "BET_TOO_HIGH",


    /*
     * --------------------------------
     * Multiplayer
     * --------------------------------
     */

    LOBBY_NOT_FOUND:
        "LOBBY_NOT_FOUND",

    LOBBY_FULL:
        "LOBBY_FULL",

    ALREADY_IN_LOBBY:
        "ALREADY_IN_LOBBY",

    NOT_IN_LOBBY:
        "NOT_IN_LOBBY",

    NOT_HOST:
        "NOT_HOST",

    GAME_ALREADY_STARTED:
        "GAME_ALREADY_STARTED",

    INVALID_LOBBY_STATE:
        "INVALID_LOBBY_STATE",


    /*
     * --------------------------------
     * Jackpot
     * --------------------------------
     */

    JACKPOT_NOT_FOUND:
        "JACKPOT_NOT_FOUND",

    INVALID_CONTRIBUTION:
        "INVALID_CONTRIBUTION",

    CONTRIBUTION_TOO_HIGH:
        "CONTRIBUTION_TOO_HIGH",

    JACKPOT_SETTLEMENT_FAILED:
        "JACKPOT_SETTLEMENT_FAILED",


    /*
     * --------------------------------
     * Configuration
     * --------------------------------
     */

    CONFIG_NOT_FOUND:
        "CONFIG_NOT_FOUND",

    INVALID_CONFIGURATION:
        "INVALID_CONFIGURATION",

    UNSAVED_CONFIGURATION:
        "UNSAVED_CONFIGURATION",


    /*
     * --------------------------------
     * Permissions
     * --------------------------------
     */

    PERMISSION_DENIED:
        "PERMISSION_DENIED",

    DEVELOPER_ONLY:
        "DEVELOPER_ONLY",

    ADMIN_ONLY:
        "ADMIN_ONLY",


    /*
     * --------------------------------
     * Discord
     * --------------------------------
     */

    DISCORD_API_ERROR:
        "DISCORD_API_ERROR",

});


module.exports = ERROR_CODES;