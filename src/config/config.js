require("dotenv").config();

const config = {
    discord: {
        token: process.env.DISCORD_TOKEN,
        clientId: process.env.DISCORD_CLIENT_ID,
    },

    bot: {
        name: "VAULT",
        defaultPrefix: "bet",
    },

    developer: {
        userId: process.env.DEVELOPER_USER_ID,
    },
};

if (!config.discord.token) {
    throw new Error("DISCORD_TOKEN is missing from .env");
}

if (!config.discord.clientId) {
    throw new Error("DISCORD_CLIENT_ID is missing from .env");
}

if (!config.developer.userId) {
    throw new Error("DEVELOPER_USER_ID is missing from .env");
}

module.exports = config;