const CLASSIC_SLOT = {
    id: "classic",
    name: "Classic",

    minimumBet: "global",
    maximumBet: 250000,

    reels: 3,

    symbols: [
        {
            id: "cherry",
            display: "🍒",
        },
        {
            id: "lemon",
            display: "🍋",
        },
        {
            id: "bell",
            display: "🔔",
        },
        {
            id: "diamond",
            display: "💎",
        },
        {
            id: "seven",
            display: "7️⃣",
        },
        {
            id: "crown",
            display: "👑",
        },
    ],

    outcomes: [
        {
            id: "partial",
            tier: "partial",
            probability: 0.25,
            multiplier: 0.25,

            combinations: [
                ["cherry", "cherry", "lemon"],
                ["lemon", "lemon", "cherry"],
                ["bell", "bell", "lemon"],
                ["diamond", "diamond", "bell"],
            ],
        },

        {
            id: "normal",
            tier: "normal",
            probability: 0.20375,
            multiplier: 2,

            combinations: [
                ["cherry", "cherry", "cherry"],
                ["lemon", "lemon", "lemon"],
                ["bell", "bell", "bell"],
            ],
        },

        {
            id: "rare",
            tier: "rare",
            probability: 0.07,
            multiplier: 3,

            combinations: [
                ["diamond", "diamond", "diamond"],
                ["seven", "seven", "seven"],
            ],
        },

        {
            id: "very_rare",
            tier: "very_rare",
            probability: 0.025,
            multiplier: 7,

            combinations: [
                ["crown", "crown", "crown"],
            ],
        },

        {
            id: "extreme",
            tier: "extreme",
            probability: 0.004,
            multiplier: 15,

            combinations: [
                ["seven", "seven", "crown"],
                ["crown", "seven", "seven"],
            ],
        },

        {
            id: "top",
            tier: "top",
            probability: 0.001,
            multiplier: 25,

            combinations: [
                ["crown", "crown", "seven"],
                ["seven", "crown", "crown"],
            ],
        },

        {
            id: "loss",
            tier: "loss",
            probability: 0.44625,
            multiplier: 0,

            combinations: [
                ["cherry", "lemon", "bell"],
                ["lemon", "bell", "diamond"],
                ["bell", "diamond", "seven"],
                ["diamond", "seven", "cherry"],
                ["seven", "cherry", "lemon"],
                ["cherry", "bell", "diamond"],
            ],
        },
    ],

    jackpot: {
        enabled: true,
        contributionRate: 0.01,
        triggerProbability: 1 / 100000,
        seed: 10000,
    },
};

const SLOT_MACHINES = {
    classic: CLASSIC_SLOT,
};

function getSlotMachine(machineId) {
    return SLOT_MACHINES[machineId];
}

function getAllSlotMachines() {
    return Object.values(SLOT_MACHINES);
}

module.exports = {
    CLASSIC_SLOT,
    SLOT_MACHINES,
    getSlotMachine,
    getAllSlotMachines,
};