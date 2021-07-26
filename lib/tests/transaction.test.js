const KeyGenerator = require('../keyGenerator.js');
const TestSuite = require('../TestSuite.js');
const Transaction = require('../Transaction.js');


const address = new KeyGenerator();
const transactionDetails = { sender: address.getPublic(), receiver: 5678, amount: 5 };
const transactionArgs = Object.values(transactionDetails);

const tests = new TestSuite();

tests.run('Transaction', tools => {
    const { test, beforeEach, assert } = tools;

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

    test('Does not sign if sender is different from address', () => {
        transaction.sender = 'test'
        transaction.sign(address);
        assert.doesNotExist(transaction.getSignature());
    });
    
    test('Signs a transaction', () => {
        assert.doesNotExist(transaction.getSignature());
        transaction.sign(address);
        assert.exists(transaction.getSignature());
    });
});

module.exports = tests.getResults();