const rngService = require("../../services/rngService");
const { AppError, ERROR_CODES } = require("../../errors");

const OUTCOMES = {
    HEADS: "heads",
    TAILS: "tails",
};

function normalizeChoice(choice) {
    if (!choice) {
        return OUTCOMES.HEADS;
    }

    const normalized = String(choice)
        .trim()
        .toLowerCase();

    if (
        normalized === "h" ||
        normalized === "heads"
    ) {
        return OUTCOMES.HEADS;
    }

    if (
        normalized === "t" ||
        normalized === "tails"
    ) {
        return OUTCOMES.TAILS;
    }

    throw new AppError(
        ERROR_CODES.INVALID_INPUT,
        'Coinflip choice must be "heads" or "tails".'
    );
}

function flip(choice) {
    const selected = normalizeChoice(choice);

    const result = rngService.chance(0.5)
        ? OUTCOMES.HEADS
        : OUTCOMES.TAILS;

    const won = selected === result;

    return {
        choice: selected,
        result,
        won,
        multiplier: won ? 1.90 : 0,
    };
}

module.exports = {
    flip,
    normalizeChoice,
};