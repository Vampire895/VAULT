const db = require("./database");

function execute(sql, parameters = {}) {
    return db.prepare(sql).run(parameters);
}

function queryOne(sql, parameters = {}) {
    return db.prepare(sql).get(parameters);
}

function queryMany(sql, parameters = {}) {
    return db.prepare(sql).all(parameters);
}

function transaction(callback) {
    return db.transaction(callback)();
}

module.exports = {
    execute,
    queryOne,
    queryMany,
    transaction,
};