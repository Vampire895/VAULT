const rng = require("../../services/rngService");

const BOARD_SIZE = 9;
const DEFAULT_MINES = 3;
const MIN_MINES = 1;
const MAX_MINES = 8;

/*
 * --------------------------------
 * Validation
 * --------------------------------
 */

function validateMineCount(mines) {
    if (
        !Number.isSafeInteger(mines) ||
        mines < MIN_MINES ||
        mines > MAX_MINES
    ) {
        throw new Error(
            `Number of mines must be between ${MIN_MINES} and ${MAX_MINES}.`
        );
    }
}


/*
 * --------------------------------
 * Mine Generation
 * --------------------------------
 *
 * Board positions are represented
 * by numbers 0-8.
 *
 * 3 × 3 board:
 *
 * 0 1 2
 * 3 4 5
 * 6 7 8
 */

function generateMinePositions(mines) {
    validateMineCount(mines);

    const positions = [];

    for (let i = 0; i < BOARD_SIZE; i++) {
        positions.push(i);
    }

    const shuffled =
        rng.shuffle(positions);

    return new Set(
        shuffled.slice(0, mines)
    );
}


/*
 * --------------------------------
 * Game Creation
 * --------------------------------
 */

function createGame(mines = DEFAULT_MINES) {
    validateMineCount(mines);

    const minePositions =
        generateMinePositions(mines);

    return {
        boardSize: BOARD_SIZE,
        mines,
        minePositions,
        revealedPositions: new Set(),
        safeReveals: 0,
        state: "active",
    };
}


/*
 * --------------------------------
 * Tile Resolution
 * --------------------------------
 */

function isMine(
    game,
    position
) {
    if (!game || typeof game !== "object") {
        throw new Error(
            "Invalid Mines game."
        );
    }

    if (
        !Number.isSafeInteger(position) ||
        position < 0 ||
        position >= BOARD_SIZE
    ) {
        throw new Error(
            "Invalid Mines tile."
        );
    }

    return game.minePositions.has(
        position
    );
}


/*
 * --------------------------------
 * Tile Reveal
 * --------------------------------
 */

function revealTile(
    game,
    position
) {
    if (!game || typeof game !== "object") {
        throw new Error(
            "Invalid Mines game."
        );
    }

    if (game.state !== "active") {
        throw new Error(
            "This Mines game is no longer active."
        );
    }

    if (
        !Number.isSafeInteger(position) ||
        position < 0 ||
        position >= BOARD_SIZE
    ) {
        throw new Error(
            "Invalid Mines tile."
        );
    }

    if (
        game.revealedPositions.has(
            position
        )
    ) {
        throw new Error(
            "That tile has already been revealed."
        );
    }

    const mine =
        isMine(
            game,
            position
        );

    game.revealedPositions.add(
        position
    );

    if (mine) {
        game.state = "lost";

        return {
            mine: true,
            position,
            safeReveals:
                game.safeReveals,
            state: game.state,
        };
    }

    game.safeReveals++;

    const totalSafeTiles =
        BOARD_SIZE - game.mines;

    /*
     * If every safe tile has been
     * revealed, the game is complete.
     */
    if (
        game.safeReveals >=
        totalSafeTiles
    ) {
        game.state = "won";
    }

    return {
        mine: false,
        position,
        safeReveals:
            game.safeReveals,
        state: game.state,
    };
}


/*
 * --------------------------------
 * Board Helpers
 * --------------------------------
 */

function getRevealedPositions(game) {
    return new Set(
        game.revealedPositions
    );
}


function getMinePositions(game) {
    return new Set(
        game.minePositions
    );
}


function getRemainingSafeTiles(game) {
    const totalSafeTiles =
        BOARD_SIZE - game.mines;

    return Math.max(
        0,
        totalSafeTiles -
            game.safeReveals
    );
}


function isComplete(game) {
    return (
        game.state !== "active"
    );
}


module.exports = {
    BOARD_SIZE,
    DEFAULT_MINES,
    MIN_MINES,
    MAX_MINES,

    validateMineCount,

    generateMinePositions,
    createGame,

    isMine,
    revealTile,

    getRevealedPositions,
    getMinePositions,
    getRemainingSafeTiles,

    isComplete,
};