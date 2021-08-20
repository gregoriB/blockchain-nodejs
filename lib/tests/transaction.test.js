const TestLib = require('testlib');
const Transaction = require('../Transaction.js');

const tests = new TestLib();

tests.run('Transaction', (tools) => {
    const { test, beforeEach, assert } = tools;

    let transaction;

    beforeEach((transactionArgs) => {
        transaction = new Transaction(...transactionArgs);
    });

    test('Creates a new transaction', () => {
        const transactionExpectedKeys = ['sender', 'receiver', 'amount'];
        assert.hasExpectedKeys(transaction.generateTransactionDetails(), transactionExpectedKeys);
    });

    test('Generates a hash', () => {
        assert.exists(transaction.getHash());
    });

    test('Gets transaction details', (transactionDetails) => {
        const details = transaction.generateTransactionDetails();
        assert.hasExpectedValues(details, transactionDetails);
    });

    test('Does not sign if sender is different from address', (walletB) => {
        transaction.sign(walletB);
        assert.doesNotExist(transaction.getSignature());
    });
    
    test('Signs a transaction', (walletA) => {
        assert.doesNotExist(transaction.getSignature());
        transaction.sign(walletA);
        assert.exists(transaction.getSignature());
    });
});

module.exports = tests.getResults();