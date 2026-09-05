const {
    MessageFlags,
} = require("discord.js");

const rouletteService =
    require("../services/rouletteService");

const multiplayerService =
    require("../services/multiplayerService");

const {
    GAME_STATES,
    MIN_PLAYERS,
    MAX_PLAYERS,
} = multiplayerService;

const {
    createRouletteBetTypeSelect,
    createRouletteNumberSelect,
    createRouletteBetAmountModal,
    createRouletteConfirmationButtons,
    createRouletteResultButtons,
    createRouletteLobbyButtons,
    createRouletteBettingButtons,
    createRouletteBackButton,
} = require("./rouletteComponents");

const {
    formatRouletteConfirmation,
    formatRouletteLobby,
    formatRouletteBetting,
    formatRouletteResult,
    formatRouletteError,
    formatNumberSelection,
    formatRouletteBetSubmitted,
} = require("./rouletteFormatter");


/*
 * -----------------------------
 * Helpers
 * -----------------------------
 */


/*
 * Every Roulette custom ID now has:
 *
 * roulette_action:sessionId
 *
 * Example:
 *
 * roulette_join:abc123
 */

function parseRouletteId(customId) {
    if (
        typeof customId !== "string"
    ) {
        return {
            action: null,
            sessionId: null,
        };
    }

    const separatorIndex =
        customId.indexOf(":");

    if (
        separatorIndex === -1
    ) {
        return {
            action: customId,
            sessionId: null,
        };
    }

    return {
        action:
            customId.slice(
                0,
                separatorIndex
            ),

        sessionId:
            customId.slice(
                separatorIndex + 1
            ),
    };
}


/*
 * Get the Roulette session ID
 * directly from the component ID.
 */

function getSessionId(interaction) {
    const parsed =
        parseRouletteId(
            interaction.customId
        );

    return parsed.sessionId;
}


/*
 * Retrieve the Roulette session.
 */

function getSession(interaction) {
    const sessionId =
        getSessionId(
            interaction
        );

    if (!sessionId) {
        throw new Error(
            "Roulette session could not be identified."
        );
    }

    const session =
        multiplayerService.getSession(
            sessionId
        );

    if (!session) {
        throw new Error(
            "Roulette session no longer exists."
        );
    }

    return session;
}


/*
 * Retrieve current player draft.
 */

function getPlayerBet(
    session,
    userId
) {
    return (
        session.gameData?.bets?.[userId] ??
        null
    );
}


/*
 * Store player draft.
 */

function setPlayerBet(
    sessionId,
    userId,
    bet
) {
    const session =
        multiplayerService.getSession(
            sessionId
        );

    if (!session) {
        throw new Error(
            "Roulette session no longer exists."
        );
    }

    const bets = {
        ...(session.gameData?.bets || {}),
    };

    bets[userId] = bet;

    return multiplayerService.updateGameData(
        sessionId,
        {
            bets,
        }
    );
}


/*
 * Remove player draft.
 */

function clearPlayerBet(
    sessionId,
    userId
) {
    const session =
        multiplayerService.getSession(
            sessionId
        );

    if (!session) {
        throw new Error(
            "Roulette session no longer exists."
        );
    }

    const bets = {
        ...(session.gameData?.bets || {}),
    };

    delete bets[userId];

    return multiplayerService.updateGameData(
        sessionId,
        {
            bets,
        }
    );
}


/*
 * Error reply helper.
 */

async function replyError(
    interaction,
    message
) {
    if (
        interaction.deferred ||
        interaction.replied
    ) {
        await interaction.editReply({
            embeds: [
                formatRouletteError(
                    message
                ),
            ],

            components: [],
        });

        return true;
    }

    await interaction.reply({
        embeds: [
            formatRouletteError(
                message
            ),
        ],

        flags:
            MessageFlags.Ephemeral,
    });

    return true;
}


/*
 * -----------------------------
 * Start Roulette
 * -----------------------------
 */

