const { REST, Routes } = require("discord.js");
const config = require("../config/config");
const { getAllCommands } = require("./commandRegistry");

async function deployCommands() {
    const commands = getAllCommands().map((command) => ({
        name: command.name,
        description: command.description,
        options: command.options || [],
    }));

    const rest = new REST({ version: "10" }).setToken(config.discord.token);

    await rest.put(
        Routes.applicationCommands(config.discord.clientId),
        {
            body: commands,
        }
    );

    console.log(`📡 Deployed ${commands.length} application command(s).`);
}

module.exports = {
    deployCommands,
};