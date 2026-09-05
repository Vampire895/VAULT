const db = require("./database");


/*
 * --------------------------------
 * Database Schema
 * --------------------------------
 *
 * Fortune V1 persistent state:
 *
 * users
 * - User ID
 * - Current balance
 *
 * house_state
 * - Internal House Purse
 * - Monthly tax tracking
 *
 * jackpot_state
 * - Current Jackpot purse
 *
 * jackpot_contributions
 * - Current day's Jackpot
 *   contributor amounts
 *
 * No completed Jackpot history
 * is permanently stored.
 */

function initializeSchema() {

    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            user_id TEXT PRIMARY KEY,
            balance INTEGER NOT NULL DEFAULT 0
                CHECK (balance >= 0)
        );


        CREATE TABLE IF NOT EXISTS house_state (
            id INTEGER PRIMARY KEY CHECK (id = 1),

            house_purse INTEGER NOT NULL DEFAULT 0
                CHECK (house_purse >= 0),

            tax_last_run TEXT
        );


        /*
         * --------------------------------
         * Jackpot State
         * --------------------------------
         *
         * Only the CURRENT Jackpot exists.
         *
         * Default seed:
         * 10,000 Ethers
         */

        CREATE TABLE IF NOT EXISTS jackpot_state (
            id INTEGER PRIMARY KEY CHECK (id = 1),

            amount INTEGER NOT NULL DEFAULT 10000
                CHECK (amount >= 0)
        );


        /*
         * --------------------------------
         * Jackpot Contributions
         * --------------------------------
         *
         * Stores only the current
         * Jackpot's contributor totals.
         *
         * This table is cleared after
         * every daily settlement.
         */

        CREATE TABLE IF NOT EXISTS jackpot_contributions (
            user_id TEXT PRIMARY KEY,

            amount INTEGER NOT NULL DEFAULT 0
                CHECK (amount > 0),

            FOREIGN KEY (user_id)
                REFERENCES users(user_id)
                ON DELETE CASCADE
        );
    `);


    /*
     * --------------------------------
     * Initialize House State
     * --------------------------------
     */

    db.prepare(`
        INSERT OR IGNORE INTO house_state (
            id,
            house_purse,
            tax_last_run
        )
        VALUES (
            1,
            0,
            NULL
        )
    `).run();


    /*
     * --------------------------------
     * Initialize Jackpot State
     * --------------------------------
     */

    db.prepare(`
        INSERT OR IGNORE INTO jackpot_state (
            id,
            amount
        )
        VALUES (
            1,
            10000
        )
    `).run();


    console.log(
        "📋 Database schema initialized."
    );
}


module.exports = {
    initializeSchema,
};