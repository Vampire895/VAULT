const economyService = require("./economyService");

const BASE_REWARD = 500;
const INCREASE_PER_CLAIM = 50;

function getToday() {
    return new Date().toISOString().slice(0, 10);
}

function getReward(claimCount) {
    if (!Number.isSafeInteger(claimCount) || claimCount < 0) throw new Error("Invalid Daily claim count.");
    const reward = BASE_REWARD + claimCount * INCREASE_PER_CLAIM;
    if (!Number.isSafeInteger(reward)) throw new Error("Daily reward exceeds the maximum safe value.");
    return reward;
}

function claim(userId) {
    const account = economyService.getAccount(userId);
    const claimDate = getToday();

    if (account.last_daily_claim === claimDate) {
        return { claimed: false, claimDate, claimCount: account.daily_claim_count, reward: 0, balance: account.balance };
    }

    const reward = getReward(account.daily_claim_count);
    const result = economyService.claimDaily(userId, reward, claimDate);

    return {
        claimed: true,
        claimDate,
        claimCount: result.claimCount,
        reward: result.reward,
        balance: result.balanceAfter,
    };
}

module.exports = { BASE_REWARD, INCREASE_PER_CLAIM, getToday, getReward, claim };
