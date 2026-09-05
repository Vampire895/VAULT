const economyService = require("../src/services/economyService");
const { execute } = require("../src/database/repository");
const AppError = require("../src/errors/AppError");
const configurationService = require("../src/services/configurationService");

const TEST_USER_A = "phase1_test_a";
const TEST_USER_B = "phase1_test_b";

function assert(condition, message) {
    if (!condition) {
        throw new Error(`❌ TEST FAILED: ${message}`);
    }

    console.log(`✅ ${message}`);
}

function cleanup() {
    execute(
        `
        DELETE FROM users
        WHERE user_id IN (@userA, @userB)
        `,
        {
            userA: TEST_USER_A,
            userB: TEST_USER_B,
        }
    );
}

configurationService.initialize();

try {
    cleanup();

    // 1. New account receives configured starting balance
    const accountA = economyService.createAccount(TEST_USER_A);

    assert(
        accountA.balance === 25000,
        "New account receives starting balance"
    );

    // 2. Existing account is not overwritten
    economyService.createAccount(TEST_USER_A);

    assert(
        economyService.getBalance(TEST_USER_A) === 25000,
        "Existing balance is not overwritten"
    );

    // 3. Deposit
    economyService.deposit(TEST_USER_A, 5000);

    assert(
        economyService.getBalance(TEST_USER_A) === 30000,
        "Deposit increases balance correctly"
    );

    // 4. Withdraw
    economyService.withdraw(TEST_USER_A, 10000);

    assert(
        economyService.getBalance(TEST_USER_A) === 20000,
        "Withdraw decreases balance correctly"
    );

    // 5. Invalid amount
    let invalidAmountFailed = false;

    try {
        economyService.deposit(TEST_USER_A, 0);
    } catch (error) {
        invalidAmountFailed =
            error instanceof AppError &&
            error.code === "INVALID_AMOUNT";
    }

    assert(
        invalidAmountFailed,
        "Invalid amount is rejected"
    );

    // 6. Insufficient balance
    let insufficientFundsFailed = false;

    try {
        economyService.withdraw(TEST_USER_A, 999999);
    } catch (error) {
        insufficientFundsFailed =
            error instanceof AppError &&
            error.code === "INSUFFICIENT_BALANCE";
    }

    assert(
        insufficientFundsFailed,
        "Insufficient balance is rejected"
    );

    // 7. Create recipient
    economyService.createAccount(TEST_USER_B);

    // 8. Self-transfer
    let selfTransferFailed = false;

    try {
        economyService.transfer(TEST_USER_A, TEST_USER_A, 1000);
    } catch (error) {
        selfTransferFailed =
            error instanceof AppError &&
            error.code === "SELF_TRANSFER";
    }

    assert(
        selfTransferFailed,
        "Self-transfer is rejected"
    );

    // 9. Atomic transfer
    economyService.transfer(
        TEST_USER_A,
        TEST_USER_B,
        5000
    );

    assert(
        economyService.getBalance(TEST_USER_A) === 15000,
        "Sender balance updates correctly"
    );

    assert(
        economyService.getBalance(TEST_USER_B) === 30000,
        "Recipient balance updates correctly"
    );

    console.log("\n🎉 PHASE 1 ECONOMY TEST PASSED!");
} finally {
    cleanup();
}