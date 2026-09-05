const assert = require("node:assert/strict");
const test = require("node:test");

const roulette = require("../src/games/roulette/rouletteEngine");


/*
 * -----------------------------
 * Helpers
 * -----------------------------
 */

function expectThrow(fn, message) {
    assert.throws(fn, {
        message,
    });
}


/*
 * -----------------------------
 * Wheel
 * -----------------------------
 */

test("European roulette wheel contains 37 numbers", () => {
    const wheel = roulette.getWheel();

    assert.equal(wheel.length, 37);
});

test("European roulette wheel contains 0 through 36", () => {
    const wheel = roulette.getWheel();

    for (let number = 0; number <= 36; number++) {
        assert.ok(wheel.includes(number));
    }
});

test("European roulette wheel contains no duplicates", () => {
    const wheel = roulette.getWheel();

    assert.equal(
        new Set(wheel).size,
        wheel.length
    );
});


/*
 * -----------------------------
 * Colors
 * -----------------------------
 */

test("0 is green", () => {
    assert.equal(
        roulette.getColor(0),
        "green"
    );
});

test("known red numbers are red", () => {
    assert.equal(
        roulette.getColor(1),
        "red"
    );

    assert.equal(
        roulette.getColor(19),
        "red"
    );

    assert.equal(
        roulette.getColor(36),
        "red"
    );
});

test("known black numbers are black", () => {
    assert.equal(
        roulette.getColor(2),
        "black"
    );

    assert.equal(
        roulette.getColor(20),
        "black"
    );

    assert.equal(
        roulette.getColor(35),
        "black"
    );
});


/*
 * -----------------------------
 * Even / Odd
 * -----------------------------
 */

test("0 is neither odd nor even", () => {
    assert.equal(
        roulette.isOdd(0),
        false
    );

    assert.equal(
        roulette.isEven(0),
        false
    );
});

test("odd numbers are detected correctly", () => {
    assert.equal(
        roulette.isOdd(1),
        true
    );

    assert.equal(
        roulette.isOdd(17),
        true
    );
});

test("even numbers are detected correctly", () => {
    assert.equal(
        roulette.isEven(2),
        true
    );

    assert.equal(
        roulette.isEven(18),
        true
    );
});


/*
 * -----------------------------
 * Low / High
 * -----------------------------
 */

test("1 through 18 are low", () => {
    assert.equal(
        roulette.isLow(1),
        true
    );

    assert.equal(
        roulette.isLow(18),
        true
    );

    assert.equal(
        roulette.isLow(19),
        false
    );
});

test("19 through 36 are high", () => {
    assert.equal(
        roulette.isHigh(19),
        true
    );

    assert.equal(
        roulette.isHigh(36),
        true
    );

    assert.equal(
        roulette.isHigh(18),
        false
    );
});

test("0 is neither low nor high", () => {
    assert.equal(
        roulette.isLow(0),
        false
    );

    assert.equal(
        roulette.isHigh(0),
        false
    );
});


/*
 * -----------------------------
 * Dozens
 * -----------------------------
 */

test("first dozen is 1 through 12", () => {
    assert.equal(
        roulette.isDozen(1, 1),
        true
    );

    assert.equal(
        roulette.isDozen(12, 1),
        true
    );

    assert.equal(
        roulette.isDozen(13, 1),
        false
    );
});

test("second dozen is 13 through 24", () => {
    assert.equal(
        roulette.isDozen(13, 2),
        true
    );

    assert.equal(
        roulette.isDozen(24, 2),
        true
    );

    assert.equal(
        roulette.isDozen(25, 2),
        false
    );
});

test("third dozen is 25 through 36", () => {
    assert.equal(
        roulette.isDozen(25, 3),
        true
    );

    assert.equal(
        roulette.isDozen(36, 3),
        true
    );

    assert.equal(
        roulette.isDozen(24, 3),
        false
    );
});

test("0 belongs to no dozen", () => {
    assert.equal(
        roulette.isDozen(0, 1),
        false
    );

    assert.equal(
        roulette.isDozen(0, 2),
        false
    );

    assert.equal(
        roulette.isDozen(0, 3),
        false
    );
});


/*
 * -----------------------------
 * Columns
 * -----------------------------
 */

