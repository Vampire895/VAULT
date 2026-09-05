const userRepository =
    require("../database/userRepository");

const configurationService =
    require("./configurationService");

const {
    AppError,
    ERROR_CODES,
} = require("../errors");


function validateUserId(userId) {

    if (
        typeof userId !== "string" ||
        userId.trim().length === 0
    ) {
        throw new AppError(
            ERROR_CODES.INVALID_INPUT
        );
    }
}


function validateAmount(amount) {

    if (
        typeof amount !== "number" ||
        !Number.isSafeInteger(amount) ||
        amount <= 0
    ) {
        throw new AppError(
            ERROR_CODES.INVALID_AMOUNT
        );
    }
}


/**
 * Return an existing account.
 *
 * IMPORTANT:
 * This does NOT create an account.
 */
function getExistingAccount(userId) {

    validateUserId(userId);

    return userRepository.findById(userId);
}


/**
 * Check whether a user has completed onboarding.
 */
function hasAccount(userId) {

    return Boolean(
        getExistingAccount(userId)
    );
}


/**
 * Explicitly create a new Fortune account.
 *
 * If the account already exists, the existing
 * account is returned.
 *
 * This prevents /start from awarding the
 * starting balance more than once.
 */
function createAccount(userId) {

    validateUserId(userId);

    const existingUser =
        userRepository.findById(userId);

    if (existingUser) {
        return existingUser;
    }


    const startingBalance =
        configurationService.getStartingBalance();


    if (
        !Number.isSafeInteger(
            startingBalance
        ) ||
        startingBalance < 0
    ) {
        throw new AppError(
            ERROR_CODES.INVALID_CONFIGURATION,
            "Invalid starting balance configuration."
        );
    }


    userRepository.create(
        userId,
        startingBalance
    );


    const account =
        userRepository.findById(userId);


    if (!account) {
        throw new AppError(
            ERROR_CODES.ACCOUNT_NOT_FOUND
        );
    }


    return account;
}


/**
 * Existing legacy account accessor.
 *
 * Kept for compatibility with the current
 * economy/game services.
 */
function getAccount(userId) {

    const account =
        getExistingAccount(userId);

    if (!account) {
        throw new AppError(
            ERROR_CODES.ACCOUNT_NOT_FOUND
        );
    }

    return account;
}


function getBalance(userId) {

    const account =
        getAccount(userId);

    return account.balance;
}


function deposit(
    userId,
    amount
) {

    validateAmount(amount);

    const account =
        getAccount(userId);


    const newBalance =
        account.balance +
        amount;


    if (
        !Number.isSafeInteger(
            newBalance
        )
    ) {
        throw new AppError(
            ERROR_CODES.PAYOUT_TOO_LARGE,
            "Balance exceeds the maximum safe value."
        );
    }


    userRepository.updateBalance(
        userId,
        newBalance
    );


    return newBalance;
}


function withdraw(
    userId,
    amount
) {

    validateAmount(amount);

    const account =
        getAccount(userId);


    if (
        account.balance <
        amount
    ) {
        throw new AppError(
            ERROR_CODES.INSUFFICIENT_BALANCE
        );
    }


    const newBalance =
        account.balance -
        amount;


    userRepository.updateBalance(
        userId,
        newBalance
    );


    return newBalance;
}


function transfer(
    senderId,
    recipientId,
    amount
) {

    validateAmount(amount);


    if (
        senderId === recipientId
    ) {
        throw new AppError(
            ERROR_CODES.INVALID_TARGET,
            "You cannot transfer coins to yourself."
        );
    }


    getAccount(senderId);
    getAccount(recipientId);


    try {

        return userRepository.transfer(
            senderId,
            recipientId,
            amount
        );

    } catch (error) {

        if (
            error.message ===
            "Insufficient balance."
        ) {
            throw new AppError(
                ERROR_CODES.INSUFFICIENT_BALANCE
            );
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
};