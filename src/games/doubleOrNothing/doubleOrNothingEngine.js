const rng = require("../../services/rngService");

const WIN_PROBABILITY = 0.465;

function play() {
    const won = rng.chance(WIN_PROBABILITY);

    return {
        won,
        result: won ? "win" : "loss",
    };
}

function getWinProbability() {
    return WIN_PROBABILITY;
}

function getRTP() {
    return WIN_PROBABILITY * 2;
}

function getHouseEdge() {
    return 1 - getRTP();
}

module.exports = {
    play,
    getWinProbability,
    getRTP,
    getHouseEdge,
};