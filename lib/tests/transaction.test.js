const TestSuite = require('../TestSuite.js');
const Transaction = require('../Transaction.js');

const transactionDetails = { sender: 1234, receiver: 5678, amount: 5 };
const transactionArgs = Object.values(transactionDetails);

const tests = new TestSuite();

tests.describe('New Transaction', tools => {
    const { it, beforeEach, assert } = tools;

    let transaction;

    beforeEach(() => {
        transaction = new Transaction(...transactionArgs);
    });

    it('Creates a new transaction', () => {
        const transactionExpectedKeys = ['sender', 'receiver', 'amount'];
        assert.hasExpectedKeys(transaction.generateTransactionDetails(), transactionExpectedKeys);
    });
});

module.exports = tests.getResults();