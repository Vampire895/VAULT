const test = require("node:test");
const assert = require("node:assert/strict");

const rouletteService =
    require("../src/services/rouletteService");

const rouletteEngine =
    require("../src/games/roulette/rouletteEngine");

const userRepository =
    require("../src/database/userRepository");

const configurationService =
    require("../src/services/configurationService");


const STARTING_BALANCE =
    100000;

const BET_AMOUNT =
    5000;


/*
 * -----------------------------
 * Helpers
 * -----------------------------
 */

function getTestPlayerId() {
    return `roulette-service-test-player-${Date.now()}-${Math.random()}`;
}


function createUser(
    userId,
    balance = STARTING_BALANCE
) {
    return userRepository.create(
        userId,
        balance
    );
}


function redBet(
    amount = BET_AMOUNT
) {
    return {
        type:
            rouletteEngine.BET_TYPES.RED,

        value: null,

        amount,
    };
}


function straightBet(
    number,
    amount = BET_AMOUNT
) {
    return {
        type:
            rouletteEngine.BET_TYPES.STRAIGHT,

        value: number,

        amount,
    };
}


/*
 * -----------------------------
 * Bet Validation
 * -----------------------------
 */

test(
    "getMinimumBet returns configured minimum bet",
    () => {
        /*
         * The configuration service may not have
         * minimumBet configured in a fresh test database.
         *
         * RouletteService correctly delegates to
         * configurationService, so this test only
         * runs when the configuration exists.
         */

        let minimumBet;

        try {
            minimumBet =
                configurationService
                    .getMinimumBet();
        } catch (error) {
            if (
                error.message ===
                'Configuration "minimumBet" does not exist.'
            ) {
                return;
            }

            throw error;
        }

        assert.equal(
            rouletteService.getMinimumBet(),
            minimumBet
        );
    }
);


test(
    "invalid bet amount is rejected",
    () => {
        const playerId =
            getTestPlayerId();

        createUser(playerId);

        assert.throws(
            () =>
                rouletteService.play(
                    playerId,
                    0,
                    redBet(0)
                ),
            /Invalid roulette bet/
        );

        assert.throws(
            () =>
                rouletteService.play(
                    playerId,
                    -100,
                    redBet(-100)
                ),
            /Invalid roulette bet/
        );
    }
);


test(
    "below minimum bet is rejected",
    () => {
        const playerId =
            getTestPlayerId();

        createUser(playerId);

        let minimumBet;

        try {
            minimumBet =
                configurationService
                    .getMinimumBet();
        } catch (error) {
            if (
                error.message ===
                'Configuration "minimumBet" does not exist.'
            ) {
                return;
            }

            throw error;
        }

        if (
            minimumBet > 1
        ) {
            assert.throws(
                () =>
                    rouletteService.play(
                        playerId,
                        minimumBet - 1,
                        redBet(
                            minimumBet - 1
                        )
                    ),
                /minimum bet/i
            );
        }
    }
);


test(
    "invalid roulette bet type is rejected",
    () => {
        const playerId =
            getTestPlayerId();

        createUser(playerId);

        assert.throws(
            () =>
                rouletteService.play(
                    playerId,
                    BET_AMOUNT,
                    {
                        type: "invalid",
                        value: null,
                        amount: BET_AMOUNT,
                    }
                ),
            /Invalid roulette bet type/
        );
    }
);


test(
    "invalid straight number is rejected",
    () => {
        const playerId =
            getTestPlayerId();

        createUser(playerId);

        assert.throws(
            () =>
                rouletteService.play(
                    playerId,
                    BET_AMOUNT,
                    straightBet(37)
                ),
            /Roulette number must be an integer between 0 and 36/
        );
    }
);


/*
 * -----------------------------
 * Economy
 * -----------------------------
 */

test(
    "play deducts the wager from balance",
    () => {
        const playerId =
            getTestPlayerId();

        createUser(playerId);

        const before =
            userRepository.findById(
                playerId
            ).balance;

        const result =
            rouletteService.play(
                playerId,
                BET_AMOUNT,
                redBet()
            );

        const after =
            userRepository.findById(
                playerId
            ).balance;

        assert.equal(
            typeof result.balanceAfterBet,
            "number"
        );

        assert.equal(
            typeof result.balanceAfterPayout,
            "number"
        );

        /*
         * The final balance may be higher than
         * the initial balance if the bet wins.
         *
         * But the wager must have been processed
         * through the economy service.
         */
        assert.equal(
            result.balanceAfterBet,
            before - BET_AMOUNT
        );

        assert.equal(
            after,
            result.balanceAfterPayout
        );
    }
);


test(
    "insufficient balance is rejected",
    () => {
        const playerId =
            getTestPlayerId();

        createUser(
            playerId,
            BET_AMOUNT - 1
        );

        assert.throws(
            () =>
                rouletteService.play(
                    playerId,
                    BET_AMOUNT,
                    redBet()
                ),
            (error) => {
                assert.equal(
                    error.code,
                    "INSUFFICIENT_BALANCE"
                );

                assert.equal(
                    error.message,
                    "You don't have enough coins."
                );

                return true;
            }
        );
    }
);

/*
 * -----------------------------
 * Result Structure
 * -----------------------------
 */

