const BlockChain = require('../BlockChain.js');
const TestSuite = require('../TestSuite.js');
const Transaction = require('../Transaction.js');

const chainData = {
    name: 'test',
    payout: 1,
    difficulty: 1,
    total: 100,
}
const chainArgs = Object.values(chainData);
const payoutAddress = 1234567890;
const transactionDetails = { sender: 1234, receiver: 5678, amount: 5 };
const transactionArgs = Object.values(transactionDetails);

const tests = new TestSuite();

tests.describe('New Block Chain', tools => {
    const { it, beforeEach, assert } = tools;

    let chain;
    let transaction;

    function addDuplicateTransactionsToPending(qty = 0, transaction) {
        transaction = transaction || new Transaction(...transactionArgs);
        for (let i = 0; i < qty; i++) {
            chain.addTransactionToPending(transaction);
        }
    }

    beforeEach(() => {
        chain = new BlockChain(...chainArgs);
        transaction = new Transaction(...transactionArgs);
    });

    it('Creates a new blockchain', () => {
        const actual = chain.generateChainData();
        assert.hasExpectedValues(actual, chainData);
    });

    it('Generates a genesis block', () => {
        const firstBlock = chain.getChain()[0];
        assert.exists(firstBlock.getHash());
    });
    
    it('Adds a new transaction to pending', () => {
        chain.addTransactionToPending(transaction);
        const pending = chain.getPendingTransactions();
        assert.equal(pending.length, 1);
        const firstPendingDetails = pending[0].generateTransactionDetails();
        assert.hasExpectedValues(firstPendingDetails, transactionDetails);
    });

    it('Adds a new block to the chain', () => {
        chain.addTransactionToPending(transaction);
        chain.minePending(payoutAddress);
        const lastBlockTransactions = chain.getLastBlock().getTransactions();
        assert.hasExpectedValues(lastBlockTransactions[0], transactionDetails);
    });

    it('Pays out to miner after adding mining block', () => {
        addDuplicateTransactionsToPending(2);
        chain.minePending(payoutAddress);
        const lastBlockTransactions = chain.getLastBlock().getTransactions();
        assert.hasExpectedValues(lastBlockTransactions[0], transactionDetails);
        const pending = chain.getPendingTransactions();
        assert.equal(pending.length, 1);
        assert.equal(pending[0].generateTransactionDetails().sender, chain.generateChainData().name);
        assert.equal(pending[0].generateTransactionDetails().receiver, payoutAddress);
    });

    it('Updates chain total after paying miner', () => {
        addDuplicateTransactionsToPending(2);
        chain.minePending(payoutAddress);
        const lastBlockTransactions = chain.getLastBlock().getTransactions();
        assert.hasExpectedValues(lastBlockTransactions[0], transactionDetails);
        assert.equal(chain.getTotal(), (chainData.total - chainData.payout));
    });

    it('Invalidates the chain when it is bad', () => {
        addDuplicateTransactionsToPending(4);
        chain.minePending(payoutAddress);
        chain.getLastBlock().hash = 12345
        assert.equal(chain.validateChain()[0], false);
    });

    it('Validates the chain when it is good', () => {
        addDuplicateTransactionsToPending(4);
        chain.minePending(payoutAddress);
        assert.equal(chain.validateChain()[0], true);
    });

    it('Returns the correct balance for address', () => {
        const addressA = 'addressA';
        const addressB = 'addressB';
        const transactionDataArr = [
            { sender: 'chain', receiver: addressA, amount: 1000 },
            { sender: 'chain', receiver: addressB, amount: 1000 },
            { sender: addressA, receiver: addressB, amount: 100 },
            { sender: addressB, receiver: addressA, amount: 50 },
            { sender: addressA, receiver: addressB, amount: 5 },
            { sender: addressB, receiver: addressA, amount: 500 }
        ]

        transactionDataArr.forEach((transaction, i) => {
            const { sender, receiver, amount } = transaction;
            chain.addTransactionToPending(new Transaction(sender, receiver, amount));
        });
        chain.minePending(payoutAddress);
        const totalA = chain.getAddressTotal(addressA);
        const totalB = chain.getAddressTotal(addressB);
        assert.equal(totalA, 1445);
        assert.equal(totalB, 555);
    });

    it('Execute observers when the chain is updated', () => {
        let count = 0;
        chain.subscribe(() => count++);
        chain.addTransactionToPending(transaction);
        chain.minePending(payoutAddress);
        assert.equal(count, 1);
    });

    it('Passes updated blockchain data to the observer', () => {
        const dataBefore = chain.generateChainData();
        assert.equal(dataBefore.chain.length, 1);
        chain.subscribe(data => {
            assert.equal(data.chain.length, 2);
        });
        chain.addTransactionToPending(transaction);
        chain.minePending(payoutAddress);
    });
});

module.exports = tests.getResults();