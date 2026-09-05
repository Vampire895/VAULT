const AppError = require("../errors/AppError");
const houseRepository = require("../database/houseRepository");
const taxRepository = require("../database/taxRepository");

const TAX_BRACKETS = [
    {
        minimum: 0,
        maximum: 500000,
        rate: 0,
    },
    {
        minimum: 500000,
        maximum: 2000000,
        rate: 0.05,
    },
    {
        minimum: 2000000,
        maximum: 30000000,
        rate: 0.10,
    },
    {
        minimum: 30000000,
        maximum: Infinity,
        rate: 0.20,
    },
];

function validateBalance(balance) {
    if (
        typeof balance !== "number" ||
        !Number.isSafeInteger(balance) ||
        balance < 0
    ) {
        throw new AppError(
            "Invalid balance.",
            "INVALID_BALANCE"
        );
    }
}

function getTaxRate(balance) {
    validateBalance(balance);

    for (const bracket of TAX_BRACKETS) {
        if (
            balance >= bracket.minimum &&
            balance < bracket.maximum
        ) {
            return bracket.rate;
        }
    }

    throw new AppError(
        "Unable to determine tax rate.",
        "TAX_RATE_ERROR"
    );
}

function calculateTax(balance) {
    validateBalance(balance);

    const rate = getTaxRate(balance);
    const tax = Math.floor(balance * rate);

    return {
        balance,
        rate,
        tax,
    };
}

function getCurrentTaxPeriod(date = new Date()) {
    const year = date.getUTCFullYear();

    const month = String(
        date.getUTCMonth() + 1
    ).padStart(2, "0");

    return `${year}-${month}`;
}

function isTaxAlreadyCollected(period) {
    return (
        houseRepository.getTaxLastRun() === period
    );
}

function collectMonthlyTax(date = new Date()) {
    const period = getCurrentTaxPeriod(date);

    if (isTaxAlreadyCollected(period)) {
        return {
            collected: false,
            period,
            totalTax: 0,
            reason: "ALREADY_COLLECTED",
        };
    }

    const result = taxRepository.collectTax(
        period,
        calculateTax
    );

    return {
        collected: true,
        period: result.period,
        totalTax: result.totalTax,
        users: result.users,
    };
}

module.exports = {
    TAX_BRACKETS,
    getTaxRate,
    calculateTax,
    getCurrentTaxPeriod,
    isTaxAlreadyCollected,
    collectMonthlyTax,
};