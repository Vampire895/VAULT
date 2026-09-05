const {
    MessageFlags,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
} = require("discord.js");

const configurationService = require("../services/configurationService");
const { formatConfiguration } = require("./configurationFormatter");
const {
    createConfigurationButtons,
    createRoleSelect,
} = require("./configurationComponents");

function getConfiguration() {
    return {
        startingBalance:
            configurationService.getStaged("startingBalance"),

        minimumBet:
            configurationService.getStaged("minimumBet"),

        defaultPrefix:
            configurationService.getStaged("defaultPrefix"),

        roleGiftsEnabled:
            configurationService.isStagedRoleGiftsEnabled(),

        roleGifts:
            configurationService.getStagedRoleGifts(),
    };
}

function isAdmin(interaction) {
    return interaction.memberPermissions?.has("Administrator");
}

async function handleConfigurationInteraction(interaction) {
    const supportedButton =
        interaction.isButton() &&
        [
            "config_edit",
            "config_save",
            "config_discard",
            "config_role_enable",
            "config_role_disable",
            "config_role_add",
        ].includes(interaction.customId);

    const supportedRoleSelect =
        interaction.isRoleSelectMenu() &&
        interaction.customId === "config_role_select";

    const supportedModal =
    interaction.isModalSubmit() &&
    (
        interaction.customId === "config_edit_modal" ||
        interaction.customId.startsWith(
            "config_role_amount_modal:"
        )
    );

    if (
        !supportedButton &&
        !supportedRoleSelect &&
        !supportedModal
    ) {
        return false;
    }

    if (!isAdmin(interaction)) {
        await interaction.reply({
            content:
                "❌ You do not have permission to use this.",
            flags: MessageFlags.Ephemeral,
        });

        return true;
    }

    /*
     * BUTTONS
     */
    if (interaction.isButton()) {
        if (interaction.customId === "config_role_enable") {
            configurationService.setRoleGiftsEnabled(true);

            await interaction.update({
                embeds: [
                    formatConfiguration(
                        getConfiguration(),
                        configurationService.isDirty()
                    ),
                ],
                components: [
                    createConfigurationButtons({
                        editing: true,
                        roleGiftsEnabled:
                            configurationService.isStagedRoleGiftsEnabled(),
                    }),
                ],
            });

            return true;
        }

        if (interaction.customId === "config_role_disable") {
            configurationService.setRoleGiftsEnabled(false);

            await interaction.update({
                embeds: [
                    formatConfiguration(
                        getConfiguration(),
                        configurationService.isDirty()
                    ),
                ],
                components: [
                    createConfigurationButtons({
                        editing: true,
                        roleGiftsEnabled: false,
                    }),
                ],
            });

            return true;
        }

        if (interaction.customId === "config_save") {
            configurationService.save();

            await interaction.update({
                embeds: [
                    formatConfiguration(
                        getConfiguration(),
                        configurationService.isDirty()
                    ),
                ],
                components: [
                    createConfigurationButtons({
                        editing: false,
                        roleGiftsEnabled:
                            configurationService.isRoleGiftsEnabled(),
                    }),
                ],
            });

            return true;
        }

        if (interaction.customId === "config_discard") {
            configurationService.discard();

            await interaction.update({
                embeds: [
                    formatConfiguration(
                        getConfiguration(),
                        configurationService.isDirty()
                    ),
                ],
                components: [
                    createConfigurationButtons({
                        editing: false,
                        roleGiftsEnabled:
                            configurationService.isRoleGiftsEnabled(),
                    }),
                ],
            });

            return true;
        }

        if (interaction.customId === "config_role_add") {
            await interaction.reply({
                content:
                    "🎁 Select the Discord role you want to configure.",
                components: [createRoleSelect()],
                flags: MessageFlags.Ephemeral,
            });

            return true;
        }

        if (interaction.customId === "config_edit") {
            const modal = new ModalBuilder()
                .setCustomId("config_edit_modal")
                .setTitle("Edit VAULT Configuration");

            const startingBalanceInput =
                new TextInputBuilder()
                    .setCustomId("startingBalance")
                    .setLabel("Starting Balance")
                    .setStyle(TextInputStyle.Short)
                    .setValue(
                        String(
                            configurationService.getStaged(
                                "startingBalance"
                            )
                        )
                    )
                    .setRequired(true);

            const minimumBetInput =
                new TextInputBuilder()
                    .setCustomId("minimumBet")
                    .setLabel("Minimum Bet")
                    .setStyle(TextInputStyle.Short)
                    .setValue(
                        String(
                            configurationService.getStaged(
                                "minimumBet"
                            )
                        )
                    )
                    .setRequired(true);

            const prefixInput =
                new TextInputBuilder()
                    .setCustomId("defaultPrefix")
                    .setLabel("Default Prefix")
                    .setStyle(TextInputStyle.Short)
                    .setValue(
                        configurationService.getStaged(
                            "defaultPrefix"
                        )
                    )
                    .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    startingBalanceInput
                ),
                new ActionRowBuilder().addComponents(
                    minimumBetInput
                ),
                new ActionRowBuilder().addComponents(
                    prefixInput
                )
            );

            await interaction.showModal(modal);

            return true;
        }
    }

    /*
     * ROLE SELECT
     */
    if (interaction.isRoleSelectMenu()) {
        const roleId = interaction.values[0];

        const modal = new ModalBuilder()
            .setCustomId(`config_role_amount_modal:${roleId}`)
            .setTitle("Role Gift Amount");

        const amountInput =
            new TextInputBuilder()
                .setCustomId("amount")
                .setLabel("Reward Amount")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder("Example: 10000")
                .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(
                amountInput
            )
        );

        await interaction.showModal(modal);

        return true;
    }

    /*
     * MODALS
     */
    if (interaction.isModalSubmit()) {
        if (
            interaction.customId === "config_role_amount_modal" ||
            interaction.customId.startsWith(
                "config_role_amount_modal:"
            )
        ) {
            const roleId =
                interaction.customId.split(":")[1];

            const amount = Number(
                interaction.fields.getTextInputValue(
                    "amount"
                )
            );

            try {
                const existing =
                    configurationService.getStagedRoleGifts();

                const filtered = existing.filter(
                    (gift) => gift.roleId !== roleId
                );

                filtered.push({
                    roleId,
                    amount,
                });

                configurationService.setStaged(
                    "roleGifts",
                    filtered
                );

                await interaction.reply({
                    embeds: [
                        formatConfiguration(
                            getConfiguration(),
                            configurationService.isDirty()
                        ),
                    ],
                    components: [
                        createConfigurationButtons({
                            editing: true,
                            roleGiftsEnabled:
                                configurationService.isStagedRoleGiftsEnabled(),
                        }),
                    ],
                });
            } catch (error) {
                await interaction.reply({
                    content: `❌ ${error.message}`,
                    flags: MessageFlags.Ephemeral,
                });
            }

            return true;
        }

        if (interaction.customId === "config_edit_modal") {
            const startingBalance = Number(
                interaction.fields.getTextInputValue(
                    "startingBalance"
                )
            );

            const minimumBet = Number(
                interaction.fields.getTextInputValue(
                    "minimumBet"
                )
            );

            const defaultPrefix =
                interaction.fields
                    .getTextInputValue("defaultPrefix")
                    .trim();

            try {
                configurationService.setStaged(
                    "startingBalance",
                    startingBalance
                );

                configurationService.setStaged(
                    "minimumBet",
                    minimumBet
                );

                configurationService.setStaged(
                    "defaultPrefix",
                    defaultPrefix
                );

                await interaction.reply({
                    embeds: [
                        formatConfiguration(
                            getConfiguration(),
                            configurationService.isDirty()
                        ),
                    ],
                    components: [
                        createConfigurationButtons({
                            editing: true,
                            roleGiftsEnabled:
                                configurationService.isStagedRoleGiftsEnabled(),
                        }),
                    ],
                });
            } catch (error) {
                await interaction.reply({
                    content: `❌ ${error.message}`,
                    flags: MessageFlags.Ephemeral,
                });
            }

            return true;
        }
    }

    return false;
}

module.exports = {
    handleConfigurationInteraction,
};