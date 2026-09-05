const minesEngine =
    require("../games/mines/minesEngine");

const sessionStore =
    require("../games/mines/minesSessionStore");

const economyService =
    require("./economyService");

const calculationService =
    require("./calculationService");

const {
    AppError,
    ERROR_CODES,
} = require("../errors");


const DEFAULT_HOUSE_EDGE = 0.06;


/*
 * --------------------------------
 * Validation
 * --------------------------------
 */

function validateUserId(userId) {
    if (
        typeof userId !== "string" ||
        userId.trim() === ""
    ) {
        throw new AppError(
            ERROR_CODES.INVALID_INPUT,
            "User ID is required."
        );
    }
}


function validateBet(bet) {
    if (
        !Number.isSafeInteger(bet) ||
        bet <= 0
    ) {
        throw new AppError(
            ERROR_CODES.INVALID_BET,
            "Invalid Mines bet."
        );
    }
}


/*
 * --------------------------------
 * Session Access
 * --------------------------------
 */

function getActiveSession(userId) {
    const session =
        sessionStore.getSession(
            userId
        );

    if (!session) {
        throw new AppError(
            ERROR_CODES.GAME_NOT_ACTIVE,
            "No active Mines game found."
        );
    }

    return session;
}


/*
 * --------------------------------
 * Board Snapshot
 * --------------------------------
 *
 * The session contains Sets because
 * Mines uses temporary in-memory state.
 *
 * Before deleting a session, we copy
 * the board information into the result
 * so the command/UI can still render the
 * final board.
 */

function createBoardSnapshot(session, game) {
    return {
        boardSize:
            session.boardSize,

        mines:
            session.mines,

        minePositions:
            new Set(
                game?.minePositions ||
                session.minePositions
            ),

        revealedPositions:
            new Set(
                game?.revealedPositions ||
                session.revealedPositions
            ),

        safeReveals:
            game?.safeReveals ??
            session.safeReveals,
    };
}


/*
 * --------------------------------
 * Start Game
 * --------------------------------
 */

function start(
    userId,
    bet,
    mines =
        minesEngine.DEFAULT_MINES
) {
    validateUserId(userId);
    validateBet(bet);

    minesEngine.validateMineCount(
        mines
    );

    /*
     * One active Mines game per user.
     */

    if (
        sessionStore.hasSession(
            userId
        )
    ) {
        throw new AppError(
            ERROR_CODES.GAME_ALREADY_ACTIVE,
            "You already have an active Mines game."
        );
    }


    /*
     * Deduct the bet BEFORE creating
     * the active game.
     */

    economyService.withdraw(
        userId,
        bet
    );


    try {

        const game =
            minesEngine.createGame(
                mines
            );


        sessionStore.createSession(
            userId,
            {
                bet,

                mines:
                    game.mines,

                boardSize:
                    game.boardSize,

                minePositions:
                    game.minePositions,

                revealedPositions:
                    game.revealedPositions,

                safeReveals:
                    game.safeReveals,

                state:
                    game.state,

                multiplier: 1,
            }
        );


        return getGame(
            userId
        );

    } catch (error) {

        /*
         * If RAM session creation fails
         * after the bet was deducted,
         * refund the original bet.
         */

        try {

            economyService.deposit(
                userId,
                bet
            );

        } catch (refundError) {

            console.error(
                "❌ Mines start refund failed:",
                refundError
            );
        }

        throw error;
    }
}


/*
 * --------------------------------
 * Game State
 * --------------------------------
 */

function getGame(userId) {

    const session =
        getActiveSession(
            userId
        );


    return {
        userId:
            session.userId,

        bet:
            session.bet,

        mines:
            session.mines,

        boardSize:
            session.boardSize,

        /*
         * IMPORTANT:
         * Return minePositions too.
         *
         * The active game normally hides
         * them in the UI, but the command
         * needs the board data available.
         */

        minePositions:
            new Set(
                session.minePositions
            ),

        revealedPositions:
            new Set(
                session.revealedPositions
            ),

        safeReveals:
            session.safeReveals,

        multiplier:
            session.multiplier,

        state:
            session.state,
    };
}


/*
 * --------------------------------
 * Reveal Tile
 * --------------------------------
 */

