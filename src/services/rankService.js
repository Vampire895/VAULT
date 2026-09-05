const userRepository =
    require("../database/userRepository");


/*
 * --------------------------------
 * Rank Tiers
 * --------------------------------
 *
 * Tier is NOT stored in SQLite.
 *
 * It is calculated dynamically
 * from the user's current Ether balance.
 */

const RANK_TIERS = [

    {
        name:
            "Common",

        minimumBalance:
            0,
    },

    {
        name:
            "Rare",

        minimumBalance:
            250001,
    },

    {
        name:
            "Unique",

        minimumBalance:
            500001,
    },

    {
        name:
            "Legend",

        minimumBalance:
            850001,
    },

    {
        name:
            "Mythic",

        minimumBalance:
            1500001,
    },

    {
        name:
            "God",

        minimumBalance:
            3000001,
    },

];


/*
 * --------------------------------
 * Get Tier
 * --------------------------------
 */

function getTier(
    balance
) {

    for (
        let index =
            RANK_TIERS.length - 1;

        index >= 0;

        index--
    ) {

        const tier =
            RANK_TIERS[index];


        if (
            balance >=
            tier.minimumBalance
        ) {

            return tier.name;

        }
    }


    return "Common";
}


/*
 * --------------------------------
 * Get User Rank
 * --------------------------------
 *
 * Higher Ether balance =
 * better rank.
 *
 * Competition ranking:
 *
 * #1
 * #2
 * #2
 * #4
 *
 * Users with exactly the same
 * balance receive the same rank.
 */

function getUserRank(
    userId
) {

    const user =
        userRepository.findById(
            userId
        );


    if (!user) {

        throw new Error(
            "Account not found."
        );

    }


    const higherBalanceUsers =
        userRepository
            .countUsersWithBalanceGreaterThan(
                user.balance
            );


    const rank =
        higherBalanceUsers + 1;


    const tier =
        getTier(
            user.balance
        );


    return {

        userId:
            user.user_id,

        balance:
            user.balance,

        rank,

        tier,

    };
}


module.exports = {

    RANK_TIERS,

    getTier,

    getUserRank,

};