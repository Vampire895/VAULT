function isPositiveNumber(value) {
    return (
        typeof value === "number" &&
        Number.isFinite(value) &&
        value > 0
    );
}

function isNonNegativeNumber(value) {
    return (
        typeof value === "number" &&
        Number.isFinite(value) &&
        value >= 0
    );
}

function isInteger(value) {
    return Number.isInteger(value);
}

function isPositiveSafeInteger(value) {
    return (
        Number.isSafeInteger(value) &&
        value > 0
    );
}

function isNonNegativeSafeInteger(value) {
    return (
        Number.isSafeInteger(value) &&
        value >= 0
    );
}

module.exports = {
    isPositiveNumber,
    isNonNegativeNumber,
    isInteger,
    isPositiveSafeInteger,
    isNonNegativeSafeInteger,
};