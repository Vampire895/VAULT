const { execute, queryOne, queryMany, transaction } = require("./repository");

function findById(userId) {
    return queryOne(`SELECT user_id, balance, daily_claim_count, last_daily_claim FROM users WHERE user_id = @userId`, { userId });
}

function create(userId, startingBalance = 0) {
    return execute(`INSERT OR IGNORE INTO users (user_id, balance) VALUES (@userId, @startingBalance)`, { userId, startingBalance });
}

function updateBalance(userId, balance) {
    return execute(`UPDATE users SET balance = @balance WHERE user_id = @userId`, { userId, balance });
}

function deductBalance(userId, amount) {
    return transaction(() => deductBalanceInTransaction(userId, amount));
}

function deductBalanceInTransaction(userId, amount) {
    const user = findById(userId);
    if (!user) throw new Error("Account not found.");
    if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error("Invalid wager amount.");
    if (user.balance < amount) throw new Error("Insufficient balance.");
    const newBalance = user.balance - amount;
    updateBalance(userId, newBalance);
    return { balanceBefore: user.balance, balanceAfter: newBalance, amount };
}

function addBalance(userId, amount) {
    return transaction(() => addBalanceInTransaction(userId, amount));
}

function addBalanceInTransaction(userId, amount) {
    const user = findById(userId);
    if (!user) throw new Error("Account not found.");
    if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error("Invalid payout amount.");
    const newBalance = user.balance + amount;
    if (!Number.isSafeInteger(newBalance)) throw new Error("Balance exceeds the maximum safe value.");
    updateBalance(userId, newBalance);
    return { balanceBefore: user.balance, balanceAfter: newBalance, amount };
}

function claimDaily(userId, reward, claimDate) {
    return transaction(() => {
        const user = findById(userId);
        if (!user) throw new Error("Account not found.");
        if (user.last_daily_claim === claimDate) throw new Error("Daily reward already claimed today.");
        if (!Number.isSafeInteger(reward) || reward <= 0) throw new Error("Invalid daily reward.");

        const newBalance = user.balance + reward;
        const newClaimCount = user.daily_claim_count + 1;

        if (!Number.isSafeInteger(newBalance) || !Number.isSafeInteger(newClaimCount)) {
            throw new Error("Daily reward exceeds the maximum safe value.");
        }

        const result = execute(`
            UPDATE users
            SET balance = @balance, daily_claim_count = @claimCount, last_daily_claim = @claimDate
            WHERE user_id = @userId AND (last_daily_claim IS NULL OR last_daily_claim != @claimDate)
        `, { userId, balance: newBalance, claimCount: newClaimCount, claimDate });

        if (result.changes !== 1) throw new Error("Daily reward already claimed today.");

        return {
            balanceBefore: user.balance,
            balanceAfter: newBalance,
            reward,
            claimCount: newClaimCount,
            claimDate,
        };
    });
}

function transfer(senderId, recipientId, amount) {
    return transaction(() => {
        const sender = findById(senderId);
        const recipient = findById(recipientId);
        if (!sender || !recipient) throw new Error("Transfer account not found.");
        if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error("Invalid transfer amount.");
        if (sender.balance < amount) throw new Error("Insufficient balance.");
        const senderBalance = sender.balance - amount;
        const recipientBalance = recipient.balance + amount;
        if (!Number.isSafeInteger(recipientBalance)) throw new Error("Recipient balance exceeds the maximum safe value.");
        updateBalance(senderId, senderBalance);
        updateBalance(recipientId, recipientBalance);
        return { senderBalance, recipientBalance };
    });
}

function countUsersWithBalanceGreaterThan(balance) {
    const result = queryOne(`SELECT COUNT(*) AS count FROM users WHERE balance > @balance`, { balance });
    return Number(result?.count ?? 0);
}

function findAll() {
    return queryMany(`SELECT user_id, balance, daily_claim_count, last_daily_claim FROM users ORDER BY user_id`);
}

module.exports = {
    findById,
    findAll,
    create,
    updateBalance,
    deductBalance,
    deductBalanceInTransaction,
    addBalance,
    addBalanceInTransaction,
    claimDaily,
    transfer,
    countUsersWithBalanceGreaterThan,
};
