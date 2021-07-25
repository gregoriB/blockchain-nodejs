const TestSuite = require('../TestSuite.js');
const Transaction = require('../Transaction.js');
const KeyGenerator = require('../keyGenerator.js')
const Block = require('../Block.js');

const tests = new TestSuite();

const address = new KeyGenerator();
const transactionDetails = { sender: address.getPublic(), receiver: 5678, amount: 5 };
const transactionArgs = Object.values(transactionDetails);

tests.describe('New Block', tools => {
    const { it, beforeEach, assert } = tools;

    let block;

    beforeEach(() => {
        block = new Block(0, []);
    });

    it('Has expected properties on creation', () => {
        const blockExpectedProperties = ['prev', 'transactions', 'timestamp', 'hash'];
        assert.hasExpectedKeys(block.generateBlockData(), blockExpectedProperties);
    });

    it('Sets the "next" property', () => {
        block.setNext('test');
        assert.exists(block.getNext());
    });

    it('Mines the block', () => {
        const difficulty = 3;
        assert.doesNotEqual(block.getHash().slice(0, 3), '000');
        block.mine(difficulty);
        assert.equal(block.getHash().slice(0, 3), '000');
    });

    it('Validates all transactions when they are signed', () => {
        const goodTransaction1 = new Transaction(...transactionArgs);
        const goodTransaction2 = new Transaction(...transactionArgs);
        goodTransaction1.sign(address);
        goodTransaction2.sign(address);
        block = new Block(0, [goodTransaction1, goodTransaction2]);
        assert.equal(block.validateTransactions()[0], true);
    });

    it('Invalidates all transactions when some are unsigned', () => {
        const goodTransaction = new Transaction(...transactionArgs);
        goodTransaction.sign(address);
        const badTransaction = new Transaction(...transactionArgs);
        block = new Block(0, [goodTransaction, badTransaction]);
        assert.equal(block.validateTransactions()[0], false);
    });
});

module.exports = tests.getResults();