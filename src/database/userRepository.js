const {
    execute,
    queryOne,
    queryMany,
    transaction,
} = require("./repository");


/*
 * --------------------------------
 * Find User
 * --------------------------------
 */

function findById(userId) {

    return queryOne(
        `
        SELECT user_id, balance
        FROM users
        WHERE user_id = @userId
        `,
        {
            userId,
        }
    );
}


/*
 * --------------------------------
 * Create User
 * --------------------------------
 */

function create(
    userId,
    startingBalance = 0
) {

    return execute(
        `
        INSERT INTO users (user_id, balance)
        VALUES (@userId, @startingBalance)
        `,
        {
            userId,
            startingBalance,
        }
    );
}


/*
 * --------------------------------
 * Update Balance
 * --------------------------------
 */

function updateBalance(
    userId,
    balance
) {

    return execute(
        `
        UPDATE users
        SET balance = @balance
        WHERE user_id = @userId
        `,
        {
            userId,
            balance,
        }
    );
}


/*
 * --------------------------------
 * Deduct Balance
 * --------------------------------
 */

function deductBalance(
    userId,
    amount
) {

    return transaction(() => {

        return deductBalanceInTransaction(
            userId,
            amount
        );

    });
}


function deductBalanceInTransaction(
    userId,
    amount
) {

    const user =
        findById(userId);

    if (!user) {

        throw new Error(
            "Account not found."
        );

    }


    if (
        !Number.isSafeInteger(amount) ||
        amount <= 0
    ) {

        throw new Error(
            "Invalid wager amount."
        );

    }


    if (
        user.balance < amount
    ) {

        throw new Error(
            "Insufficient balance."
        );

    }


    const newBalance =
        user.balance - amount;


    updateBalance(
        userId,
        newBalance
    );


    return {

        balanceBefore:
            user.balance,

        balanceAfter:
            newBalance,

        amount,

    };
}


/*
 * --------------------------------
 * Add Balance
 * --------------------------------
 */

function addBalance(
    userId,
    amount
) {

    return transaction(() => {

        return addBalanceInTransaction(
            userId,
            amount
        );

    });
}


function addBalanceInTransaction(
    userId,
    amount
) {

    const user =
        findById(userId);

    if (!user) {

        throw new Error(
            "Account not found."
        );

    }


    if (
        !Number.isSafeInteger(amount) ||
        amount <= 0
    ) {

        throw new Error(
            "Invalid payout amount."
        );

    }


    const newBalance =
        user.balance + amount;


    if (
        !Number.isSafeInteger(newBalance)
    ) {

        throw new Error(
            "Balance exceeds the maximum safe value."
        );

    }


    updateBalance(
        userId,
        newBalance
    );


    return {

        balanceBefore:
            user.balance,

        balanceAfter:
            newBalance,

        amount,

    };
}


/*
 * --------------------------------
 * Transfer
 * --------------------------------
 */

function transfer(
    senderId,
    recipientId,
    amount
) {

    return transaction(() => {

        const sender =
            findById(senderId);

        const recipient =
            findById(recipientId);


        if (
            !sender ||
            !recipient
        ) {

            throw new Error(
                "Transfer account not found."
            );

        }


        if (
            !Number.isSafeInteger(amount) ||
            amount <= 0
        ) {

            throw new Error(
                "Invalid transfer amount."
            );

        }


        if (
            sender.balance < amount
        ) {

            throw new Error(
                "Insufficient balance."
            );

        }


        const senderBalance =
            sender.balance - amount;

        const recipientBalance =
            recipient.balance + amount;


        if (
            !Number.isSafeInteger(
                recipientBalance
            )
        ) {

            throw new Error(
                "Recipient balance exceeds the maximum safe value."
            );

        }


        updateBalance(
            senderId,
            senderBalance
        );

        updateBalance(
            recipientId,
            recipientBalance
        );


        return {

            senderBalance,

            recipientBalance,

        };

    });
}


/*
 * --------------------------------
 * Count Users Above Balance
 * --------------------------------
 *
 * Used by Rank Service.
 *
 * Example:
 *
 * User has 120,900 Ether.
 *
 * If 1 user has more than
 * 120,900 Ether:
 *
 * rank = 2
 *
 * Equal balances are NOT counted
 * as higher.
 */

function countUsersWithBalanceGreaterThan(
    balance
) {

    const result =
        queryOne(
            `
            SELECT COUNT(*) AS count
            FROM users
            WHERE balance > @balance
            `,
            {
                balance,
            }
        );


    return Number(
        result?.count ?? 0
    );
}


/*
 * --------------------------------
 * Find All
 * --------------------------------
 */

function findAll() {

    return queryMany(
        `
        SELECT user_id, balance
        FROM users
        ORDER BY user_id
        `
    );
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

    transfer,

    countUsersWithBalanceGreaterThan,

};