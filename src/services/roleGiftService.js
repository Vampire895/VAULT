const configurationService = require("./configurationService");
const economyService = require("./economyService");

function getAddedRoleIds(oldMember, newMember) {
    const addedRoleIds = [];

    for (const [roleId] of newMember.roles.cache) {
        if (roleId === newMember.guild.id) {
            continue;
        }

        if (!oldMember.roles.cache.has(roleId)) {
            addedRoleIds.push(roleId);
        }
    }

    return addedRoleIds;
}

function getGiftForRole(roleId) {
    const roleGifts =
        configurationService.getRoleGifts();

    return roleGifts.find(
        (gift) => gift.roleId === roleId
    );
}

function rewardNewRoles(oldMember, newMember) {
    if (
        !configurationService.isRoleGiftsEnabled()
    ) {
        return [];
    }

    const addedRoleIds =
        getAddedRoleIds(oldMember, newMember);

    const rewards = [];

    for (const roleId of addedRoleIds) {
        const gift = getGiftForRole(roleId);

        if (!gift) {
            continue;
        }

        const newBalance = economyService.deposit(
            newMember.id,
            gift.amount
        );

        rewards.push({
            roleId,
            amount: gift.amount,
            newBalance,
        });
    }

    return rewards;
}

module.exports = {
    getAddedRoleIds,
    getGiftForRole,
    rewardNewRoles,
};