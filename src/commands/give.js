const { ApplicationCommandOptionType } = require("discord.js");

const economyService = require("../services/economyService");
const { formatTransfer } = require("../ui/economyFormatter");
const AppError = require("../errors/AppError");
const errorMessages = require("../errors/errorMessages");

module.exports = {
    name: "give",
    description: "Give coins to another user.",

    options: [
        {
            name: "user",
            description: "The user you want to give coins to.",
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: "amount",
            description: "The amount of coins to give.",
            type: ApplicationCommandOptionType.Integer,
            required: true,
            min_value: 1,
        },
    ],

    async execute(interaction) {
        const recipient = interaction.options.getUser("user");
        const amount = interaction.options.getInteger("amount");

        if (!recipient || recipient.bot) {
            throw new AppError(
                errorMessages.INVALID_TARGET,
                "INVALID_TARGET"
            );
        }

        economyService.transfer(
    interaction.user.id,
    recipient.id,
    amount
);

        const embed = formatTransfer({
            sender: interaction.user,
            recipient,
            amount,
        });

        await interaction.reply({
            embeds: [embed],
        });
    },
};