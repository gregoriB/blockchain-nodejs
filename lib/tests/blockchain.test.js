const BlockChain = require('../BlockChain.js');
const Transaction = require('../Transaction.js');
const TestSuite = require('../../testlib/TestSuite.js');

const tests = new TestSuite();

tests.run('Blockchain', (tools, fixtures) => {
    const { test, beforeEach, assert } = tools;
    const { walletA, walletB, payoutAddress, chainArgs, chainData, transactionArgs, transactionDetails } = fixtures;

    let chain;
    let transaction;

    function addDuplicateTransactionsToPending(qty = 0, transaction) {
        if (!transaction) {
            transaction = new Transaction(...transactionArgs);
            transaction.sign(walletA);
        }
        for (let i = 0; i < qty; i++) {
            chain.addTransactionToPending(transaction);
        }
    }

    beforeEach(() => {
        chain = new BlockChain(...chainArgs);
        transaction = new Transaction(...transactionArgs);
        transaction.sign(walletA);
    });

    test('Creates a new blockchain', () => {
        const actual = chain.generateChainData();
        assert.hasExpectedValues(actual, chainData);
    });

    test('Generates a genesis block', () => {
        const firstBlock = chain.getChain()[0];
        assert.exists(firstBlock.getHash());
    });
    
    test('Adds a new transaction to pending', () => {
        chain.addTransactionToPending(transaction);
        const pending = chain.getPendingTransactions();
        assert.equal(pending.length, 1);
        const firstPendingDetails = pending[0].generateTransactionDetails();
        assert.hasExpectedValues(firstPendingDetails, transactionDetails);
    });

    test('Adds a new block to the chain', () => {
        chain.addTransactionToPending(transaction);
        chain.minePending(payoutAddress);
        const lastBlockTransactions = chain.getLastBlock().getTransactions();
        assert.hasExpectedValues(lastBlockTransactions[0], transactionDetails);
    });

    test('Pays out to miner after mining block', () => {
        addDuplicateTransactionsToPending(2);
        chain.minePending(payoutAddress);
        const pending = chain.getPendingTransactions();
        assert.equal(pending.length, 1);
        assert.equal(pending[0].generateTransactionDetails().sender, null);
        assert.equal(pending[0].generateTransactionDetails().receiver, payoutAddress);
    });

    test('Updates chain supply after paying miner', () => {
        addDuplicateTransactionsToPending(2);
        chain.minePending(payoutAddress);
        const lastBlockTransactions = chain.getLastBlock().getTransactions();
        assert.hasExpectedValues(lastBlockTransactions[0], transactionDetails);
        assert.equal(chain.getSupply(), (chainData.supply - chainData.payout));
    });

    test('Calculates the correct total supply', () => {
        let total = 0;
        for (let i = 0; i < 100; i++) {
            addDuplicateTransactionsToPending(4);
            chain.minePending(i);
            total += chain.payout;
        }
        // Must subtract last payout because that transaction hasn't been mined yet.
        total -= chain.payout;
        const paid = chain.getAddressTotal(null);
        assert.equal(Math.abs(paid), total);
    });

    test('Invalidates the chain when a block lacks integrity', () => {
        addDuplicateTransactionsToPending(2);
        chain.minePending(payoutAddress);
        addDuplicateTransactionsToPending(2);
        chain.minePending(payoutAddress);
        addDuplicateTransactionsToPending(2);
        chain.minePending(payoutAddress);
        chain.getChain()[2].hash = 12345
        assert.equal(chain.validateAll()[0], false);
    });

    test('Validates the chain when every block has integritry', () => {
        addDuplicateTransactionsToPending(4);
        chain.minePending(payoutAddress);
        assert.equal(chain.validateAll()[0], true);
    });

    test('Validates all block transactions when they are signed', () => {
        addDuplicateTransactionsToPending(4);
        chain.minePending(payoutAddress);
        assert.equal(chain.validateAll()[0], true);
    });

    test('Invalidates chain when some transactions are unsigned', () => {
        addDuplicateTransactionsToPending(2);
        const badTransaction = new Transaction(...transactionArgs);
        chain.pending.push(badTransaction);
        chain.minePending(payoutAddress);
        assert.equal(chain.validateAll()[0], false);
    });

    test('Returns the correct balance for address', () => {
        const addressA = walletA.getPublic();
        const addressB = walletB.getPublic();
        const transactionDataArr = [
            { sender: null, receiver: addressA, amount: 1000 },
            { sender: null, receiver: addressB, amount: 1000 },
            { sender: addressA, receiver: addressB, amount: 100 },
            { sender: addressB, receiver: addressA, amount: 50 },
            { sender: addressA, receiver: addressB, amount: 5 },
            { sender: addressB, receiver: addressA, amount: 500 }
        ]

        transactionDataArr.forEach((transactionData) => {
            const { sender, receiver, amount } = transactionData;
            const transaction = new Transaction(sender, receiver, amount);
            const senderWallet = sender === addressA ? walletA : walletB;
            if (sender !== null) {
                transaction.sign(senderWallet);
            }
            chain.addTransactionToPending(transaction);
        });
        chain.minePending(payoutAddress);
        const totalA = chain.getAddressTotal(addressA);
        const totalB = chain.getAddressTotal(addressB);
        assert.equal(totalA, 1445);
        assert.equal(totalB, 555);
    });

    test('Execute observers when the chain is updated', () => {
        let count = 0;
        chain.subscribe(() => count++);
        chain.addTransactionToPending(transaction);
        chain.minePending(payoutAddress);
        assert.equal(count, 1);
    });

    test('Passes updated blockchain data to the observer', () => {
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