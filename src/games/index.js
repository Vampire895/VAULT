const { registerGame } = require("../registries/gameRegistry");
const testGame = require("./testGame");

function loadGames() {
    registerGame(testGame);
}

module.exports = {
    loadGames,
};