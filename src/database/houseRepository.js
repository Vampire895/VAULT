const repository =
    require("./repository");


/*
 * --------------------------------
 * Get House State
 * --------------------------------
 */

function getState() {

    const state =
        repository.queryOne(`
            SELECT
                house_purse AS housePurse,
                tax_last_run AS taxLastRun
            FROM house_state
            WHERE id = 1
        `);


    if (!state) {

        throw new Error(
            "House state has not been initialized."
        );
    }


    return state;
}


/*
 * --------------------------------
 * House Purse
 * --------------------------------
 */

function getHousePurse() {

    return getState().housePurse;
}


/*
 * --------------------------------
 * Add To House Purse
 * --------------------------------
 */

function addToHousePurse(amount) {

    if (
        typeof amount !== "number" ||
        !Number.isSafeInteger(amount) ||
        amount <= 0
    ) {

        throw new Error(
            "House purse amount must be a positive safe integer."
        );
    }


    repository.execute(`
        UPDATE house_state

        SET house_purse =
            house_purse + @amount

        WHERE id = 1
    `, {
        amount,
    });


    return getHousePurse();
}


/*
 * --------------------------------
 * Add To House Purse
 * In Existing Transaction
 * --------------------------------
 *
 * IMPORTANT:
 *
 * This function does NOT create
 * another transaction.
 *
 * It is intended to be called by
 * services that already have an
 * active SQLite transaction.
 *
 * Example:
 *
 * jackpot settlement
 *      ↓
 * transaction(...)
 *      ↓
 * addToHousePurseInTransaction()
 */

function addToHousePurseInTransaction(
    amount
) {

    if (
        typeof amount !== "number" ||
        !Number.isSafeInteger(amount) ||
        amount <= 0
    ) {

        throw new Error(
            "House purse amount must be a positive safe integer."
        );
    }


    repository.execute(`
        UPDATE house_state

        SET house_purse =
            house_purse + @amount

        WHERE id = 1
    `, {
        amount,
    });


    return getHousePurse();
}


/*
 * --------------------------------
 * Set House Purse
 * --------------------------------
 */

function setHousePurse(amount) {

    if (
        typeof amount !== "number" ||
        !Number.isSafeInteger(amount) ||
        amount < 0
    ) {

        throw new Error(
            "House purse amount must be a non-negative safe integer."
        );
    }


    repository.execute(`
        UPDATE house_state

        SET house_purse = @amount

        WHERE id = 1
    `, {
        amount,
    });


    return getHousePurse();
}


/*
 * --------------------------------
 * Tax Tracking
 * --------------------------------
 */

function getTaxLastRun() {

    return getState().taxLastRun;
}


function setTaxLastRun(period) {

    if (period !== null) {

        if (
            typeof period !== "string" ||
            period.trim().length === 0
        ) {

            throw new Error(
                "Tax period must be null or a non-empty string."
            );
        }


        period =
            period.trim();
    }


    repository.execute(`
        UPDATE house_state

        SET tax_last_run = @period

        WHERE id = 1
    `, {
        period,
    });


    return getTaxLastRun();
}


/*
 * --------------------------------
 * Exports
 * --------------------------------
 */

module.exports = {

    getState,

    getHousePurse,

    addToHousePurse,

    addToHousePurseInTransaction,

    setHousePurse,

    getTaxLastRun,

    setTaxLastRun,

};