test("column 1 is detected correctly", () => {
    assert.equal(
        roulette.isColumn(1, 1),
        true
    );

    assert.equal(
        roulette.isColumn(4, 1),
        true
    );

    assert.equal(
        roulette.isColumn(2, 1),
        false
    );
});

test("column 2 is detected correctly", () => {
    assert.equal(
        roulette.isColumn(2, 2),
        true
    );

    assert.equal(
        roulette.isColumn(5, 2),
        true
    );

    assert.equal(
        roulette.isColumn(1, 2),
        false
    );
});

test("column 3 is detected correctly", () => {
    assert.equal(
        roulette.isColumn(3, 3),
        true
    );

    assert.equal(
        roulette.isColumn(6, 3),
        true
    );

    assert.equal(
        roulette.isColumn(2, 3),
        false
    );
});

test("0 belongs to no column", () => {
    assert.equal(
        roulette.isColumn(0, 1),
        false
    );

    assert.equal(
        roulette.isColumn(0, 2),
        false
    );

    assert.equal(
        roulette.isColumn(0, 3),
        false
    );
});


/*
 * -----------------------------
 * Winning Bets
 * -----------------------------
 */

test("straight number bet wins when number matches", () => {
    assert.equal(
        roulette.isWinningBet(
            {
                type: roulette.BET_TYPES.STRAIGHT,
                value: 17,
            },
            17
        ),
        true
    );
});

test("straight number bet loses when number does not match", () => {
    assert.equal(
        roulette.isWinningBet(
            {
                type: roulette.BET_TYPES.STRAIGHT,
                value: 17,
            },
            18
        ),
        false
    );
});

test("red bet wins on red", () => {
    assert.equal(
        roulette.isWinningBet(
            {
                type: roulette.BET_TYPES.RED,
            },
            19
        ),
        true
    );
});

test("red bet loses on black", () => {
    assert.equal(
        roulette.isWinningBet(
            {
                type: roulette.BET_TYPES.RED,
            },
            20
        ),
        false
    );
});

test("black bet wins on black", () => {
    assert.equal(
        roulette.isWinningBet(
            {
                type: roulette.BET_TYPES.BLACK,
            },
            20
        ),
        true
    );
});

test("black bet loses on red", () => {
    assert.equal(
        roulette.isWinningBet(
            {
                type: roulette.BET_TYPES.BLACK,
            },
            19
        ),
        false
    );
});

test("0 loses red and black bets", () => {
    assert.equal(
        roulette.isWinningBet(
            {
                type: roulette.BET_TYPES.RED,
            },
            0
        ),
        false
    );

    assert.equal(
        roulette.isWinningBet(
            {
                type: roulette.BET_TYPES.BLACK,
            },
            0
        ),
        false
    );
});

test("0 loses odd and even bets", () => {
    assert.equal(
        roulette.isWinningBet(
            {
                type: roulette.BET_TYPES.ODD,
            },
            0
        ),
        false
    );

    assert.equal(
        roulette.isWinningBet(
            {
                type: roulette.BET_TYPES.EVEN,
            },
            0
        ),
        false
    );
});

test("0 loses low and high bets", () => {
    assert.equal(
        roulette.isWinningBet(
            {
                type: roulette.BET_TYPES.LOW,
            },
            0
        ),
        false
    );

    assert.equal(
        roulette.isWinningBet(
            {
                type: roulette.BET_TYPES.HIGH,
            },
            0
        ),
        false
    );
});


/*
 * -----------------------------
 * Payouts
 * -----------------------------
 */

test("straight number pays 35:1 plus original wager", () => {
    const payout =
        roulette.calculatePayout(
            100,
            {
                type: roulette.BET_TYPES.STRAIGHT,
                value: 17,
            },
            17
        );

    assert.equal(
        payout,
        3600
    );
});

test("red pays 1:1 plus original wager", () => {
    const payout =
        roulette.calculatePayout(
            100,
            {
                type: roulette.BET_TYPES.RED,
            },
            19
        );

    assert.equal(
        payout,
        200
    );
});

test("black pays 1:1 plus original wager", () => {
    const payout =
        roulette.calculatePayout(
            100,
            {
                type: roulette.BET_TYPES.BLACK,
            },
            20
        );

    assert.equal(
        payout,
        200
    );
});

