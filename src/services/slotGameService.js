const slotEngine = require("../games/slots/slotEngine");
const slotCalculationService = require("./slotCalculationService");

function play(machineId, bet) {
    const result = slotEngine.spin(machineId);

    const payoutResult =
        slotCalculationService.calculatePayout(
            bet,
            result.outcome.multiplier
        );

    return {
        machineId: result.machineId,
        machineName: result.machineName,
        symbols: result.symbols,
        outcome: result.outcome,
        jackpot: result.jackpot,

        bet: payoutResult.bet,
        payout: payoutResult.payout,
    };
}

module.exports = {
    play,
};