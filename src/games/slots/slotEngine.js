const {
    getSlotMachine,
} = require("./slotConfigurations");

const rngService = require("../../services/rngService");

function validateMachine(machine) {
    if (!machine || typeof machine !== "object") {
        throw new Error("Invalid slot machine.");
    }

    if (!Array.isArray(machine.symbols) || machine.symbols.length === 0) {
        throw new Error("Slot machine has no symbols.");
    }

    if (!Array.isArray(machine.outcomes) || machine.outcomes.length === 0) {
        throw new Error("Slot machine has no outcomes.");
    }

    if (!Number.isInteger(machine.reels) || machine.reels <= 0) {
        throw new Error("Invalid slot reel configuration.");
    }

    for (const outcome of machine.outcomes) {
        if (
            typeof outcome.probability !== "number" ||
            outcome.probability < 0 ||
            outcome.probability > 1
        ) {
            throw new Error(
                `Invalid probability for outcome "${outcome.id}".`
            );
        }

        if (
            !Array.isArray(outcome.combinations) ||
            outcome.combinations.length === 0
        ) {
            throw new Error(
                `Outcome "${outcome.id}" has no combinations.`
            );
        }

        for (const combination of outcome.combinations) {
            if (
                !Array.isArray(combination) ||
                combination.length !== machine.reels
            ) {
                throw new Error(
                    `Invalid combination for outcome "${outcome.id}".`
                );
            }
        }
    }
}

function selectOutcome(outcomes) {
    const roll = rngService.randomFloat();

    let cumulative = 0;

    for (const outcome of outcomes) {
        cumulative += outcome.probability;

        if (roll < cumulative) {
            return outcome;
        }
    }

    return outcomes[outcomes.length - 1];
}

function selectCombination(combinations) {
    const index = rngService.randomInt(
        0,
        combinations.length - 1
    );

    return combinations[index];
}

function getSymbolById(machine, symbolId) {
    const symbol = machine.symbols.find(
        (item) => item.id === symbolId
    );

    if (!symbol) {
        throw new Error(
            `Unknown slot symbol "${symbolId}".`
        );
    }

    return symbol;
}

function spin(machineId = "classic") {
    const machine = getSlotMachine(machineId);

    validateMachine(machine);

    const outcome = selectOutcome(machine.outcomes);

    const combination = selectCombination(
        outcome.combinations
    );

    const symbols = combination.map((symbolId) =>
        getSymbolById(machine, symbolId)
    );

    return {
        machineId: machine.id,
        machineName: machine.name,

        symbols,

        outcome: {
            id: outcome.id,
            tier: outcome.tier,
            multiplier: outcome.multiplier,
        },

        jackpot: machine.jackpot,
    };
}

module.exports = {
    spin,
};