async function startRoulette(
    interaction
) {
    try {
        const session =
            rouletteService.createSession(
                interaction.user.id,
                {
                    playerLimit:
                        MAX_PLAYERS,
                }
            );

        await interaction.reply({
            embeds: [
                formatRouletteLobby({
                    session,

                    minimumBet:
                        rouletteService.getMinimumBet(),

                    houseEdge:
                        rouletteService.getHouseEdge(),

                    rtp:
                        rouletteService.getRTP(),
                }),
            ],

            components: [
                createRouletteLobbyButtons({
                    sessionId:
                        session.id,

                    isHost: true,
                }),
            ],
        });

        return true;
    } catch (error) {
        return replyError(
            interaction,
            error.message
        );
    }
}


/*
 * -----------------------------
 * Join Lobby
 * -----------------------------
 */

async function handleJoin(
    interaction,
    sessionId
) {
    try {
        const session =
            multiplayerService.getSession(
                sessionId
            );

        if (!session) {
            throw new Error(
                "Roulette session no longer exists."
            );
        }

        /*
         * Preserve the actual lobby host.
         *
         * The user clicking Join is NOT
         * necessarily the host.
         */
        const hostId =
            session.hostId;

        const updated =
            rouletteService.joinSession(
                session.id,
                interaction.user.id
            );

        await interaction.update({
            embeds: [
                formatRouletteLobby({
                    session: updated,

                    minimumBet:
                        rouletteService.getMinimumBet(),

                    houseEdge:
                        rouletteService.getHouseEdge(),

                    rtp:
                        rouletteService.getRTP(),
                }),
            ],

            components: [
                createRouletteLobbyButtons({
                    sessionId:
                        updated.id,

                    /*
                     * Start must remain visible
                     * because the actual host is
                     * still the lobby host.
                     */
                    isHost:
                        updated.hostId ===
                        hostId,
                }),
            ],
        });

        return true;
    } catch (error) {
        return replyError(
            interaction,
            error.message
        );
    }
}


/*
 * -----------------------------
 * Leave
 * -----------------------------
 */

async function handleLeave(
    interaction,
    sessionId
) {
    try {
        const session =
            multiplayerService.getSession(
                sessionId
            );

        if (!session) {
            throw new Error(
                "Roulette session no longer exists."
            );
        }

        const result =
            rouletteService.leaveSession(
                session.id,
                interaction.user.id
            );

        if (result.cancelled) {
            await interaction.update({
                embeds: [
                    formatRouletteError(
                        "The roulette lobby was cancelled because the host left."
                    ),
                ],

                components: [],
            });

            return true;
        }

        const updated =
            result.session;

        await interaction.update({
            embeds: [
                formatRouletteLobby({
                    session: updated,

                    minimumBet:
                        rouletteService.getMinimumBet(),

                    houseEdge:
                        rouletteService.getHouseEdge(),

                    rtp:
                        rouletteService.getRTP(),
                }),
            ],

            components: [
                createRouletteLobbyButtons({
                    sessionId:
                        updated.id,

                    isHost:
                        updated.hostId ===
                        interaction.user.id,
                }),
            ],
        });

        return true;
    } catch (error) {
        return replyError(
            interaction,
            error.message
        );
    }
}


/*
 * -----------------------------
 * Start Game
 * -----------------------------
 */

async function handleStart(
    interaction,
    sessionId
) {
    try {
        const session =
            multiplayerService.getSession(
                sessionId
            );

        if (!session) {
            throw new Error(
                "Roulette session no longer exists."
            );
        }

        const started =
            rouletteService.startSession(
                session.id,
                interaction.user.id
            );

        rouletteService.beginBetting(
            started.id
        );

        const updated =
            rouletteService.getSession(
                started.id
            );

        await interaction.update({
            embeds: [
                formatRouletteBetting({
                    session: updated,

                    minimumBet:
                        rouletteService.getMinimumBet(),

                    remainingTime:
                        rouletteService
                            .getRemainingRoundTime(
                                updated.id
                            ),
                }),
            ],

            components: [
                createRouletteBetTypeSelect(
                    rouletteService.getBetTypes(),
                    updated.id
                ),

                createRouletteBettingButtons({
                    sessionId:
                        updated.id,
                }),
            ],
        });

        return true;
    } catch (error) {
        return replyError(
            interaction,
            error.message
        );
    }
}


