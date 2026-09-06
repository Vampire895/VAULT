const { registerCommand } = require("../registries/commandRegistry");

const testCommand = require("./test");
const balanceCommand = require("./balance");
const giveCommand = require("./give");
const configCommand = require("./config");
const devhouseCommand = require("./devhouse");
const spinCommand = require("./spin");
const coinflipCommand = require("./coinflip");
const blackjackCommand = require("./blackjack");
const doubleCommand = require("./double");
const rouletteCommand = require("./roulette");
const minesCommand = require("./mines");
const leaderboardCommand = require("./leaderboard");
const rankCommand = require("./rank");
const jackpotCommand = require("./jackpot");
const startCommand = require("./start");
const dailyCommand = require("./daily");
const helpCommand = require("./help");
const embedCommand = require("./embed");

function loadCommands() {
    registerCommand(testCommand);
    registerCommand(balanceCommand);
    registerCommand(giveCommand);
    registerCommand(configCommand);
    registerCommand(devhouseCommand);
    registerCommand(spinCommand);
    registerCommand(coinflipCommand);
    registerCommand(blackjackCommand);
    registerCommand(doubleCommand);
    registerCommand(rouletteCommand);
    registerCommand(minesCommand);
    registerCommand(leaderboardCommand);
    registerCommand(rankCommand);
    registerCommand(jackpotCommand);
    registerCommand(startCommand);
    registerCommand(dailyCommand);
    registerCommand(helpCommand);
    registerCommand(embedCommand);
}

module.exports = { loadCommands };
