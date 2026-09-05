const ERROR_CODES =
    require("./errorCodes");

const ERROR_MESSAGES =
    require("./errorMessages");


class AppError extends Error {

    constructor(
        code,
        message = null,
        options = {}
    ) {

        /*
         * --------------------------------
         * Validate Error Code
         * --------------------------------
         */

        if (
            typeof code !== "string" ||
            !Object.prototype.hasOwnProperty.call(
                ERROR_MESSAGES,
                code
            )
        ) {

            code =
                ERROR_CODES.UNKNOWN_ERROR;
        }


        /*
         * --------------------------------
         * Resolve User Message
         * --------------------------------
         */

        const resolvedMessage =
            message ||
            ERROR_MESSAGES[code] ||
            ERROR_MESSAGES.UNKNOWN_ERROR;


        super(
            resolvedMessage
        );


        /*
         * --------------------------------
         * Error Metadata
         * --------------------------------
         */

        this.name =
            "AppError";

        this.code =
            code;


        this.isOperational =
            options.isOperational !== false;


        /*
         * Optional internal cause.
         *
         * Useful when wrapping
         * lower-level errors.
         */

        if (
            options.cause
        ) {

            this.cause =
                options.cause;
        }


        /*
         * Maintain proper prototype
         * chain.
         */

        Object.setPrototypeOf(
            this,
            new.target.prototype
        );


        /*
         * Capture stack without
         * unnecessary constructor noise.
         */

        if (
            Error.captureStackTrace
        ) {

            Error.captureStackTrace(
                this,
                AppError
            );
        }
    }
}


module.exports =
    AppError;