test("dozen pays 2:1 plus original wager", () => {
    const payout =
        roulette.calculatePayout(
            100,
            {
                type: roulette.BET_TYPES.DOZEN_1,
            },
            12
        );

    assert.equal(
        payout,
        300
    );
});

test("column pays 2:1 plus original wager", () => {
    const payout =
        roulette.calculatePayout(
            100,
            {
                type: roulette.BET_TYPES.COLUMN_1,
            },
            4
        );

    assert.equal(
        payout,
        300
    );
});

test("losing bet pays zero", () => {
    const payout =
        roulette.calculatePayout(
            100,
            {
                type: roulette.BET_TYPES.RED,
            },
            20
        );

    assert.equal(
        payout,
        0
    );
});


/*
 * -----------------------------
 * Play / Resolution
 * -----------------------------
 */

test("spin returns a valid European roulette number", () => {
    for (let i = 0; i < 100; i++) {
        const result = roulette.spin();

        assert.ok(
            Number.isSafeInteger(result)
        );

        assert.ok(
            result >= 0 &&
            result <= 36
        );
    }
});

test("play returns a complete roulette result", () => {
    const result =
        roulette.play(
            100,
            {
                type: roulette.BET_TYPES.RED,
            }
        );

    assert.ok(
        Number.isSafeInteger(
            result.number
        )
    );

    assert.ok(
        ["red", "black", "green"].includes(
            result.color
        )
    );

    assert.equal(
        result.bet.amount,
        100
    );

    assert.equal(
        typeof result.won,
        "boolean"
    );

    assert.ok(
        Number.isSafeInteger(
            result.payout
        )
    );
});

test("resolveBet correctly resolves a winning bet", () => {
    const result =
        roulette.resolveBet(
            100,
            {
                type: roulette.BET_TYPES.RED,
            },
            19
        );

    assert.equal(
        result.number,
        19
    );

    assert.equal(
        result.color,
        "red"
    );

    assert.equal(
        result.won,
        true
    );

    assert.equal(
        result.multiplier,
        1
    );

    assert.equal(
        result.payout,
        200
    );
});

test("resolveBet correctly resolves a losing bet", () => {
    const result =
        roulette.resolveBet(
            100,
            {
                type: roulette.BET_TYPES.RED,
            },
            20
        );

    assert.equal(
        result.won,
        false
    );

    assert.equal(
        result.multiplier,
        0
    );

    assert.equal(
        result.payout,
        0
    );
});


/*
 * -----------------------------
 * Mathematics
 * -----------------------------
 */

test("European roulette house edge is approximately 2.70%", () => {
    const houseEdge =
        roulette.getHouseEdge();

    assert.ok(
        Math.abs(
            houseEdge -
            (1 / 37)
        ) < 0.000001
    );
});

test("European roulette RTP is approximately 97.30%", () => {
    const rtp =
        roulette.getRTP();

    assert.ok(
        Math.abs(
            rtp -
            (36 / 37)
        ) < 0.000001
    );
});


/*
 * -----------------------------
 * Validation
 * -----------------------------
 */

test("invalid roulette number is rejected", () => {
    expectThrow(
        () => roulette.getColor(37),
        "Roulette number must be an integer between 0 and 36."
    );
});

test("negative roulette number is rejected", () => {
    expectThrow(
        () => roulette.getColor(-1),
        "Roulette number must be an integer between 0 and 36."
    );
});

test("invalid bet type is rejected", () => {
    expectThrow(
        () =>
            roulette.isWinningBet(
                {
                    type: "invalid",
                },
                10
            ),
        "Invalid roulette bet type."
    );
});

test("invalid bet amount is rejected", () => {
    expectThrow(
        () =>
            roulette.calculatePayout(
                0,
                {
                    type: roulette.BET_TYPES.RED,
                },
                10
            ),
        "Roulette bet amount must be a positive safe integer."
    );
});

test("invalid dozen is rejected", () => {
    expectThrow(
        () =>
            roulette.isDozen(
                10,
                4
            ),
        "Dozen must be 1, 2, or 3."
    );
});

test("invalid column is rejected", () => {
    expectThrow(
        () =>
            roulette.isColumn(
                10,
                4
            ),
        "Column must be 1, 2, or 3."
    );
});


/*
 * -----------------------------
 * Final
 * -----------------------------
 */

console.log(
    "\n🎉 ROULETTE ENGINE TEST SUITE LOADED!\n"
);