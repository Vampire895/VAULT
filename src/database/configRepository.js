const {
    execute,
    queryOne,
} = require("./repository");

function initialize() {
    execute(`
        CREATE TABLE IF NOT EXISTS config (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    `);
}

function get(key) {
    return queryOne(
        `
        SELECT key, value
        FROM config
        WHERE key = @key
        `,
        { key }
    );
}

function set(key, value) {
    execute(
        `
        INSERT INTO config (key, value)
        VALUES (@key, @value)
        ON CONFLICT(key)
        DO UPDATE SET value = excluded.value
        `,
        {
            key,
            value: String(value),
        }
    );
}

module.exports = {
    initialize,
    get,
    set,
};