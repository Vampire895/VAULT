function validateSafeInteger(value, name) {
    if (!Number.isSafeInteger(value)) {
        throw new Error(
            `${name} must be a safe integer.`
        );
    }
}

function randomFloat() {
    return Math.random();
}

function randomInt(min, max) {
    validateSafeInteger(min, "RNG minimum");
    validateSafeInteger(max, "RNG maximum");

    if (min > max) {
        throw new Error(
            "RNG minimum cannot be greater than maximum."
        );
    }

    return (
        Math.floor(
            randomFloat() *
                (max - min + 1)
        ) + min
    );
}

function chance(probability) {
    if (
        typeof probability !== "number" ||
        !Number.isFinite(probability) ||
        probability < 0 ||
        probability > 1
    ) {
        throw new Error(
            "Probability must be between 0 and 1."
        );
    }

    return randomFloat() < probability;
}

function randomChoice(array) {
    if (
        !Array.isArray(array) ||
        array.length === 0
    ) {
        throw new Error(
            "Cannot choose from an empty array."
        );
    }

    return array[
        randomInt(
            0,
            array.length - 1
        )
    ];
}

function shuffle(array) {
    if (!Array.isArray(array)) {
        throw new Error(
            "Shuffle input must be an array."
        );
    }

    const result = [...array];

    for (
        let i = result.length - 1;
        i > 0;
        i--
    ) {
        const j =
            randomInt(0, i);

        [
            result[i],
            result[j],
        ] = [
            result[j],
            result[i],
        ];
    }

    return result;
}

module.exports = {
    randomFloat,
    randomInt,
    chance,
    randomChoice,
    shuffle,
};