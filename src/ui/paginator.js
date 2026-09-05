const {
    ActionRowBuilder,
    ButtonStyle,
} = require("discord.js");

const {
    createButton,
} = require("./buttonFactory");


function createPaginator({
    pages,
    currentPage = 0,
    customIdPrefix = "pagination",
}) {

    if (
        !Array.isArray(pages) ||
        pages.length === 0
    ) {
        throw new Error(
            "Paginator requires at least one page."
        );
    }


    if (
        !Number.isInteger(currentPage) ||
        currentPage < 0 ||
        currentPage >= pages.length
    ) {
        throw new Error(
            "Invalid paginator page."
        );
    }


    if (
        typeof customIdPrefix !== "string" ||
        customIdPrefix.trim() === ""
    ) {
        throw new Error(
            "Invalid paginator ID prefix."
        );
    }


    const previousButton =
        createButton({
            customId:
                `${customIdPrefix}_previous`,

            label:
                "Previous",

            style:
                ButtonStyle.Secondary,

            disabled:
                currentPage === 0,
        });


    const nextButton =
        createButton({
            customId:
                `${customIdPrefix}_next`,

            label:
                "Next",

            style:
                ButtonStyle.Secondary,

            disabled:
                currentPage ===
                pages.length - 1,
        });


    const row =
        new ActionRowBuilder()
            .addComponents(
                previousButton,
                nextButton,
            );


    return {
        content:
            pages[currentPage],

        components:
            [row],

        currentPage,

        totalPages:
            pages.length,
    };
}


module.exports = {
    createPaginator,
};