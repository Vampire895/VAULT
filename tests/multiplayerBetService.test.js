const test = require("node:test");
const assert = require("node:assert/strict");

const multiplayerBetService =
    require("../src/services/multiplayerBetService");

const multiplayerEngine =
    require("../src/games/multiplayer/multiplayerEngine");

const sessionStore =
    require("../src/games/multiplayer/multiplayerSessionStore");

const userRepository =
    require("../src/database/userRepository");

const configurationService =
    require("../src/services/configurationService");

const repository =
    require("../src/database/repository");


/*
 * -----------------------------
 * Test Constants
 * -----------------------------
 */

const HOST_ID = "bet-test-host";
const PLAYER_ID = "bet-test-player";
const OUTSIDER_ID = "bet-test-outsider";

const STARTING_BALANCE = 100000;

/*
 * configurationService default minimumBet
 * is 5000, so use a valid normal wager.
 */
const BET_AMOUNT = 10000;


/*
 * -----------------------------
 * Helpers
 * -----------------------------
 */

function createUser(
    userId,
    balance = STARTING_BALANCE
) {
    return userRepository.create(
        userId,
        balance
    );
}


function createLobby() {
    return multiplayerEngine.createSession({
        gameName: "test-multiplayer",
        hostId: HOST_ID,
        minPlayers: 2,
        maxPlayers: 6,
    });
}


function prepareBettingLobby() {
    const lobby = createLobby();

    /*
     * Host creates the lobby.
     * Second player joins.
     * Host starts the game.
     * Engine transitions STARTING -> BETTING.
     */
    multiplayerEngine.join(
        lobby.id,
        PLAYER_ID
    );

    multiplayerEngine.start(
        lobby.id,
        HOST_ID
    );

    multiplayerEngine.beginBetting(
        lobby.id
    );

    return lobby;
}


function cleanup() {
    /*
     * Clear all temporary multiplayer sessions.
     */
    sessionStore.clearAllSessions();

    /*
     * Users are persistent SQLite data,
     * so remove only the accounts created
     * by this test suite.
     */
    repository.execute(
        `
        DELETE FROM users
        WHERE user_id IN (
            @hostId,
            @playerId,
            @outsiderId
        )
        `,
        {
            hostId: HOST_ID,
            playerId: PLAYER_ID,
            outsiderId: OUTSIDER_ID,
        }
    );
}


/*
 * -----------------------------
 * Test Setup
 * -----------------------------
 */

test.before(() => {
    /*
     * Make sure DEFAULT_CONFIG is loaded
     * into configurationService.savedConfig.
     *
     * This prevents:
     * Configuration "minimumBet" does not exist.
     */
    configurationService.initialize();
});


test.beforeEach(() => {
    cleanup();

    createUser(HOST_ID);
    createUser(PLAYER_ID);
});


/*
 * -----------------------------
 * Tests
 * -----------------------------
 */

test(
    "placeBet records a player's bet",
    () => {
        const lobby =
            prepareBettingLobby();

        const result =
            multiplayerBetService.placeBet(
                lobby.id,
                HOST_ID,
                BET_AMOUNT
            );

        assert.equal(
            result.userId,
            HOST_ID
        );

        assert.equal(
            result.amount,
            BET_AMOUNT
        );

        assert.equal(
            multiplayerBetService.getBet(
                lobby.id,
                HOST_ID
            ),
            BET_AMOUNT
        );
    }
);


test(
    "placeBet deducts the wager from balance",
    () => {
        const lobby =
            prepareBettingLobby();

        const before =
            userRepository.findById(
                HOST_ID
            ).balance;

        multiplayerBetService.placeBet(
            lobby.id,
            HOST_ID,
            BET_AMOUNT
        );

        const after =
            userRepository.findById(
                HOST_ID
            ).balance;

        assert.equal(
            after,
            before - BET_AMOUNT
        );
    }
);


test(
    "getTotalBets calculates total wagered",
    () => {
        const lobby =
            prepareBettingLobby();

        multiplayerBetService.placeBet(
            lobby.id,
            HOST_ID,
            BET_AMOUNT
        );

        multiplayerBetService.placeBet(
            lobby.id,
            PLAYER_ID,
            BET_AMOUNT * 2
        );

        assert.equal(
            multiplayerBetService.getTotalBets(
                lobby.id
            ),
            BET_AMOUNT * 3
        );
    }
);


test(
    "hasPlacedBet detects an existing wager",
    () => {
        const lobby =
            prepareBettingLobby();

        assert.equal(
            multiplayerBetService.hasPlacedBet(
                lobby.id,
                HOST_ID
            ),
            false
        );

        multiplayerBetService.placeBet(
            lobby.id,
            HOST_ID,
            BET_AMOUNT
        );

        assert.equal(
            multiplayerBetService.hasPlacedBet(
                lobby.id,
                HOST_ID
            ),
            true
        );
    }
);


test(
    "duplicate bet is rejected",
    () => {
        const lobby =
            prepareBettingLobby();

        multiplayerBetService.placeBet(
            lobby.id,
            HOST_ID,
            BET_AMOUNT
        );

        assert.throws(
            () =>
                multiplayerBetService.placeBet(
                    lobby.id,
                    HOST_ID,
                    BET_AMOUNT
                ),
            /already placed/
        );
    }
);


