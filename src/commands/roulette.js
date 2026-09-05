const rouletteInteraction =
    require("../ui/rouletteInteraction");

module.exports = {
    name: "roulette",
    description: "Play European roulette.",

    options: [],

    async execute(interaction) {
        await rouletteInteraction.startRoulette(
            interaction
        );
    },
};