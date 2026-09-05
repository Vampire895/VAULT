const rngService =
    require("../src/services/rngService");

function assert(
    condition,
    message
) {
    if (!condition) {
        throw new Error(
            `❌ TEST FAILED: ${message}`
        );
    }

    console.log(
        `✅ ${message}`
    );
}


/*
 * randomFloat
 */

const float =
    rngService.randomFloat();

assert(
    typeof float === "number",
    "randomFloat returns a number"
);

assert(
    float >= 0 &&
        float < 1,
    "randomFloat stays between 0 and 1"
);


/*
 * randomInt
 */

for (let i = 0; i < 100; i++) {
    const value =
        rngService.randomInt(
            1,
            6
        );

    assert(
        value >= 1 &&
            value <= 6 &&
            Number.isSafeInteger(value),
        "randomInt returns values inside the requested range"
    );
}


/*
 * chance
 */

const chanceResult =
    rngService.chance(0.5);

assert(
    typeof chanceResult === "boolean",
    "chance returns a boolean"
);

assert(
    rngService.chance(1) === true,
    "chance(1) always succeeds"
);

assert(
    rngService.chance(0) === false,
    "chance(0) always fails"
);


/*
 * randomChoice
 */

const choices = [
    "rock",
    "paper",
    "scissors",
];

const choice =
    rngService.randomChoice(
        choices
    );

assert(
    choices.includes(choice),
    "randomChoice returns an item from the array"
);


/*
 * shuffle
 */

const original = [
    1,
    2,
    3,
    4,
    5,
];

const shuffled =
    rngService.shuffle(
        original
    );

assert(
    Array.isArray(shuffled),
    "shuffle returns an array"
);

assert(
    shuffled.length ===
        original.length,
    "shuffle preserves array length"
);

assert(
    shuffled.every(
        (value) =>
            original.includes(value)
    ),
    "shuffle preserves all original values"
);

assert(
    original.join(",") ===
        "1,2,3,4,5",
    "shuffle does not mutate the original array"
);


/*
 * Validation
 */

let failed = false;

try {
    rngService.randomInt(
        10,
        1
    );
} catch {
    failed = true;
}

assert(
    failed,
    "randomInt rejects invalid ranges"
);


failed = false;

try {
    rngService.randomChoice([]);
} catch {
    failed = true;
}

assert(
    failed,
    "randomChoice rejects empty arrays"
);


failed = false;

try {
    rngService.chance(2);
} catch {
    failed = true;
}

assert(
    failed,
    "chance rejects invalid probabilities"
);


console.log(
    "\n🎉 RNG SERVICE TEST PASSED!"
);