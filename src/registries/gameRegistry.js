const games = new Map();

function registerGame(game) {
    if (!game?.name || typeof game.execute !== "function") {
        throw new Error("Invalid game registration.");
    }

    if (games.has(game.name)) {
        throw new Error(`Game "${game.name}" is already registered.`);
    }

    games.set(game.name, game);
}

function getGame(name) {
    return games.get(name);
}

function getAllGames() {
    return [...games.values()];
}

module.exports = {
    registerGame,
    getGame,
    getAllGames,
};