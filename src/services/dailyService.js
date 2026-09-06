const economyService = require("./economyService");

const BASE_REWARD = 500;
const INCREASE_PER_CLAIM = 50;
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

function getReward(claimCount) {
    if (!Number.isSafeInteger(claimCount) || claimCount < 0) throw new Error("Invalid Daily claim count.");
    const reward = BASE_REWARD + claimCount * INCREASE_PER_CLAIM;
    if (!Number.isSafeInteger(reward)) throw new Error("Daily reward exceeds the maximum safe value.");
    return reward;
}

function claim(userId) {
    const account = economyService.getAccount(userId);
    const now = Date.now();
    const lastClaimAt = account.last_daily_claim ? new Date(account.last_daily_claim).getTime() : null;

    if (lastClaimAt !== null && !Number.isNaN(lastClaimAt) && now - lastClaimAt < COOLDOWN_MS) {
        return {
            claimed: false,
            reward: 0,
            claimCount: account.daily_claim_count,
            balance: account.balance,
            nextClaimAt: new Date(lastClaimAt + COOLDOWN_MS),
        };
    }

    const reward = getReward(account.daily_claim_count);
    const claimAt = new Date(now).toISOString();
    const result = economyService.claimDaily(userId, reward, claimAt);

    return {
        claimed: true,
        reward: result.reward,
        claimCount: result.claimCount,
        balance: result.balanceAfter,
        nextClaimAt: new Date(now + COOLDOWN_MS),
    };
}

module.exports = { BASE_REWARD, INCREASE_PER_CLAIM, COOLDOWN_MS, getReward, claim };
