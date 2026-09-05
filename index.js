const {
    Client,
    GatewayIntentBits,
} = require("discord.js");

const config =
    require("./src/config/config");

const {
    loadCommands,
} = require("./src/commands");

const {
    deployCommands,
} = require("./src/registries/commandDeployer");

const {
    handleInteraction,
} = require("./src/registries/commandHandler");

const {
    handlePrefixMessage,
} = require("./src/registries/prefixHandler");

const {
    loadGames,
} = require("./src/games");

const {
    initializeDatabase,
} = require("./src/database/initDatabase");

const {
    rewardNewRoles,
} = require("./src/services/roleGiftService");

const taxService =
    require("./src/services/taxService");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});


/*
 * ==========================================
 * DISCORD EVENTS
 * ==========================================
 */

/*
 * Role Gift detection.
 *
 * Rewards are only handled when a user
 * newly receives a configured role.
 */
client.on(
    "guildMemberUpdate",
    async (oldMember, newMember) => {
        try {
            const rewards =
                rewardNewRoles(
                    oldMember,
                    newMember
                );

            for (const reward of rewards) {
                console.log(
                    `🎁 Role Gift: ${newMember.user.tag} received ${reward.amount.toLocaleString()} coins for role ${reward.roleId}.`
                );
            }
        } catch (error) {
            console.error(
                "❌ Role Gift processing failed:",
                error
            );
        }
    }
);


/*
 * Slash commands and Discord component
 * interactions.
 */
client.on(
    "interactionCreate",
    handleInteraction
);


/*
 * Prefix commands.
 *
 * Example:
 * bet balance
 * bet spin 500
 * bet coinflip 500 heads
 */
client.on(
    "messageCreate",
    handlePrefixMessage
);


/*
 * ==========================================
 * APPLICATION INITIALIZATION
 * ==========================================
 */

initializeDatabase();

loadCommands();

loadGames();


/*
 * ==========================================
 * READY
 * ==========================================
 */

client.once(
    "clientReady",
    async () => {
        console.log(
            `✅ ${config.bot.name} is online!`
        );

        console.log(
            `📌 Default prefix: ${config.bot.defaultPrefix}`
        );

        const {
            getAllCommands,
        } = require(
            "./src/registries/commandRegistry"
        );

        console.log(
            `📦 Loaded commands: ${getAllCommands().length}`
        );

        const {
            getAllGames,
        } = require(
            "./src/registries/gameRegistry"
        );

        console.log(
            `🎮 Loaded games: ${getAllGames().length}`
        );


        /*
         * Monthly tax collection.
         *
         * The tax service itself handles
         * duplicate-period protection.
         */
        const taxResult =
            taxService.collectMonthlyTax();

        if (taxResult.collected) {
            console.log(
                `💰 Monthly tax collected: ${taxResult.totalTax.toLocaleString()} coins.`
            );
        } else {
            console.log(
                `📅 Monthly tax already processed for ${taxResult.period}.`
            );
        }


        /*
         * Deploy slash commands after the
         * client is ready.
         */
        await deployCommands();
    }
);


/*
 * ==========================================
 * LOGIN
 * ==========================================
 */

client.login(
    config.discord.token
);