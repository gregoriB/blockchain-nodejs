const BlockChain = require('../BlockChain.js');
const Transaction = require('../Transaction.js');
const TestSuite = require('../../testlib/TestSuite.js');

const tests = new TestSuite();

tests.run('Blockchain', (tools) => {
    const { test, beforeEach, assert, createSpy, fixtureProvider } = tools;

    let chain;
    let transaction;

    const addTransactionsToPending = (qty = 0, transaction, fixtures = {}) => {
        if (!transaction) {
            const { transactionArgs, walletA } = fixtures;
            transaction = new Transaction(...transactionArgs);
            transaction.sign(walletA);
        }
        for (let i = 0; i < qty; i++) {
            chain.addTransactionToPending(transaction);
        }
    }

    const addTransactionsToPendingWithFixtures = fixtureProvider(addTransactionsToPending);

    beforeEach((chainArgs, transactionArgs, walletA) => {
        chain = new BlockChain(...chainArgs);
        transaction = new Transaction(...transactionArgs);
        transaction.sign(walletA);
    });

    test('Creates a new blockchain', (chainData) => {
        const actual = chain.generateChainData();
        assert.hasExpectedValues(actual, chainData);
    });

    test('Generates a genesis block', () => {
        const firstBlock = chain.getChain()[0];
        assert.exists(firstBlock.getHash());
    });
    
    test('Adds a new transaction to pending', (transactionDetails) => {
        chain.addTransactionToPending(transaction);
        const pending = chain.getPendingTransactions();
        assert.equal(pending.length, 1);
        const firstPendingDetails = pending[0].generateTransactionDetails();
        assert.hasExpectedValues(firstPendingDetails, transactionDetails);
    });

    test('Adds multiple transactions to pending', () => {
        addTransactionsToPendingWithFixtures(2);
        const pending = chain.getPendingTransactions();
        assert.equal(pending.length, 2);
    });

    test('Adds a new block to the chain', (payoutAddress, transactionDetails) => {
        chain.addTransactionToPending(transaction);
        chain.minePending(payoutAddress);
        const lastBlockTransaction = chain.getLastBlock().getTransactions()[0];
        const lastBlockTransactionDetails = lastBlockTransaction.generateTransactionDetails()
        assert.hasExpectedValues(lastBlockTransactionDetails, transactionDetails);
    });

    test('Pays out to miner after mining block', (payoutAddress) => {
        addTransactionsToPendingWithFixtures(2);
        chain.minePending(payoutAddress);
        const pending = chain.getPendingTransactions();
        assert.equal(pending.length, 1);
        assert.equal(pending[0].generateTransactionDetails().sender, null);
        assert.equal(pending[0].generateTransactionDetails().receiver, payoutAddress);
    });

    test('Updates chain supply after paying miner', (payoutAddress) => {
        const { supply, payout } = chain.generateChainData();
        addTransactionsToPendingWithFixtures(2);
        chain.minePending(payoutAddress);
        assert.equal(chain.getSupply(), (supply - payout));
    });

    test('Calculates the correct total supply', () => {
        const { payout } = chain.generateChainData();
        let total = 0;
        for (let i = 0; i < 100; i++) {
            addTransactionsToPendingWithFixtures(4);
            chain.minePending(i);
            total += payout;
        }
        // Must subtract last payout because that transaction hasn't been mined yet.
        total -= payout;
        const paid = chain.getAddressTotal(null);
        assert.equal(Math.abs(paid), total);
    });

    test('Gets a blocks transactions by hash', (payoutAddress) => {
        addTransactionsToPendingWithFixtures(2);
        chain.minePending(payoutAddress);
        const block = chain.getChain()[1];
        const transactions = chain.getBlockTransactions(block.getHash());
        assert.equal(transactions.length, 2);
    });

    test('Invalidates the chain when a block lacks integrity', (payoutAddress) => {
        addTransactionsToPendingWithFixtures(2);
        chain.minePending(payoutAddress);
        addTransactionsToPendingWithFixtures(2);
        chain.minePending(payoutAddress);
        const results = chain.validateAll();
        assert.equal(results[0], false);
    });

    test('Validates the chain when every block has integritry', (payoutAddress) => {
        addTransactionsToPendingWithFixtures(4);
        chain.minePending(payoutAddress);
        assert.equal(chain.validateAll()[0], true);
    });

    test('Validates all block transactions when they are signed', (payoutAddress) => {
        addTransactionsToPendingWithFixtures(4);
        chain.minePending(payoutAddress);
        assert.equal(chain.validateAll()[0], true);
    });

    test('Invalidates chain when some transactions are unsigned', (transactionArgs, payoutAddress) => {
        addTransactionsToPendingWithFixtures(2);
        const badTransaction = new Transaction(...transactionArgs);
        chain.addTransactionToPending(badTransaction, true);
        chain.minePending(payoutAddress);
        assert.equal(chain.validateAll()[0], false);
    });

    test('Returns the correct balance for address', (walletA, walletB, payoutAddress) => {
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

    test('Execute observers when the chain is updated', (payoutAddress) => {
        let counter = 0;
        const spy = createSpy(chain);
        chain.executeObservers = spy.watch(chain.executeObservers);
        chain.subscribe(() => counter++);
        chain.subscribe(() => counter += 5);
        chain.addTransactionToPending(transaction);
        chain.minePending(payoutAddress);
        chain.addTransactionToPending(transaction);
        chain.minePending(payoutAddress);
        const spyReport = spy.getReport();
        assert.equal(spyReport.callCount, 2);
        assert.equal(counter, 12);
    });

    test('Passes updated blockchain data to the observer', (payoutAddress) => {
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