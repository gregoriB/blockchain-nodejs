const SHA265 = require("crypto-js/SHA256");

class Block {
    constructor(prev, transactions) {
        this.prev = prev;
        this.transactions = transactions;
        this.timestamp = new Date();
        this.hash = this.generateHash();
        this.nonce = 0;
    }

    generateHash() {
        return (
            SHA265(
                this.prev 
                + this.timestamp 
                + JSON.stringify(this.transactions)
                + this.nonce
            ).toString()
        )
    }

    mine(difficulty) {
        while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join('0')) {
            this.nonce++;
            this.hash = this.generateHash();
        }
        this.nonce = 0;
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

    getTransactions() {
        return this.transactions;
    }

    generateBlockData() {
        const { prev, next, transactions, timestamp, hash } = this;
        return { prev, next, transactions, timestamp, hash };
    }

    validateTransactions() {
        for (let transaction of this.transactions) {
            const [isValid, message] = transaction.validateSignature();
            if (!isValid) {
                return [false, message];
            }
        }
        return [true, 'All transactions are valid'];
    }
}

module.exports = Block;