function reveal(
    userId,
    position
) {

    const session =
        getActiveSession(
            userId
        );


    if (
        session.state !==
        "active"
    ) {
        throw new AppError(
            ERROR_CODES.GAME_NOT_ACTIVE,
            "This Mines game is no longer active."
        );
    }


    /*
     * Work with the temporary game state.
     */

    const game = {

        boardSize:
            session.boardSize,

        mines:
            session.mines,

        minePositions:
            session.minePositions,

        revealedPositions:
            session.revealedPositions,

        safeReveals:
            session.safeReveals,

        state:
            session.state,
    };


    const result =
        minesEngine.revealTile(
            game,
            position
        );


    /*
     * --------------------------------
     * Mine Hit
     * --------------------------------
     */

    if (result.mine) {

        /*
         * Capture the complete board BEFORE
         * deleting the session.
         */

        const board =
            createBoardSnapshot(
                session,
                game
            );


        /*
         * Losing means the original
         * bet is gone.
         */

        sessionStore.deleteSession(
            userId
        );


        /*
         * Return the complete final board.
         *
         * This is what mines.js needs to
         * reveal every mine.
         */

        return {
            ...result,

            bet:
                session.bet,

            mines:
                board.mines,

            boardSize:
                board.boardSize,

            minePositions:
                board.minePositions,

            revealedPositions:
                board.revealedPositions,

            safeReveals:
                board.safeReveals,

            multiplier:
                session.multiplier,

            payout: 0,

            state:
                "lost",
        };
    }


    /*
     * --------------------------------
     * Safe Tile
     * --------------------------------
     */

    const multiplier =
        calculationService
            .calculateMinesMultiplier(
                session.boardSize,
                session.mines,
                game.safeReveals,
                DEFAULT_HOUSE_EDGE
            );


    /*
     * --------------------------------
     * Automatic Win
     * --------------------------------
     *
     * Every safe tile has been revealed.
     */

    if (
        game.state ===
        "won"
    ) {

        const payout =
            calculationService
                .calculateMinesPayout(
                    session.bet,
                    multiplier
                );


        /*
         * Capture the final board BEFORE
         * deleting the session.
         */

        const board =
            createBoardSnapshot(
                session,
                game
            );


        /*
         * Pay the player.
         */

        economyService.deposit(
            userId,
            payout
        );


        /*
         * Game is finished.
         */

        sessionStore.deleteSession(
            userId
        );


        return {
            ...result,

            bet:
                session.bet,

            mines:
                board.mines,

            boardSize:
                board.boardSize,

            minePositions:
                board.minePositions,

            revealedPositions:
                board.revealedPositions,

            safeReveals:
                board.safeReveals,

            multiplier,

            payout,

            state:
                "won",
        };
    }


    /*
     * --------------------------------
     * Game Continues
     * --------------------------------
     */

    const updated =
        sessionStore.updateSession(
            userId,
            {
                revealedPositions:
                    game.revealedPositions,

                safeReveals:
                    game.safeReveals,

                state:
                    game.state,

                multiplier,
            }
        );


    return {
        ...result,

        bet:
            session.bet,

        mines:
            session.mines,

        boardSize:
            session.boardSize,

        minePositions:
            new Set(
                session.minePositions
            ),

        revealedPositions:
            new Set(
                updated.revealedPositions
            ),

        safeReveals:
            updated.safeReveals,

        multiplier,

        payout:
            calculationService
                .calculateMinesPayout(
                    session.bet,
                    multiplier
                ),

        state:
            updated.state,
    };
}


/*
 * --------------------------------
 * Cash Out
 * --------------------------------
 */

function cashOut(userId) {

    const session =
        getActiveSession(
            userId
        );


    if (
        session.state !==
        "active"
    ) {
        throw new AppError(
            ERROR_CODES.GAME_NOT_ACTIVE,
            "You cannot cash out this Mines game."
        );
    }


    /*
     * Player must reveal at least
     * one safe tile before cashing out.
     */

    if (
        session.safeReveals <= 0
    ) {
        throw new AppError(
            ERROR_CODES.INVALID_GAME_ACTION,
            "Reveal at least one safe tile before cashing out."
        );
    }


    const payout =
        calculationService
            .calculateMinesPayout(
                session.bet,
                session.multiplier
            );


    /*
     * Capture board information before
     * deleting the temporary session.
     */

    const board =
        createBoardSnapshot(
            session
        );


    /*
     * Pay the player.
     */

    economyService.deposit(
        userId,
        payout
    );


    /*
     * Remove completed game.
     */

    sessionStore.deleteSession(
        userId
    );


    return {
        cashedOut: true,

        bet:
            session.bet,

        mines:
            board.mines,

        boardSize:
            board.boardSize,

        minePositions:
            board.minePositions,

        revealedPositions:
            board.revealedPositions,

        safeReveals:
            session.safeReveals,

        multiplier:
            session.multiplier,

        payout,

        state:
            "cashed_out",
    };
}


/*
 * --------------------------------
 * Exports
 * --------------------------------
 */

module.exports = {
    start,
    getGame,
    reveal,
    cashOut,
};