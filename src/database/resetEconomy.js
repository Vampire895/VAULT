const db = require("./database");

const reset = db.transaction(() => {
    // Remove all current Jackpot contributions.
    db.prepare(`
        DELETE FROM jackpot_contributions
    `).run();

    // Remove every Fortune user account.
    db.prepare(`
        DELETE FROM users
    `).run();

    // Reset Jackpot to the default 10,000 Ether seed.
    db.prepare(`
        UPDATE jackpot_state
        SET amount = 10000
        WHERE id = 1
    `).run();
});

reset();

const userCount =
    db.prepare(`
        SELECT COUNT(*) AS count
        FROM users
    `).get().count;

const jackpot =
    db.prepare(`
        SELECT amount
        FROM jackpot_state
        WHERE id = 1
    `).get().amount;

const contributions =
    db.prepare(`
        SELECT COUNT(*) AS count
        FROM jackpot_contributions
    `).get().count;

console.log("🧹 Fortune economy reset complete.");
console.log(`👥 Users remaining: ${userCount}`);
console.log(`🎰 Jackpot: ${jackpot}`);
console.log(`🎟️ Jackpot contributors: ${contributions}`);