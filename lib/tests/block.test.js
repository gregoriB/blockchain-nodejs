const TestSuite = require('../TestSuite.js');
const Block = require('../Block.js');

const tests = new TestSuite();

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

    it('Sets the "next" has property', () => {
        block.setNext('test');
        assert.exists(block.getNext());
    });

    it('Mines the block', () => {
        const difficulty = 3;
        assert.doesNotEqual(block.getHash().slice(0, 3), '000');
        block.mine(difficulty);
        assert.equal(block.getHash().slice(0, 3), '000');
    });
});

module.exports = tests.getResults();