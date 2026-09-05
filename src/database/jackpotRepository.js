const {
    execute,
    queryOne,
    queryMany,
    transaction,
} = require("./repository");


/*
 * --------------------------------
 * Jackpot Constants
 * --------------------------------
 */

const JACKPOT_SEED = 10000;


/*
 * --------------------------------
 * Initialize Jackpot Tables
 * --------------------------------
 *
 * Only CURRENT jackpot state is kept.
 *
 * No historical jackpot records.
 */

function initialize() {

    execute(`
        CREATE TABLE IF NOT EXISTS jackpot_state (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            amount INTEGER NOT NULL DEFAULT 10000
        )
    `);

    execute(`
        CREATE TABLE IF NOT EXISTS jackpot_contributions (
            user_id TEXT PRIMARY KEY,
            amount INTEGER NOT NULL DEFAULT 0
        )
    `);

    const state = queryOne(`
        SELECT id, amount
        FROM jackpot_state
        WHERE id = 1
    `);

    if (!state) {

        execute(`
            INSERT INTO jackpot_state (
                id,
                amount
            )
            VALUES (
                1,
                @amount
            )
        `, {
            amount: JACKPOT_SEED,
        });
    }
}


/*
 * --------------------------------
 * Current Jackpot
 * --------------------------------
 */

function getAmount() {

    initialize();

    const row = queryOne(`
        SELECT amount
        FROM jackpot_state
        WHERE id = 1
    `);

    return Number(
        row?.amount ?? JACKPOT_SEED
    );
}


/*
 * --------------------------------
 * Add To Jackpot
 * --------------------------------
 */

function addAmount(amount) {

    initialize();

    execute(`
        UPDATE jackpot_state
        SET amount = amount + @amount
        WHERE id = 1
    `, {
        amount,
    });
}


/*
 * --------------------------------
 * Contribution
 * --------------------------------
 */

function addContribution(
    userId,
    amount
) {

    initialize();

    execute(`
        INSERT INTO jackpot_contributions (
            user_id,
            amount
        )
        VALUES (
            @userId,
            @amount
        )
        ON CONFLICT(user_id)
        DO UPDATE SET
            amount = amount + excluded.amount
    `, {
        userId,
        amount,
    });
}


/*
 * --------------------------------
 * Contributors
 * --------------------------------
 */

function getContributors() {

    initialize();

    return queryMany(`
        SELECT
            user_id,
            amount
        FROM jackpot_contributions
        WHERE amount > 0
        ORDER BY user_id
    `);
}


/*
 * --------------------------------
 * Reset
 * --------------------------------
 */

function reset() {

    initialize();

    execute(`
        UPDATE jackpot_state
        SET amount = @seed
        WHERE id = 1
    `, {
        seed: JACKPOT_SEED,
    });

    execute(`
        DELETE FROM jackpot_contributions
    `);
}


/*
 * --------------------------------
 * Atomic Settlement
 * --------------------------------
 *
 * The callback runs inside ONE SQLite
 * transaction.
 */

function atomic(callback) {

    return transaction(callback);
}


module.exports = {

    JACKPOT_SEED,

    initialize,

    getAmount,

    addAmount,

    addContribution,

    getContributors,

    reset,

    atomic,

};