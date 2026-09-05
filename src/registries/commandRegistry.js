const commands = new Map();

function registerCommand(command) {
    if (
        !command?.name ||
        typeof command.execute !== "function"
    ) {
        throw new Error(
            "Invalid command registration."
        );
    }

    const commandName =
        command.name.toLowerCase();

    if (commands.has(commandName)) {
        throw new Error(
            `Command "${command.name}" is already registered.`
        );
    }

    commands.set(
        commandName,
        command
    );

    if (Array.isArray(command.aliases)) {
        for (const alias of command.aliases) {
            if (
                typeof alias !== "string" ||
                alias.trim() === ""
            ) {
                throw new Error(
                    `Invalid alias for command "${command.name}".`
                );
            }

            const normalizedAlias =
                alias.toLowerCase();

            if (
                commands.has(normalizedAlias)
            ) {
                throw new Error(
                    `Command or alias "${alias}" is already registered.`
                );
            }

            commands.set(
                normalizedAlias,
                command
            );
        }
    }
}

function getCommand(name) {
    if (
        typeof name !== "string"
    ) {
        return undefined;
    }

    return commands.get(
        name.toLowerCase()
    );
}

function getAllCommands() {
    return [
        ...new Set(
            commands.values()
        ),
    ];
}

module.exports = {
    registerCommand,
    getCommand,
    getAllCommands,
};