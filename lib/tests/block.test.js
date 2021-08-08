const TestSuite = require('../../testlib/TestSuite.js');
const Transaction = require('../Transaction.js');
const Block = require('../Block.js');

const tests = new TestSuite();

tests.run('Block', (tools) => {
    const { test, beforeEach, assert } = tools;

    let block;

    beforeEach(() => {
        block = new Block(0, []);
    });

    test('Mines the block', () => {
        const difficulty = 3;
        assert.notEqual(block.getHash().slice(0, 3), '000');
        block.mine(difficulty);
        assert.equal(block.getHash().slice(0, 3), '000');
    });

    test('Generates the correct data object', () => {
        const blockExpectedKeys = ['next', 'prev', 'transactions', 'timestamp', 'hash'];
        const blockData = block.generateBlockData();
        assert.hasExpectedKeys(blockData, blockExpectedKeys);
        assert.equal(blockData.hash, block.getHash());
        assert.equal(blockData.prev, block.getPrev());
        assert.equal(blockData.next, undefined);
    });

    test('Validates all transactions when they are signed', (transactionArgs, walletA) => {
        const goodTransaction1 = new Transaction(...transactionArgs);
        const goodTransaction2 = new Transaction(...transactionArgs);
        goodTransaction1.sign(walletA);
        goodTransaction2.sign(walletA);
        block = new Block(0, [goodTransaction1, goodTransaction2]);
        assert.equal(block.validateTransactions()[0], true);
    });

    test('Invalidates all transactions when some are unsigned', (transactionArgs, walletA) => {
        const goodTransaction = new Transaction(...transactionArgs);
        goodTransaction.sign(walletA);
        const badTransaction = new Transaction(...transactionArgs);
        block = new Block(0, [goodTransaction, badTransaction]);
        assert.equal(block.validateTransactions()[0], false);
    });

    test('Validates block when previous and next hashes when they are valid', () => {
        const next = '67890';
        block.setNext(next);
        const [isValid] = block.validateBlock(block.getPrev(), next);
        assert.equal(isValid, true);
    });

    test('Invalidates block when next hash is invalid', () => {
        const next = '67890';
        block.setNext('0000');
        const [isValid] = block.validateBlock(block.getPrev(), next);
        assert.equal(isValid, false);
    });
});

module.exports = tests.getResults();