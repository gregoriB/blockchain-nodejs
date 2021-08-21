const Block = require('./Block.js');
const Transaction = require('./Transaction.js');

class BlockChain {
    #name
    #difficulty
    #payout
    #supply
    #timestamp
    #chain
    #pending
    #observers
    constructor(name, difficulty, payout, supply) {
        this.#name = name;
        this.#difficulty = difficulty
        this.#payout = payout;
        this.#supply = supply;
        this.#timestamp = new Date();
        this.#chain = [this.generateGenesisBlock()];
        this.#pending = [];
        this.#observers = [];
    }

    generateChainData() {
        return {
            name: this.getName(),
            difficulty: this.getDifficulty(),
            payout: this.getPayout(),
            supply: this.getSupply(),
            timestamp: this.getTimestamp(),
            chain: this.getChain(),
            pending: this.getPendingTransactions()
        }
    }

    getTimestamp() {
        return this.#timestamp;
    }

    getPayout() {
        return this.#payout;
    }

    getDifficulty() {
        return this.#difficulty;
    }

    getName() {
        return this.#name;
    }

    generateGenesisBlock() {
        const transactions = [
            new Transaction(null, null, 0)
        ]
        return new Block(null, transactions);
    }

    generateNewBlock(data) {
        const lastBlockHash = this.getLastBlock().getHash();
        return new Block(lastBlockHash, data);
    }

    setLastBlockNext(hash) {
        this.getLastBlock().setNext(hash);
    }

    minePending(payoutAddress) {
        const block = this.generateNewBlock(this.#pending);
        block.mine(this.#difficulty); 
        this.setLastBlockNext(block.getHash());
        this.addBlockToChain(block);
        this.resetPending();
        const rewardTransaction = new Transaction(null, payoutAddress, this.#payout);
        this.addTransactionToPending(rewardTransaction);
        this.calculateNewSupply();
    }
    
    addBlockToChain(block) {
        this.#chain.push(block);
        this.executeObservers();
    }

    subscribe(obs) {
        this.#observers.push(obs);
    }

    executeObservers() {
        const chainData = this.generateChainData();
        this.#observers.forEach(obs => obs(chainData));
    }

    addTransactionToPending(transaction, isDebugging) {
        const [isValid, message] = transaction.validateSignature();
        try {
            if (!isValid && !isDebugging) {
                throw `Transaction not added to pending`;
            }
            this.#pending.push(transaction);
        } catch(error) {
            console.error(message)
            console.error(error);
        }
    }

    resetPending() {
        this.#pending = [];
    }

    getPendingTransactions() {
        return this.#pending;
    }

    calculateNewSupply() {
        this.#supply -= this.#payout;
    }

    getSupply() {
        return this.#supply;
    }

    getLastBlock() {
        return this.#chain[this.#chain.length - 1];
    }

    getChain() {
        return this.#chain;
    }

    getBlockTransactions(hash) {
        return this.#chain
            .find(block => block.getHash() === hash)
            .getTransactions();
    }

    getAddressTotal(address) {
        let total = 0;
        for (let i = 1; i < this.#chain.length; i++) {
            total += this.#chain[i].getTransactions().reduce((acc, curr) => {
                const { sender, receiver, amount } = curr.generateTransactionDetails(); 
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

    validateBlockPosition(block, prev, next) {
        const prevHash = prev.getHash();
        const nextHash = next?.getHash();
        const [isValid, message] = block.validateBlock(prevHash, nextHash);
        try {
            if (!isValid) {
                throw `Invalid chain`
            }
            return [true];
        } catch(error) {
            console.error(message)
            console.error(error)
            return [false, message];
        }
    }

    validateBlockTransactions(block) {
        const [ isValid, message ] = block.validateTransactions();
        try {
            if (!isValid) {
                throw `invalid transaction`;
            }
            return [true];
        } catch(error) {
            console.error(error)
            return [false, message]
        }
   }

    validateChainIntegrity() {
        return this.validator([this.validateBlockPosition]);
    }

    validateTransactions() {
        return this.validator([this.validateBlockTransactions]);
    }

    validateAll() {
        return this.validator([
            this.validateBlockPosition,
            this.validateBlockTransactions
        ]);
    }

    validator(methods) {
        for (let i = 1; i < this.#chain.length; i++) {
            const [prev, block, next] = this.#chain.slice(i - 1, i + 1);
            const blocks = { 
                prev: prev.getHash(), 
                block: block.getHash(), 
                next: next?.getHash(), 
                index: i 
            };
            for (let fn of methods) {
                const result = fn(block, prev, next);
                if (!result[0]) {
                    return [...result, blocks];
                }
            }
        }
        return [true, `Successfully validated ${this.#chain.length - 1} blocks`];
    }
}

module.exports = BlockChain;