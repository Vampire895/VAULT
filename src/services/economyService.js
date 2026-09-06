const userRepository = require("../database/userRepository");
const configurationService = require("./configurationService");
const { AppError, ERROR_CODES } = require("../errors");

function validateUserId(userId) {
    if (typeof userId !== "string" || userId.trim().length === 0) throw new AppError(ERROR_CODES.INVALID_INPUT);
}

function validateAmount(amount) {
    if (typeof amount !== "number" || !Number.isSafeInteger(amount) || amount <= 0) throw new AppError(ERROR_CODES.INVALID_AMOUNT);
}

function getExistingAccount(userId) {
    validateUserId(userId);
    return userRepository.findById(userId);
}

function hasAccount(userId) {
    return Boolean(getExistingAccount(userId));
}

function createAccount(userId) {
    validateUserId(userId);

    const existingUser = userRepository.findById(userId);
    if (existingUser) return existingUser;

    const startingBalance = configurationService.getStartingBalance();
    if (!Number.isSafeInteger(startingBalance) || startingBalance < 0) {
        throw new AppError(ERROR_CODES.INVALID_CONFIGURATION, "Invalid starting balance configuration.");
    }

    userRepository.create(userId, startingBalance);

    const account = userRepository.findById(userId);
    if (!account) throw new AppError(ERROR_CODES.ACCOUNT_NOT_FOUND);
    return account;
}

function getAccount(userId) {
    const account = getExistingAccount(userId);
    if (!account) throw new AppError(ERROR_CODES.ACCOUNT_NOT_FOUND);
    return account;
}

function getBalance(userId) {
    return getAccount(userId).balance;
}

function deposit(userId, amount) {
    validateAmount(amount);
    const account = getAccount(userId);
    const newBalance = account.balance + amount;
    if (!Number.isSafeInteger(newBalance)) throw new AppError(ERROR_CODES.PAYOUT_TOO_LARGE, "Balance exceeds the maximum safe value.");
    userRepository.updateBalance(userId, newBalance);
    return newBalance;
}

function withdraw(userId, amount) {
    validateAmount(amount);
    const account = getAccount(userId);
    if (account.balance < amount) throw new AppError(ERROR_CODES.INSUFFICIENT_BALANCE);
    const newBalance = account.balance - amount;
    userRepository.updateBalance(userId, newBalance);
    return newBalance;
}

function transfer(senderId, recipientId, amount) {
    validateAmount(amount);
    if (senderId === recipientId) throw new AppError(ERROR_CODES.INVALID_TARGET, "You cannot transfer coins to yourself.");
    getAccount(senderId);
    getAccount(recipientId);

    try {
        return userRepository.transfer(senderId, recipientId, amount);
    } catch (error) {
        if (error.message === "Insufficient balance.") throw new AppError(ERROR_CODES.INSUFFICIENT_BALANCE);
        throw error;
    }
}

function claimDaily(userId, reward, claimDate) {
    validateUserId(userId);
    validateAmount(reward);
    if (typeof claimDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(claimDate)) throw new AppError(ERROR_CODES.INVALID_INPUT);

    getAccount(userId);

    try {
        return userRepository.claimDaily(userId, reward, claimDate);
    } catch (error) {
        if (error.message === "Daily reward already claimed today.") {
            throw new AppError(ERROR_CODES.INVALID_INPUT, "You have already claimed your Daily reward today. Come back tomorrow! 🌅");
        }
        throw error;
    }
}

module.exports = {
    createAccount,
    getAccount,
    getExistingAccount,
    hasAccount,
    getBalance,
    deposit,
    withdraw,
    transfer,
    claimDaily,
};
