const multiplayerService =
    require("../src/services/multiplayerService");

const multiplayerSettlementService =
    require("../src/services/multiplayerSettlementService");

const multiplayerBetService =
    require("../src/services/multiplayerBetService");

const economyService =
    require("../src/services/economyService");

const configurationService =
    require("../src/services/configurationService");

const sessionStore =
    require("../src/games/multiplayer/multiplayerSessionStore");


const HOST =
    "settlement_host";

const PLAYER =
    "settlement_player";


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


configurationService.initialize();


function cleanup() {
    const hostSession =
        sessionStore.getSessionForUser(
            HOST
        );

    if (hostSession) {
        sessionStore.deleteSession(
            hostSession.id
        );
    }

    const playerSession =
        sessionStore.getSessionForUser(
            PLAYER
        );

    if (playerSession) {
        sessionStore.deleteSession(
            playerSession.id
        );
    }
}


try {
    cleanup();


    /*
     * -----------------------------
     * Accounts
     * -----------------------------
     */

    economyService.createAccount(
        HOST
    );

    economyService.createAccount(
        PLAYER
    );

    economyService.deposit(
        HOST,
        10000
    );

    economyService.deposit(
        PLAYER,
        10000
    );


    /*
     * -----------------------------
     * Lobby
     * -----------------------------
     */

    const lobby =
        multiplayerService.createLobby({
            gameType:
                "test_settlement",

            hostId:
                HOST,

            playerLimit:
                6,
        });


    multiplayerService.joinLobby(
        lobby.id,
        PLAYER
    );


    multiplayerService.startLobby(
        lobby.id,
        HOST
    );


    multiplayerService.beginBetting(
        lobby.id
    );


    /*
     * -----------------------------
     * Bets
     * -----------------------------
     */

    multiplayerBetService.placeBet(
        lobby.id,
        HOST,
        1000
    );

    multiplayerBetService.placeBet(
        lobby.id,
        PLAYER,
        1000
    );


    assert(
        multiplayerBetService.getTotalBets(
            lobby.id
        ) === 2000,
        "Test bets are recorded"
    );


    /*
     * -----------------------------
     * Lock + resolve
     * -----------------------------
     */

    multiplayerService.lockRound(
        lobby.id
    );

    multiplayerService.beginResolving(
        lobby.id
    );


    /*
     * -----------------------------
     * Balances before settlement
     * -----------------------------
     */

    const hostBefore =
        economyService.getBalance(
            HOST
        );

    const playerBefore =
        economyService.getBalance(
            PLAYER
        );


    /*
     * -----------------------------
     * Settlement
     * -----------------------------
     *
     * Host wins 1500.
     * Player receives 0.
     */

    const settlement =
        multiplayerSettlementService.settle(
            lobby.id,
            {
                [HOST]: 1500,
                [PLAYER]: 0,
            }
        );


    assert(
        settlement.totalPayout ===
            1500,
        "Total payout is calculated correctly"
    );


    assert(
        settlement.payouts[HOST] ===
            1500,
        "Host payout is recorded"
    );


    assert(
        settlement.payouts[PLAYER] ===
            0,
        "Player zero payout is recorded"
    );


    /*
     * -----------------------------
     * Balance verification
     * -----------------------------
     */

    assert(
        economyService.getBalance(
            HOST
        ) ===
            hostBefore + 1500,
        "Host receives settlement payout"
    );


    assert(
        economyService.getBalance(
            PLAYER
        ) ===
            playerBefore,
        "Player balance remains unchanged with zero payout"
    );


    /*
     * -----------------------------
     * Settlement status
     * -----------------------------
     */

    assert(
        multiplayerSettlementService.hasBeenSettled(
            lobby
        ),
        "Session is marked as settled"
    );


    const savedSettlement =
        multiplayerSettlementService.getSettlement(
            lobby.id
        );


    assert(
        savedSettlement !== null,
        "Settlement record can be retrieved"
    );


    assert(
        savedSettlement.totalPayout ===
            1500,
        "Saved settlement contains total payout"
    );


    /*
     * -----------------------------
     * Duplicate settlement
     * -----------------------------
     */

    let duplicateFailed =
        false;

    try {
        multiplayerSettlementService.settle(
            lobby.id,
            {
                [HOST]: 500,
            }
        );
    } catch {
        duplicateFailed = true;
    }


    assert(
        duplicateFailed,
        "Duplicate settlement is rejected"
    );


    assert(
        economyService.getBalance(
            HOST
        ) ===
            hostBefore + 1500,
        "Duplicate settlement does not change balance"
    );


    /*
     * -----------------------------
     * Invalid payout recipient
     * -----------------------------
     */

    let invalidRecipientFailed =
        false;

    try {
        multiplayerSettlementService.settle(
            lobby.id,
            {
                unknown_user: 1000,
            }
        );
    } catch {
        invalidRecipientFailed = true;
    }


    assert(
        invalidRecipientFailed,
        "Unknown payout recipient is rejected"
    );


    /*
     * -----------------------------
     * Cleanup
     * -----------------------------
     */

    sessionStore.deleteSession(
        lobby.id
    );


    console.log(
        "\n🎉 MULTIPLAYER SETTLEMENT SERVICE TEST PASSED!"
    );

} finally {
    cleanup();
}