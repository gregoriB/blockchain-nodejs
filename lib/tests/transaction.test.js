const TestSuite = require('../../testlib/TestSuite.js');
const Transaction = require('../Transaction.js');

const tests = new TestSuite();

tests.run('Transaction', (tools, fixtures) => {
    const { test, beforeEach, assert } = tools;
    const { walletA, walletB, transactionArgs, transactionDetails } = fixtures;

    let transaction;

    beforeEach(() => {
        transaction = new Transaction(...transactionArgs);
    });

    test('Creates a new transaction', () => {
        const transactionExpectedKeys = ['sender', 'receiver', 'amount'];
        assert.hasExpectedKeys(transaction.generateTransactionDetails(), transactionExpectedKeys);
    });

    test('Generates a hash', () => {
        assert.exists(transaction.getHash());
    });

    test('Gets transaction details', () => {
        const details = transaction.generateTransactionDetails();
        assert.hasExpectedValues(details, transactionDetails);
    });

    test('Does not sign if sender is different from address', () => {
        transaction.sign(walletB);
        assert.doesNotExist(transaction.getSignature());
    });
    
    test('Signs a transaction', () => {
        assert.doesNotExist(transaction.getSignature());
        transaction.sign(walletA);
        assert.exists(transaction.getSignature());
    });
});

module.exports = tests.getResults();