/*
 * -----------------------------
 * Bet Type
 * -----------------------------
 */

async function handleBetType(
    interaction,
    sessionId
) {
    try {
        const session =
            multiplayerService.getSession(
                sessionId
            );

        if (!session) {
            throw new Error(
                "Roulette session no longer exists."
            );
        }

        if (
            session.state !==
            GAME_STATES.BETTING
        ) {
            throw new Error(
                "Betting is no longer active."
            );
        }

        if (
            !session.players.includes(
                interaction.user.id
            )
        ) {
            throw new Error(
                "You are not part of this roulette game."
            );
        }

        const betType =
            interaction.values[0];

        const draft = {
            type: betType,
            value: null,
        };

        setPlayerBet(
            session.id,
            interaction.user.id,
            draft
        );

        if (
            betType === "straight"
        ) {
            await interaction.update({
                embeds: [
                    formatNumberSelection({
                        betType,
                    }),
                ],

                components: [
                    createRouletteNumberSelect(
                        session.id
                    ),

                    createRouletteBackButton(
                        session.id
                    ),
                ],
            });

            return true;
        }

        await interaction.showModal(
            createRouletteBetAmountModal(
                session.id
            )
        );

        return true;
    } catch (error) {
        return replyError(
            interaction,
            error.message
        );
    }
}


/*
 * -----------------------------
 * Number Selection
 * -----------------------------
 */

async function handleNumber(
    interaction,
    sessionId
) {
    try {
        const session =
            multiplayerService.getSession(
                sessionId
            );

        if (!session) {
            throw new Error(
                "Roulette session no longer exists."
            );
        }

        if (
            session.state !==
            GAME_STATES.BETTING
        ) {
            throw new Error(
                "Betting is no longer active."
            );
        }

        const currentBet =
            getPlayerBet(
                session,
                interaction.user.id
            );

        if (!currentBet) {
            throw new Error(
                "Please choose a roulette bet type first."
            );
        }

        const value =
            Number(
                interaction.values[0]
            );

        currentBet.value =
            value;

        setPlayerBet(
            session.id,
            interaction.user.id,
            currentBet
        );

        await interaction.showModal(
            createRouletteBetAmountModal(
                session.id
            )
        );

        return true;
    } catch (error) {
        return replyError(
            interaction,
            error.message
        );
    }
}


/*
 * -----------------------------
 * Bet Amount
 * -----------------------------
 */

async function handleBetAmount(
    interaction,
    sessionId
) {
    try {
        const session =
            multiplayerService.getSession(
                sessionId
            );

        if (!session) {
            throw new Error(
                "Roulette session no longer exists."
            );
        }

        if (
            session.state !==
            GAME_STATES.BETTING
        ) {
            throw new Error(
                "Betting is no longer active."
            );
        }

        const rawAmount =
            interaction.fields
                .getTextInputValue(
                    "amount"
                )
                .trim();

        const amount =
            Number(rawAmount);

        if (
            !Number.isSafeInteger(
                amount
            ) ||
            amount <= 0
        ) {
            throw new Error(
                "Please enter a valid whole-number wager."
            );
        }

        const minimumBet =
            rouletteService.getMinimumBet();

        if (
            amount < minimumBet
        ) {
            throw new Error(
                `The minimum roulette bet is ${minimumBet.toLocaleString()}.`
            );
        }

        const currentBet =
            getPlayerBet(
                session,
                interaction.user.id
            );

        if (!currentBet?.type) {
            throw new Error(
                "Your roulette bet type is missing."
            );
        }

        currentBet.amount =
            amount;

        setPlayerBet(
            session.id,
            interaction.user.id,
            currentBet
        );

        await interaction.reply({
            embeds: [
                formatRouletteConfirmation({
                    betType:
                        currentBet.type,

                    value:
                        currentBet.value,

                    amount:
                        currentBet.amount,
                }),
            ],

            components: [
                createRouletteConfirmationButtons({
                    sessionId:
                        session.id,
                }),
            ],

            flags:
                MessageFlags.Ephemeral,
        });

        return true;
    } catch (error) {
        return replyError(
            interaction,
            error.message
        );
    }
}