test(
    "duplicate bet does not deduct balance twice",
    () => {
        const lobby =
            prepareBettingLobby();

        const before =
            userRepository.findById(
                HOST_ID
            ).balance;

        multiplayerBetService.placeBet(
            lobby.id,
            HOST_ID,
            BET_AMOUNT
        );

        assert.throws(
            () =>
                multiplayerBetService.placeBet(
                    lobby.id,
                    HOST_ID,
                    BET_AMOUNT
                ),
            /already placed/
        );

        const after =
            userRepository.findById(
                HOST_ID
            ).balance;

        assert.equal(
            after,
            before - BET_AMOUNT
        );
    }
);


test(
    "insufficient balance is rejected",
    () => {
        /*
         * Replace the host with a low-balance account.
         */
        repository.execute(
            `
            DELETE FROM users
            WHERE user_id = @userId
            `,
            {
                userId: HOST_ID,
            }
        );

        createUser(
            HOST_ID,
            500
        );

        const lobby =
            prepareBettingLobby();

        assert.throws(
            () =>
                multiplayerBetService.placeBet(
                    lobby.id,
                    HOST_ID,
                    BET_AMOUNT
                ),
            /Insufficient balance/
        );
    }
);


test(
    "insufficient balance does not create a bet",
    () => {
        repository.execute(
            `
            DELETE FROM users
            WHERE user_id = @userId
            `,
            {
                userId: HOST_ID,
            }
        );

        createUser(
            HOST_ID,
            500
        );

        const lobby =
            prepareBettingLobby();

        assert.throws(
            () =>
                multiplayerBetService.placeBet(
                    lobby.id,
                    HOST_ID,
                    BET_AMOUNT
                ),
            /Insufficient balance/
        );

        assert.equal(
            multiplayerBetService.getBet(
                lobby.id,
                HOST_ID
            ),
            null
        );
    }
);


test(
    "below minimum bet is rejected",
    () => {
        const lobby =
            prepareBettingLobby();

        const minimumBet =
            configurationService.getMinimumBet();

        if (minimumBet > 1) {
            assert.throws(
                () =>
                    multiplayerBetService.placeBet(
                        lobby.id,
                        HOST_ID,
                        minimumBet - 1
                    ),
                /minimum bet/i
            );
        }
    }
);


test(
    "non-player cannot place a bet",
    () => {
        createUser(
            OUTSIDER_ID
        );

        const lobby =
            prepareBettingLobby();

        assert.throws(
            () =>
                multiplayerBetService.placeBet(
                    lobby.id,
                    OUTSIDER_ID,
                    BET_AMOUNT
                ),
            /not a player/
        );
    }
);


test(
    "bet cannot be placed outside betting state",
    () => {
        const lobby =
            createLobby();

        /*
         * Lobby is still WAITING.
         * Do NOT start it.
         */
        multiplayerEngine.join(
            lobby.id,
            PLAYER_ID
        );

        assert.throws(
            () =>
                multiplayerBetService.placeBet(
                    lobby.id,
                    HOST_ID,
                    BET_AMOUNT
                ),
            /Betting is not currently active/
        );
    }
);


test(
    "allPlayersHaveBets returns false until everyone bets",
    () => {
        const lobby =
            prepareBettingLobby();

        multiplayerBetService.placeBet(
            lobby.id,
            HOST_ID,
            BET_AMOUNT
        );

        assert.equal(
            multiplayerBetService.allPlayersHaveBets(
                lobby.id
            ),
            false
        );

        multiplayerBetService.placeBet(
            lobby.id,
            PLAYER_ID,
            BET_AMOUNT
        );

        assert.equal(
            multiplayerBetService.allPlayersHaveBets(
                lobby.id
            ),
            true
        );
    }
);


test(
    "clearBets removes all recorded wagers",
    () => {
        const lobby =
            prepareBettingLobby();

        multiplayerBetService.placeBet(
            lobby.id,
            HOST_ID,
            BET_AMOUNT
        );

        multiplayerBetService.placeBet(
            lobby.id,
            PLAYER_ID,
            BET_AMOUNT
        );

        assert.equal(
            multiplayerBetService.getTotalBets(
                lobby.id
            ),
            BET_AMOUNT * 2
        );

        multiplayerBetService.clearBets(
            lobby.id
        );

        assert.equal(
            multiplayerBetService.getTotalBets(
                lobby.id
            ),
            0
        );
    }
);


test(
    "invalid bet amount is rejected",
    () => {
        const lobby =
            prepareBettingLobby();

        assert.throws(
            () =>
                multiplayerBetService.placeBet(
                    lobby.id,
                    HOST_ID,
                    0
                ),
            /Invalid multiplayer bet/
        );

        assert.throws(
            () =>
                multiplayerBetService.placeBet(
                    lobby.id,
                    HOST_ID,
                    -100
                ),
            /Invalid multiplayer bet/
        );
    }
);


/*
 * -----------------------------
 * Cleanup
 * -----------------------------
 */

test.after(() => {
    cleanup();

    console.log(
        "\n🎉 MULTIPLAYER BET SERVICE TEST PASSED!"
    );
});