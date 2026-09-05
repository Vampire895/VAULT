const {
    queryMany,
    transaction,
    execute,
} = require("./repository");

function collectTax(period, calculateTax) {
    if (
        typeof period !== "string" ||
        period.trim().length === 0
    ) {
        throw new Error(
            "Tax period must be a non-empty string."
        );
    }

    if (typeof calculateTax !== "function") {
        throw new Error(
            "Tax calculation function is required."
        );
    }

    return transaction(() => {
        const users = queryMany(`
            SELECT user_id, balance
            FROM users
            ORDER BY user_id
        `);

        let totalTax = 0;
        const results = [];

        for (const user of users) {
            const result = calculateTax(user.balance);

            if (result.tax <= 0) {
                results.push({
                    userId: user.user_id,
                    balanceBefore: user.balance,
                    tax: 0,
                    balanceAfter: user.balance,
                });

                continue;
            }

            const newBalance =
                user.balance - result.tax;

            if (newBalance < 0) {
                throw new Error(
                    `Tax would create a negative balance for user ${user.user_id}.`
                );
            }

            execute(`
                UPDATE users
                SET balance = @balance
                WHERE user_id = @userId
            `, {
                userId: user.user_id,
                balance: newBalance,
            });

            totalTax += result.tax;

            results.push({
                userId: user.user_id,
                balanceBefore: user.balance,
                tax: result.tax,
                balanceAfter: newBalance,
            });
        }

        execute(`
            UPDATE house_state
            SET
                house_purse = house_purse + @totalTax,
                tax_last_run = @period
            WHERE id = 1
        `, {
            totalTax,
            period: period.trim(),
        });

        return {
            period: period.trim(),
            totalTax,
            users: results,
        };
    });
}

module.exports = {
    collectTax,
};