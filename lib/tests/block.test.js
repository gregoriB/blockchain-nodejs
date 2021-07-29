const TestSuite = require('../../testlib/TestSuite.js');
const Transaction = require('../Transaction.js');
const KeyGenerator = require('../keyGenerator.js')
const Block = require('../Block.js');

const tests = new TestSuite();

const address = new KeyGenerator();
const transactionDetails = { sender: address.getPublic(), receiver: 5678, amount: 5 };
const transactionArgs = Object.values(transactionDetails);

tests.run('Block', tools => {
    const { test, beforeEach, assert } = tools;

    let block;

    beforeEach(() => {
        block = new Block(0, []);
    });

    test('Has expected properties on creation', () => {
        const blockExpectedProperties = ['prev', 'transactions', 'timestamp', 'hash'];
        const blockData = block.generateBlockData();
        assert.hasExpectedKeys(blockData, blockExpectedProperties);
    });

    test('Sets the "next" property', () => {
        block.setNext('test');
        assert.exists(block.getNext());
    });

    test('Mines the block', () => {
        const difficulty = 3;
        assert.notEqual(block.getHash().slice(0, 3), '000');
        block.mine(difficulty);
        assert.equal(block.getHash().slice(0, 3), '000');
    });

    test('Validates all transactions when they are signed', () => {
        const goodTransaction1 = new Transaction(...transactionArgs);
        const goodTransaction2 = new Transaction(...transactionArgs);
        goodTransaction1.sign(address);
        goodTransaction2.sign(address);
        block = new Block(0, [goodTransaction1, goodTransaction2]);
        assert.equal(block.validateTransactions()[0], true);
    });

    test('Invalidates all transactions when some are unsigned', () => {
        const goodTransaction = new Transaction(...transactionArgs);
        goodTransaction.sign(address);
        const badTransaction = new Transaction(...transactionArgs);
        block = new Block(0, [goodTransaction, badTransaction]);
        assert.equal(block.validateTransactions()[0], false);
    });

    test('Validates block when previous and next hashes when they are valid', () => {
        const prev = '12345';
        const next = '67890';
        block.prev = prev;
        block.next = next;
        const [isValid] = block.validateBlock(prev, next);
        assert.equal(isValid, true);
    });

    test('Invalidates block when previous hash is invalid', () => {
        const prev = '12345';
        const next = '67890';
        block.prev = '00000';
        block.next = next;
        const [isValid] = block.validateBlock(prev, next);
        assert.equal(isValid, false);
    });

    test('Invalidates block when next hash is invalid', () => {
        const prev = '12345';
        const next = '67890';
        block.prev = prev;
        block.next = '0000';
        const [isValid] = block.validateBlock(prev, next);
        assert.equal(isValid, false);
    });
});

module.exports = tests.getResults();