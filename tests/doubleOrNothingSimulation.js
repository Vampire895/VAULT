const engine = require("../src/games/doubleOrNothing/doubleOrNothingEngine");

const ROUNDS = 1_000_000;
const BET = 500;

let wins = 0;
let losses = 0;
let totalWagered = 0;
let totalPayout = 0;

for (let i = 0; i < ROUNDS; i++) {
    const result = engine.play();

    totalWagered += BET;

    if (result.won) {
        wins++;
        totalPayout += BET * 2;
    } else {
        losses++;
    }
}

const rtp =
    totalPayout / totalWagered;

const houseEdge =
    1 - rtp;

console.log("\n🎲 FORTUNE • DOUBLE OR NOTHING");
console.log("================================");

console.log(
    `Rounds:           ${ROUNDS.toLocaleString()}`
);

console.log(
    `Bet per round:    ${BET.toLocaleString()}`
);

console.log(
    `Total wagered:    ${totalWagered.toLocaleString()}`
);

console.log(
    `Total payout:     ${totalPayout.toLocaleString()}`
);

console.log("\n📊 RESULTS");
console.log("--------------------------------");

console.log(
    `Wins:             ${wins.toLocaleString()}`
);

console.log(
    `Losses:           ${losses.toLocaleString()}`
);

console.log(
    `Win rate:         ${((wins / ROUNDS) * 100).toFixed(4)}%`
);

console.log(
    `Loss rate:        ${((losses / ROUNDS) * 100).toFixed(4)}%`
);

console.log("\n💰 ECONOMICS");
console.log("--------------------------------");

console.log(
    `RTP:              ${(rtp * 100).toFixed(4)}%`
);

console.log(
    `House Edge:       ${(houseEdge * 100).toFixed(4)}%`
);

console.log("\n🎯 TARGET");
console.log("--------------------------------");

console.log("Target RTP:       93.0000%");
console.log("Target Edge:      7.0000%");

console.log("\n");