/*
 * -----------------------------
 * Confirm Bet
 * -----------------------------
 */

async function handleConfirmBet(
    interaction,
    sessionId
) {
    try {
        const session =
            multiplayerService.getSession(
                sessionId
            );

        if (!session) {
            throw new Error(
                "Roulette session no longer exists."
            );
        }

        if (
            session.state !==
            GAME_STATES.BETTING
        ) {
            throw new Error(
                "Betting is no longer active."
            );
        }

        if (
            !session.players.includes(
                interaction.user.id
            )
        ) {
            throw new Error(
                "You are not part of this roulette game."
            );
        }

        const bet =
            getPlayerBet(
                session,
                interaction.user.id
            );

        if (
            !bet ||
            !bet.type ||
            !bet.amount
        ) {
            throw new Error(
                "Your roulette bet is incomplete."
            );
        }

        if (bet.confirmed) {
            throw new Error(
                "You have already confirmed your roulette bet."
            );
        }

        setPlayerBet(
            session.id,
            interaction.user.id,
            {
                ...bet,
                confirmed: true,
            }
        );

        const updated =
            rouletteService.getSession(
                session.id
            );

        await interaction.update({
            embeds: [
                formatRouletteBetting({
                    session: updated,

                    minimumBet:
                        rouletteService.getMinimumBet(),

                    remainingTime:
                        rouletteService
                            .getRemainingRoundTime(
                                updated.id
                            ),
                }),
            ],

            components: [
                createRouletteBetTypeSelect(
                    rouletteService.getBetTypes(),
                    updated.id
                ),

                createRouletteBettingButtons({
                    sessionId:
                        updated.id,
                }),
            ],
        });

        return true;
    } catch (error) {
        return replyError(
            interaction,
            error.message
        );
    }
}


/*
 * -----------------------------
 * Change Bet
 * -----------------------------
 */

async function handleChangeBet(
    interaction,
    sessionId
) {
    try {
        const session =
            multiplayerService.getSession(
                sessionId
            );

        if (!session) {
            throw new Error(
                "Roulette session no longer exists."
            );
        }

        if (
            session.state !==
            GAME_STATES.BETTING
        ) {
            throw new Error(
                "Betting is no longer active."
            );
        }

        clearPlayerBet(
            session.id,
            interaction.user.id
        );

        await interaction.update({
            embeds: [
                formatRouletteBetting({
                    session:
                        rouletteService.getSession(
                            session.id
                        ),

                    minimumBet:
                        rouletteService.getMinimumBet(),

                    remainingTime:
                        rouletteService
                            .getRemainingRoundTime(
                                session.id
                            ),
                }),
            ],

            components: [
                createRouletteBetTypeSelect(
                    rouletteService.getBetTypes(),
                    session.id
                ),

                createRouletteBettingButtons({
                    sessionId:
                        session.id,
                }),
            ],
        });

        return true;
    } catch (error) {
        return replyError(
            interaction,
            error.message
        );
    }
}


/*
 * -----------------------------
 * Back
 * -----------------------------
 */

async function handleBack(
    interaction,
    sessionId
) {
    try {
        const session =
            multiplayerService.getSession(
                sessionId
            );

        if (!session) {
            throw new Error(
                "Roulette session no longer exists."
            );
        }

        clearPlayerBet(
            session.id,
            interaction.user.id
        );

        await interaction.update({
            embeds: [
                formatRouletteBetting({
                    session:
                        rouletteService.getSession(
                            session.id
                        ),

                    minimumBet:
                        rouletteService.getMinimumBet(),

                    remainingTime:
                        rouletteService
                            .getRemainingRoundTime(
                                session.id
                            ),
                }),
            ],

            components: [
                createRouletteBetTypeSelect(
                    rouletteService.getBetTypes(),
                    session.id
                ),

                createRouletteBettingButtons({
                    sessionId:
                        session.id,
                }),
            ],
        });

        return true;
    } catch (error) {
        return replyError(
            interaction,
            error.message
        );
    }
}


