const Block = require('./Block.js');
const Transaction = require('./Transaction.js');

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

    generateChainData() {
        const { name, timestamp, difficulty, payout, total, chain } = this;
        return { name, timestamp, difficulty, payout, total, chain };
    }

    generateGenesisBlock() {
        return new Block(0, `Genesis block of ${this.name} chain`);
    }

    generateNewBlock(data) {
        const lastBlockHash = this.getLastBlock().getHash();
        return new Block(lastBlockHash, data);
    }

    setLastBlockNext(hash) {
        this.getLastBlock().setNext(hash);
    }

    minePending(payoutAddress) {
        const block = this.generateNewBlock(this.pending);
        block.mine(this.difficulty); 
        this.setLastBlockNext(block.getHash());
        this.addBlockToChain(block);
        const reward = new Transaction(this.name, payoutAddress, this.payout);
        this.resetPending();
        this.addTransactionToPending(reward);
        this.calculateNewTotal();
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
        const metaData = this.generateChainData();
        this.observers.forEach(obs => obs(metaData));
    }

    addTransactionToPending(transaction) {
        this.pending.push(transaction);
    }

    resetPending() {
        this.pending = [];
    }

    getPendingTransactions() {
        return this.pending;
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
        let total = 0;
        for (let i = 1; i < this.chain.length; i++) {
            total += this.chain[i].transactions.reduce((acc, curr) => {
                const { sender, receiver, amount } = curr.getDetails(); 
                if (sender === address) {
                    acc -= amount;
                }
                if (receiver === address) {
                    acc += amount;
                }
                return acc;
            }, 0);
        };
        return total;
    }

    validateChain() {
        for (let i = 1; i < this.chain.length; i++) {
            const block = this.chain[i];
            const prev = this.chain[i - 1];
            if (block.getPrev() !== prev.getHash() || prev.getNext() !== block.getHash()) {
                return [false, {
                    prevBlock: prev,
                    failBlock: block,
                    failIndex: i,
                }];
            }
        }
        return [true, `Successfully validated ${this.chain.length - 1} blocks`];
    }
}

module.exports = BlockChain;