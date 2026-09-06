const configRepository = require("../database/configRepository");

const DEFAULT_CONFIG = {
    startingBalance: 1000,
    minimumBet: 1,
    defaultPrefix: "bet",
    roleGiftsEnabled: false,
    roleGifts: [],
};

let savedConfig = {};
let stagedConfig = {};
let dirty = false;

function serializeValue(key, value) {
    if (key === "roleGifts") return JSON.stringify(value);
    if (key === "roleGiftsEnabled") return value ? "1" : "0";
    return String(value);
}

function deserializeValue(key, value) {
    if (key === "defaultPrefix") return value;
    if (key === "roleGiftsEnabled") return value === "1" || value === "true";
    if (key === "roleGifts") {
        try {
            const parsed = JSON.parse(value);
            if (!Array.isArray(parsed)) throw new Error();
            return parsed;
        } catch {
            throw new Error("Saved Role Gifts configuration is invalid.");
        }
    }
    return Number(value);
}

function initialize() {
    for (const [key, value] of Object.entries(DEFAULT_CONFIG)) {
        const existing = configRepository.get(key);
        if (!existing) configRepository.set(key, serializeValue(key, value));
    }
    load();
}

function load() {
    const loadedConfig = {};
    for (const key of Object.keys(DEFAULT_CONFIG)) {
        const entry = configRepository.get(key);
        loadedConfig[key] = entry ? deserializeValue(key, entry.value) : DEFAULT_CONFIG[key];
    }
    savedConfig = { ...loadedConfig };
    stagedConfig = { ...loadedConfig };
    dirty = false;
}

function get(key) {
    if (!(key in savedConfig)) throw new Error(`Configuration "${key}" does not exist.`);
    return savedConfig[key];
}

function getStaged(key) {
    if (!(key in stagedConfig)) throw new Error(`Configuration "${key}" does not exist.`);
    return stagedConfig[key];
}

function setStaged(key, value) {
    if (!(key in DEFAULT_CONFIG)) throw new Error(`Configuration "${key}" does not exist.`);

    if (key === "defaultPrefix") {
        if (typeof value !== "string" || value.trim().length === 0) throw new Error(`Invalid value for configuration "${key}".`);
        stagedConfig[key] = value.trim();
        dirty = true;
        return;
    }

    if (key === "roleGifts") {
        if (!Array.isArray(value)) throw new Error(`Invalid value for configuration "${key}".`);
        for (const gift of value) {
            if (!gift || typeof gift.roleId !== "string" || gift.roleId.trim().length === 0 || !Number.isSafeInteger(gift.amount) || gift.amount <= 0) {
                throw new Error("Invalid Role Gift configuration.");
            }
        }
        stagedConfig[key] = value.map((gift) => ({ roleId: gift.roleId.trim(), amount: gift.amount }));
        dirty = true;
        return;
    }

    if (!Number.isSafeInteger(value) || value < 0) throw new Error(`Invalid value for configuration "${key}".`);
    stagedConfig[key] = value;
    dirty = true;
}

function isRoleGiftsEnabled() { return get("roleGiftsEnabled"); }
function isStagedRoleGiftsEnabled() { return getStaged("roleGiftsEnabled"); }

function setRoleGiftsEnabled(enabled) {
    if (typeof enabled !== "boolean") throw new Error("Role Gifts enabled state must be a boolean.");
    stagedConfig.roleGiftsEnabled = enabled;
    if (!enabled) stagedConfig.roleGifts = [];
    dirty = true;
}

function isDirty() { return dirty; }

function save() {
    if (!dirty) return;
    for (const [key, value] of Object.entries(stagedConfig)) configRepository.set(key, serializeValue(key, value));
    savedConfig = { ...stagedConfig, roleGifts: stagedConfig.roleGifts.map((gift) => ({ ...gift })) };
    stagedConfig = { ...savedConfig, roleGifts: savedConfig.roleGifts.map((gift) => ({ ...gift })) };
    dirty = false;
}

function discard() {
    savedConfig = { ...savedConfig, roleGifts: savedConfig.roleGifts.map((gift) => ({ ...gift })) };
    stagedConfig = { ...savedConfig, roleGifts: savedConfig.roleGifts.map((gift) => ({ ...gift })) };
    dirty = false;
}

function getStartingBalance() { return get("startingBalance"); }
function getMinimumBet() { return get("minimumBet"); }
function getDefaultPrefix() { return get("defaultPrefix"); }
function getRoleGifts() { return get("roleGifts"); }
function getStagedRoleGifts() { return getStaged("roleGifts"); }

module.exports = {
    initialize,
    load,
    get,
    getStaged,
    setStaged,
    isDirty,
    save,
    discard,
    getStartingBalance,
    getMinimumBet,
    getDefaultPrefix,
    getRoleGifts,
    getStagedRoleGifts,
    isRoleGiftsEnabled,
    isStagedRoleGiftsEnabled,
    setRoleGiftsEnabled,
};