/*
 * -----------------------------
 * Submit Bet
 * -----------------------------
 */

async function handleSubmitBet(
    interaction,
    sessionId
) {
    try {
        const session =
            multiplayerService.getSession(
                sessionId
            );

        if (!session) {
            throw new Error(
                "Roulette session no longer exists."
            );
        }

        if (
            session.state !==
            GAME_STATES.BETTING
        ) {
            throw new Error(
                "Betting is no longer active."
            );
        }

        const draft =
            getPlayerBet(
                session,
                interaction.user.id
            );

        if (
            !draft ||
            !draft.type ||
            !draft.amount
        ) {
            throw new Error(
                "Choose a bet type and wager before submitting."
            );
        }

        if (!draft.confirmed) {
            throw new Error(
                "Please confirm your bet first."
            );
        }

        const result =
            rouletteService.placeBet(
                session.id,
                interaction.user.id,
                draft.amount,
                {
                    type:
                        draft.type,

                    value:
                        draft.value,
                }
            );

        await interaction.update({
            embeds: [
                formatRouletteBetSubmitted({
                    betType:
                        result.bet.type,

                    value:
                        result.bet.value,

                    amount:
                        result.bet.amount,

                    remainingTime:
                        rouletteService
                            .getRemainingRoundTime(
                                session.id
                            ),
                }),
            ],

            components: [],
        });

        return true;
    } catch (error) {
        return replyError(
            interaction,
            error.message
        );
    }
}


/*
 * -----------------------------
 * Spin
 * -----------------------------
 */

async function handleSpin(
    interaction,
    sessionId
) {
    try {
        const session =
            multiplayerService.getSession(
                sessionId
            );

        if (!session) {
            throw new Error(
                "Roulette session no longer exists."
            );
        }

        if (
            session.hostId !==
            interaction.user.id
        ) {
            throw new Error(
                "Only the host can spin the roulette wheel."
            );
        }

        if (
            session.state !==
            GAME_STATES.BETTING
        ) {
            throw new Error(
                "The roulette wheel cannot be spun right now."
            );
        }

        rouletteService.lockBetting(
            session.id
        );

        await interaction.deferUpdate();

        const result =
            rouletteService.resolveRound(
                session.id
            );

        const playerResults =
            Object.values(
                result.players ?? {}
            );

        await interaction.editReply({
            embeds: [
                formatRouletteResult({
                    result,
                    playerResults,
                }),
            ],

            components: [
                createRouletteResultButtons({
                    sessionId:
                        session.id,

                    isHost: true,
                }),
            ],
        });

        return true;
    } catch (error) {
        return replyError(
            interaction,
            error.message
        );
    }
}


/*
 * -----------------------------
 * Next Round
 * -----------------------------
 */

async function handleNextRound(
    interaction,
    sessionId
) {
    try {
        const session =
            multiplayerService.getSession(
                sessionId
            );

        if (!session) {
            throw new Error(
                "Roulette session no longer exists."
            );
        }

        if (
            session.hostId !==
            interaction.user.id
        ) {
            throw new Error(
                "Only the host can start the next roulette round."
            );
        }

        rouletteService.nextRound(
            session.id
        );

        rouletteService.beginBetting(
            session.id
        );

        const updated =
            rouletteService.getSession(
                session.id
            );

        await interaction.update({
            embeds: [
                formatRouletteBetting({
                    session: updated,

                    minimumBet:
                        rouletteService.getMinimumBet(),

                    remainingTime:
                        rouletteService
                            .getRemainingRoundTime(
                                updated.id
                            ),
                }),
            ],

            components: [
                createRouletteBetTypeSelect(
                    rouletteService.getBetTypes(),
                    updated.id
                ),

                createRouletteBettingButtons({
                    sessionId:
                        updated.id,
                }),
            ],
        });

        return true;
    } catch (error) {
        return replyError(
            interaction,
            error.message
        );
    }
}


