const config = require("../config/config");

function isDeveloper(userId) {
    return (
        typeof userId === "string" &&
        userId === config.developer.userId
    );
}

function isDeveloperInteraction(interaction) {
    return isDeveloper(interaction.user?.id);
}

module.exports = {
    isDeveloper,
    isDeveloperInteraction,
};