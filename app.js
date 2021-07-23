const SHA265 = require("crypto-js/SHA256");

class Block {
    constructor(prev, data) {
        this.prev = prev;
        this.data = data;
        this.timestamp = new Date();
        this.hash = this.generateHash();
        this.nonce = 0;
    }

    generateHash() {
        return (
            SHA265(
                this.prev 
                + this.timestamp 
                + JSON.stringify(this.data)
                + this.nonce
            ).toString()
        )
    }

    mineBlock(difficulty) {
        while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join('0')) {
            this.nonce++;
            this.hash = this.generateHash();
        }
    }

    getHash() {
        return this.hash;
    }

    getPrev() { 
        return this.prev;
    }

    setNext(next) {
        this.next = next;
    }

    getNext() {
        return this.next;
    }

    getData() {
        return this.data;
    }
}

class BlockChain {
    constructor(name, difficulty, payout, total) {
        this.name = name;
        this.difficulty = difficulty
        this.payout = payout;
        this.total = total;
        this.timestamp = new Date();
        this.chain = [this.generateGenesisBlock()];
        this.pending = [];
        this.observers = [];
    }

    generateMetaData() {
        const { name, timestamp, difficulty, payout, total, chain } = this;
        return { name, timestamp, difficulty, payout, total, chain };
    }

    generateGenesisBlock() {
        return new Block(0, `Genesis block of ${this.name} chain`);
    }


    generateNewBlock(prevBlock, data) {
        return new Block(prevBlock.getHash(), data);
    }

    setLastBlockNext(hash) {
        this.getLastBlock().setNext(hash);
    }

    mineNewBlock(data, address) {
        const lastBlock = this.getLastBlock();
        const block = this.generateNewBlock(lastBlock, data);
        block.mineBlock(this.difficulty);
        this.setLastBlockNext(block.getHash());
        this.addBlockToChain(block);
        this.calculateNewTotal();
        this.addDataToPending({ address, value: this.payout });
    }

    addBlockToChain(block) {
        this.chain.push(block);
        if (!this.validateChain()) {
            this.chain.pop();
        }
        this.executeObservers();
    }

    subscribe(obs) {
        this.observers.push(obs);
    }

    executeObservers() {
        const metaData = this.generateMetaData();
        this.observers.forEach(obs => obs(metaData));
    }

    addDataToPending(data) {
        this.pending.push(data);
    }

    minePending() {
        this.pending.forEach(data => {
            const lastBlock = this.getLastBlock();
            const block = this.generateNewBlock(this.getLastBlock(), data);
            lastBlock.setNext(block.getHash());
            this.addBlockToChain(block);
        });
    } 

    calculateNewTotal() {
        this.total -= this.payout;
    }

    getTotal() {
        return this.total;
    }

    getLastBlock() {
        return this.chain[this.chain.length - 1];
    }

    getChain() {
        return this.chain;
    }

    getBlockData(hash) {
        return this.chain.find(block => block.getHash() === hash).data;
    }

    getAddressTotal(address) {
        return this.chain.reduce((total, curr) => {
            if (curr.data.address === address) {
                total += curr.data.value;
            }
            return total;
        }, 0);
    }

    validateChain() {
        for (let i = 1; i < this.chain.length; i++) {
            const block = this.chain[i];
            const prev = this.chain[i - 1];
            if (block.getPrev() !== prev.getHash() || prev.getNext() !== block.getHash()) {
                console.error('Invalid chain at index: ' + i);
                return false;
            }
        }
        return true;
    }
}

class TestSuite {
    constructor() {
        this.tally = { passed: 0, failed: 0 };
    }

    initializeResultsData() {
        this.tally = { passed: 0, failed: 0 };
    }

    describe(description, fn) {
        this.initializeResultsData();
        console.log(`\nRunning tests for ${description} \n`);
        fn(this.getTestMethods());
        console.log(`\n${this.tally.passed} tests passed.  ${this.tally.failed} tests failed \n`);
    }

    getTestMethods() {
        return {
            assertEqual: this.assertEqual.bind(this),
            assertExists: this.assertExists.bind(this),
            it: this.it.bind(this)
        }
    }

    it(test, fn) {
        console.log(`${test}`);
        fn();
    }

    assertEqual(actual, expected) {
        try {
            if (actual === expected) {
                this.tally.passed++;
            } else {
                throw `Expected "${expected}" but instead got "${actual}"`
            }
        }
        catch(error) {
            console.log(`Assertion Fail`)
            console.log(error);
            this.tally.failed++;
        }
    };

    assertExists(value) {
        try {
            if (value !== undefined) {
                this.tally.passed++;
            } else {
                throw `"${value}" does not exist.`
            }
        }
        catch(error) {
            console.log(`Assertion Fail`)
            console.log(error);
            this.tally.failed++;
        }
    }
}


const tests = new TestSuite('New Block Chain');

tests.describe('New Block Chain', tools => {
    const { it, assertEqual, assertExists } = tools;
    const chainData = {
        name: 'test',
        payout: 1,
        difficulty: 1,
        total: 100,
    }
    const chainArgs = Object.values(chainData);
    const fromAddress = 1234567890;

    it('Creates a new blockchain', () => {
        const { name, payout, total, difficulty } = chainData;
        const chain = new BlockChain(name, difficulty, payout, total);
        const actual = chain.generateMetaData();
        assertEqual(actual.name, name);
        assertEqual(actual.payout, payout);
        assertEqual(actual.total, total);
        assertEqual(actual.difficulty, difficulty);
    });

    it('Generates a genesis block', () => {
        const chain = new BlockChain();
        const firstBlock = chain.getChain()[0];
        assertExists(firstBlock.getHash());
    });

    it('Adds a new block to the chain', () => {
        const chain = new BlockChain(...chainArgs);
        const data = { address: 1111111, value: 10 };
        chain.mineNewBlock(data, fromAddress);
        const lastBlockData = chain.getLastBlock().getData();
        assertEqual(lastBlockData.address, data.address);
        assertEqual(lastBlockData.value, data.value);
    });

    it('Validates the chain when it is good', () => {
        const chain = new BlockChain(...chainArgs);
        const data = { address: 1111111, value: 10 };
        chain.mineNewBlock(data, fromAddress);
        chain.mineNewBlock(data, fromAddress);
        chain.mineNewBlock(data, fromAddress);
        assertEqual(chain.validateChain(), true);
    });

    it('Invalidates the chain when it is bad', () => {
        const chain = new BlockChain(...chainArgs);
        const data = { address: 1111111, value: 10 };
        chain.mineNewBlock(data, fromAddress);
        chain.mineNewBlock(data, fromAddress);
        chain.mineNewBlock(data, fromAddress);
        chain.getLastBlock().hash = 12345
        assertEqual(chain.validateChain(), false);
    });

    // TODO Tests:
    // Mining pending
    // Calculate new total
    // Getting total from wallet address
    // Observers
});