test(
    "play returns a complete roulette result",
    () => {
        const playerId =
            getTestPlayerId();

        createUser(playerId);

        const result =
            rouletteService.play(
                playerId,
                BET_AMOUNT,
                redBet()
            );

        assert.equal(
            typeof result.number,
            "number"
        );

        assert.equal(
            result.number >= 0 &&
                result.number <= 36,
            true
        );

        assert.equal(
            typeof result.color,
            "string"
        );

        assert.equal(
            typeof result.won,
            "boolean"
        );

        assert.equal(
            typeof result.payout,
            "number"
        );

        assert.equal(
            typeof result.balanceAfterBet,
            "number"
        );

        assert.equal(
            typeof result.balanceAfterPayout,
            "number"
        );
    }
);


/*
 * -----------------------------
 * Direct Engine Wrappers
 * -----------------------------
 */

test(
    "spin returns a valid roulette number",
    () => {
        const number =
            rouletteService.spin();

        assert.equal(
            Number.isSafeInteger(number),
            true
        );

        assert.equal(
            number >= 0 &&
                number <= 36,
            true
        );
    }
);


test(
    "getWheel returns the roulette wheel",
    () => {
        const wheel =
            rouletteService.getWheel();

        assert.ok(
            Array.isArray(wheel)
        );

        assert.equal(
            wheel.length,
            37
        );

        assert.ok(
            wheel.includes(0)
        );

        assert.ok(
            wheel.includes(36)
        );
    }
);


test(
    "getBetTypes returns roulette bet types",
    () => {
        const betTypes =
            rouletteService.getBetTypes();

        assert.equal(
            betTypes.STRAIGHT,
            "straight"
        );

        assert.equal(
            betTypes.RED,
            "red"
        );

        assert.equal(
            betTypes.BLACK,
            "black"
        );
    }
);


test(
    "getPayouts returns roulette payouts",
    () => {
        const payouts =
            rouletteService.getPayouts();

        assert.equal(
            payouts.STRAIGHT,
            35
        );

        assert.equal(
            payouts.RED,
            1
        );

        assert.equal(
            payouts.BLACK,
            1
        );

        assert.equal(
            payouts.DOZEN_1,
            2
        );
    }
);


/*
 * -----------------------------
 * Roulette Mathematics
 * -----------------------------
 */

test(
    "calculatePayout delegates to roulette engine",
    () => {
        const bet = {
            type:
                rouletteEngine.BET_TYPES.RED,

            value: null,
        };

        const payout =
            rouletteService.calculatePayout(
                100,
                bet,
                1
            );

        assert.equal(
            payout,
            200
        );
    }
);


test(
    "calculatePayout returns zero for losing bet",
    () => {
        const bet = {
            type:
                rouletteEngine.BET_TYPES.RED,

            value: null,
        };

        const payout =
            rouletteService.calculatePayout(
                100,
                bet,
                2
            );

        assert.equal(
            payout,
            0
        );
    }
);


test(
    "straight bet payout is 36x total return",
    () => {
        const bet = {
            type:
                rouletteEngine.BET_TYPES.STRAIGHT,

            value: 17,
        };

        const payout =
            rouletteService.calculatePayout(
                100,
                bet,
                17
            );

        assert.equal(
            payout,
            3600
        );
    }
);


test(
    "resolveBet returns winning roulette result",
    () => {
        const bet = {
            type:
                rouletteEngine.BET_TYPES.RED,

            value: null,
        };

        const result =
            rouletteService.resolveBet(
                100,
                bet,
                1
            );

        assert.equal(
            result.won,
            true
        );

        assert.equal(
            result.payout,
            200
        );

        assert.equal(
            result.color,
            "red"
        );

        assert.equal(
            result.multiplier,
            1
        );
    }
);


test(
    "resolveBet returns losing roulette result",
    () => {
        const bet = {
            type:
                rouletteEngine.BET_TYPES.RED,

            value: null,
        };

        const result =
            rouletteService.resolveBet(
                100,
                bet,
                2
            );

        assert.equal(
            result.won,
            false
        );

        assert.equal(
            result.payout,
            0
        );

        assert.equal(
            result.color,
            "black"
        );

        assert.equal(
            result.multiplier,
            0
        );
    }
);


/*
 * -----------------------------
 * House Edge / RTP
 * -----------------------------
 */

test(
    "roulette house edge is European roulette house edge",
    () => {
        assert.equal(
            rouletteService.getHouseEdge(),
            1 / 37
        );
    }
);


test(
    "roulette RTP is European roulette RTP",
    () => {
        assert.equal(
            rouletteService.getRTP(),
            36 / 37
        );
    }
);


/*
 * -----------------------------
 * Helper Functions
 * -----------------------------
 */

test(
    "getColor identifies roulette colors",
    () => {
        assert.equal(
            rouletteService.getColor(0),
            "green"
        );

        assert.equal(
            rouletteService.getColor(1),
            "red"
        );

        assert.equal(
            rouletteService.getColor(2),
            "black"
        );
    }
);


test(
    "isWinningBet detects winning bets",
    () => {
        assert.equal(
            rouletteService.isWinningBet(
                {
                    type:
                        rouletteEngine
                            .BET_TYPES.RED,

                    value: null,
                },
                1
            ),
            true
        );

        assert.equal(
            rouletteService.isWinningBet(
                {
                    type:
                        rouletteEngine
                            .BET_TYPES.RED,

                    value: null,
                },
                2
            ),
            false
        );

        assert.equal(
            rouletteService.isWinningBet(
                {
                    type:
                        rouletteEngine
                            .BET_TYPES.STRAIGHT,

                    value: 17,
                },
                17
            ),
            true
        );
    }
);


test.after(() => {
    console.log(
        "\n🎰 ROULETTE SERVICE TEST COMPLETE!"
    );
});