const {
    queryOne,
    queryMany,
} = require("../database/repository");


/*
 * --------------------------------
 * Leaderboard Service
 * --------------------------------
 *
 * The leaderboard is NOT stored
 * separately.
 *
 * Source of truth:
 *
 * users.user_id
 * users.balance
 *
 * Rank is calculated dynamically
 * from current balances.
 *
 * House Purse is never included
 * because it exists outside the
 * users table.
 */


/*
 * --------------------------------
 * Constants
 * --------------------------------
 */

const DEFAULT_PAGE_SIZE = 10;


/*
 * --------------------------------
 * Get Leaderboard Page
 * --------------------------------
 *
 * Returns users ordered by their
 * current balance.
 *
 * Rank is calculated from the
 * database position.
 */

function getPage(
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE
) {

    if (
        !Number.isInteger(page) ||
        page < 1
    ) {
        page = 1;
    }


    if (
        !Number.isInteger(pageSize) ||
        pageSize < 1
    ) {
        pageSize = DEFAULT_PAGE_SIZE;
    }


    /*
     * Protect against unnecessarily
     * large queries.
     */

    pageSize =
        Math.min(
            pageSize,
            50
        );


    const offset =
        (page - 1) *
        pageSize;


    const totalResult =
        queryOne(`
            SELECT COUNT(*) AS total
            FROM users
        `);


    const total =
        Number(
            totalResult?.total || 0
        );


    const totalPages =
        Math.max(
            1,
            Math.ceil(
                total / pageSize
            )
        );


    /*
     * If someone requests a page
     * beyond the end, clamp it.
     */

    if (
        page > totalPages
    ) {
        page = totalPages;
    }


    const finalOffset =
        (page - 1) *
        pageSize;


    const rows =
        queryMany(`
            SELECT
                user_id,
                balance
            FROM users
            ORDER BY
                balance DESC,
                user_id ASC
            LIMIT @limit
            OFFSET @offset
        `, {
            limit:
                pageSize,

            offset:
                finalOffset,
        });


    const entries =
        rows.map(
            (user, index) => ({
                rank:
                    finalOffset +
                    index +
                    1,

                userId:
                    user.user_id,

                balance:
                    user.balance,
            })
        );


    return {
        entries,

        page,

        pageSize,

        total,

        totalPages,

        hasPrevious:
            page > 1,

        hasNext:
            page < totalPages,
    };
}


/*
 * --------------------------------
 * Get User Rank
 * --------------------------------
 *
 * Rank is calculated from the
 * user's current balance.
 *
 * No rank is stored.
 */

function getUserRank(
    userId
) {

    const user =
        queryOne(`
            SELECT
                user_id,
                balance
            FROM users
            WHERE user_id = @userId
        `, {
            userId,
        });


    if (!user) {
        return null;
    }


    /*
     * Count users who have a higher
     * balance.
     *
     * user_id is used as the
     * deterministic tie-breaker.
     */

    const result =
        queryOne(`
            SELECT COUNT(*) AS rank
            FROM users AS u
            WHERE
                u.balance > @balance

                OR (
                    u.balance = @balance
                    AND u.user_id < @userId
                )
        `, {
            balance:
                user.balance,

            userId,
        });


    return {
        userId:
            user.user_id,

        balance:
            user.balance,

        rank:
            Number(
                result?.rank || 0
            ) + 1,
    };
}


/*
 * --------------------------------
 * Get User's Leaderboard Page
 * --------------------------------
 *
 * Useful later for:
 *
 * /rank
 *
 * and for opening the
 * leaderboard directly around
 * a user's own position.
 */

function getUserPage(
    userId,
    pageSize = DEFAULT_PAGE_SIZE
) {

    const rankData =
        getUserRank(
            userId
        );


    if (!rankData) {
        return null;
    }


    const page =
        Math.ceil(
            rankData.rank /
            pageSize
        );


    const leaderboard =
        getPage(
            page,
            pageSize
        );


    return {
        ...leaderboard,

        userRank:
            rankData,
    };
}


module.exports = {
    DEFAULT_PAGE_SIZE,

    getPage,

    getUserRank,

    getUserPage,
};