const db = require("./database");
const { initializeSchema } = require("./schema");
const configRepository = require("./configRepository");
const configurationService = require("../services/configurationService");
const houseRepository = require("./houseRepository");

function initializeDatabase() {
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");

    initializeSchema();
    houseRepository.getState();
    configRepository.initialize();
    configurationService.initialize();

    console.log("🗄️ Database initialized.");
}

module.exports = {
    initializeDatabase,
};