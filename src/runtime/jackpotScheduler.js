const jackpotService =
    require("../services/jackpotService");


let schedulerTimer = null;


/*
 * --------------------------------
 * Configuration
 * --------------------------------
 *
 * Set this to the server's configured
 * IANA timezone.
 *
 * Example:
 *
 * Asia/Kolkata
 * America/New_York
 * Europe/London
 */

const TIME_ZONE =
    process.env.JACKPOT_TIMEZONE ||
    "Asia/Kolkata";


/*
 * --------------------------------
 * Get Next Midnight
 * --------------------------------
 */

function getMillisecondsUntilMidnight() {

    const now =
        new Date();


    const formatter =
        new Intl.DateTimeFormat(
            "en-US",
            {
                timeZone:
                    TIME_ZONE,

                year:
                    "numeric",

                month:
                    "2-digit",

                day:
                    "2-digit",

                hour:
                    "2-digit",

                minute:
                    "2-digit",

                second:
                    "2-digit",

                hourCycle:
                    "h23",
            }
        );


    const parts =
        Object.fromEntries(
            formatter
                .formatToParts(now)
                .filter(
                    part =>
                        part.type !==
                        "literal"
                )
                .map(
                    part => [
                        part.type,
                        part.value,
                    ]
                )
        );


    const currentSecond =
        Number(parts.second);


    const currentMinute =
        Number(parts.minute);


    const currentHour =
        Number(parts.hour);


    const secondsSinceMidnight =
        currentHour * 3600 +
        currentMinute * 60 +
        currentSecond;


    const millisecondsRemaining =
        (
            24 * 60 * 60 -
            secondsSinceMidnight
        ) * 1000;


    return Math.max(
        1000,
        millisecondsRemaining
    );
}


/*
 * --------------------------------
 * Run Settlement
 * --------------------------------
 */

async function runSettlement(
    client,
    gamblingChannelId
) {

    try {

        const result =
            jackpotService.settleJackpot();


        /*
         * Format announcement here
         * once the final settlement
         * formatter is wired.
         */

        if (
            gamblingChannelId
        ) {

            const channel =
                await client.channels.fetch(
                    gamblingChannelId
                );


            if (
                channel &&
                channel.isTextBased()
            ) {

                /*
                 * We will plug the final
                 * settlement formatter here.
                 */
                await channel.send(
                    "🎰 Daily Jackpot has been settled."
                );
            }
        }


        console.log(
            "🎰 Jackpot settlement completed:",
            result
        );

    } catch (error) {

        console.error(
            "❌ Jackpot settlement failed:",
            error
        );

        /*
         * IMPORTANT:
         *
         * Do not reset the Jackpot if
         * settlement failed.
         *
         * The next scheduler attempt
         * can retry safely.
         */
    }
}


/*
 * --------------------------------
 * Start
 * --------------------------------
 */

function start(
    client,
    gamblingChannelId
) {

    jackpotService.initialize();


    if (
        schedulerTimer
    ) {

        clearTimeout(
            schedulerTimer
        );
    }


    const delay =
        getMillisecondsUntilMidnight();


    console.log(
        `🎰 Jackpot scheduler started. Next draw in ${Math.round(delay / 1000)} seconds.`
    );


    schedulerTimer =
        setTimeout(
            async () => {

                await runSettlement(
                    client,
                    gamblingChannelId
                );


                /*
                 * Schedule next cycle.
                 */

                start(
                    client,
                    gamblingChannelId
                );

            },
            delay
        );
}


function stop() {

    if (
        schedulerTimer
    ) {

        clearTimeout(
            schedulerTimer
        );

        schedulerTimer =
            null;
    }
}


module.exports = {

    start,

    stop,

};