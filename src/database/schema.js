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
 * - Daily claim count
 * - Last daily claim date
 *
 * house_state
 * - Internal House Purse
 * - Monthly tax tracking
 *
 * jackpot_state
 * - Current Jackpot purse
 *
 * jackpot_contributions
 * - Current day's Jackpot contributor amounts
 *
 * No completed Jackpot history is permanently stored.
 */

function initializeSchema() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            user_id TEXT PRIMARY KEY,
            balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
            daily_claim_count INTEGER NOT NULL DEFAULT 0 CHECK (daily_claim_count >= 0),
            last_daily_claim TEXT
        );

        CREATE TABLE IF NOT EXISTS house_state (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            house_purse INTEGER NOT NULL DEFAULT 0 CHECK (house_purse >= 0),
            tax_last_run TEXT
        );

        CREATE TABLE IF NOT EXISTS jackpot_state (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            amount INTEGER NOT NULL DEFAULT 10000 CHECK (amount >= 0)
        );

        CREATE TABLE IF NOT EXISTS jackpot_contributions (
            user_id TEXT PRIMARY KEY,
            amount INTEGER NOT NULL DEFAULT 0 CHECK (amount > 0),
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
        );
    `);

    // Migrate databases created before Daily was added.
    const userColumns = db.prepare(`PRAGMA table_info(users)`).all();
    const hasDailyCount = userColumns.some((column) => column.name === "daily_claim_count");
    const hasLastDaily = userColumns.some((column) => column.name === "last_daily_claim");

    if (!hasDailyCount) {
        db.exec(`ALTER TABLE users ADD COLUMN daily_claim_count INTEGER NOT NULL DEFAULT 0 CHECK (daily_claim_count >= 0)`);
    }

    if (!hasLastDaily) {
        db.exec(`ALTER TABLE users ADD COLUMN last_daily_claim TEXT`);
    }

    db.prepare(`
        INSERT OR IGNORE INTO house_state (id, house_purse, tax_last_run)
        VALUES (1, 0, NULL)
    `).run();

    db.prepare(`
        INSERT OR IGNORE INTO jackpot_state (id, amount)
        VALUES (1, 10000)
    `).run();

    console.log("📋 Database schema initialized.");
}

module.exports = { initializeSchema };