/*
 * -----------------------------
 * Cancel
 * -----------------------------
 */

async function handleCancel(
    interaction,
    sessionId
) {
    try {
        const session =
            multiplayerService.getSession(
                sessionId
            );

        if (!session) {
            throw new Error(
                "Roulette session no longer exists."
            );
        }

        if (
            session.hostId !==
            interaction.user.id
        ) {
            throw new Error(
                "Only the host can cancel the roulette game."
            );
        }

        rouletteService.cancelSession(
            session.id,
            interaction.user.id
        );

        await interaction.update({
            embeds: [
                formatRouletteError(
                    "Roulette game cancelled."
                ),
            ],

            components: [],
        });

        return true;
    } catch (error) {
        return replyError(
            interaction,
            error.message
        );
    }
}


/*
 * -----------------------------
 * Close
 * -----------------------------
 */

async function handleClose(
    interaction,
    sessionId
) {
    try {
        const session =
            multiplayerService.getSession(
                sessionId
            );

        if (!session) {
            throw new Error(
                "Roulette session no longer exists."
            );
        }

        if (
            session.hostId ===
            interaction.user.id
        ) {
            rouletteService.endSession(
                session.id
            );
        }

        await interaction.update({
            components: [],
        });

        return true;
    } catch (error) {
        return replyError(
            interaction,
            error.message
        );
    }
}


/*
 * -----------------------------
 * Main Router
 * -----------------------------
 */

async function handleRouletteInteraction(
    interaction
) {
    const {
        action,
        sessionId,
    } = parseRouletteId(
        interaction.customId
    );


    /*
     * Ignore non-Roulette interactions.
     */

    if (
        !action ||
        !action.startsWith(
            "roulette_"
        )
    ) {
        return false;
    }


    /*
     * Every Roulette interaction
     * except the initial command must
     * carry a session ID.
     */

    if (!sessionId) {
        return replyError(
            interaction,
            "This Roulette interaction is missing its session ID."
        );
    }


    /*
     * -----------------------------
     * Select Menus
     * -----------------------------
     */

    if (
        interaction.isStringSelectMenu()
    ) {
        switch (action) {
            case "roulette_bet_type":
                return handleBetType(
                    interaction,
                    sessionId
                );

            case "roulette_number":
                return handleNumber(
                    interaction,
                    sessionId
                );

            default:
                return false;
        }
    }


    /*
     * -----------------------------
     * Modals
     * -----------------------------
     */

    if (
        interaction.isModalSubmit()
    ) {
        switch (action) {
            case "roulette_bet_amount":
                return handleBetAmount(
                    interaction,
                    sessionId
                );

            default:
                return false;
        }
    }


    /*
     * -----------------------------
     * Buttons
     * -----------------------------
     */

    if (
        interaction.isButton()
    ) {
        switch (action) {
            case "roulette_join":
                return handleJoin(
                    interaction,
                    sessionId
                );

            case "roulette_leave":
                return handleLeave(
                    interaction,
                    sessionId
                );

            case "roulette_start":
                return handleStart(
                    interaction,
                    sessionId
                );

            case "roulette_confirm_bet":
                return handleConfirmBet(
                    interaction,
                    sessionId
                );

            case "roulette_change_bet":
                return handleChangeBet(
                    interaction,
                    sessionId
                );

            case "roulette_submit_bet":
                return handleSubmitBet(
                    interaction,
                    sessionId
                );

            case "roulette_cancel_bet":
                return handleChangeBet(
                    interaction,
                    sessionId
                );

            case "roulette_spin":
                return handleSpin(
                    interaction,
                    sessionId
                );

            case "roulette_next_round":
                return handleNextRound(
                    interaction,
                    sessionId
                );

            case "roulette_cancel":
                return handleCancel(
                    interaction,
                    sessionId
                );

            case "roulette_close":
                return handleClose(
                    interaction,
                    sessionId
                );

            case "roulette_back":
                return handleBack(
                    interaction,
                    sessionId
                );

            default:
                return false;
        }
    }

    return false;
}


module.exports = {
    startRoulette,
    handleRouletteInteraction,
};