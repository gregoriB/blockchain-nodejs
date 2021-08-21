const SHA256 = require("crypto-js/SHA256");

class Block {
    #prev
    #transactions
    #timestamp
    #hash
    #nonce
    #next

    constructor(prev, transactions) {
        this.#prev = prev;
        this.#transactions = transactions;
        this.#timestamp = new Date();
        this.#hash = this.generateHash();
        this.#nonce = 0;
    }

    generateHash() {
        return (
            SHA256(
                this.#prev 
                + this.#timestamp 
                + JSON.stringify(this.#transactions)
                + this.#nonce
            ).toString()
        )
    }

    mine(difficulty) {
        const zeros = Array(difficulty + 1).join('0');
        while (this.#hash.substring(0, difficulty) !== zeros) {
            this.#nonce++;
            this.#hash = this.generateHash();
        }
    }

    getHash() {
        return this.#hash;
    }

    getPrev() { 
        return this.#prev;
    }

    setNext(next) {
        this.#next = next;
    }

    getNext() {
        return this.#next;
    }

    getTransactions() {
        return [...this.#transactions];
    }

    getTimestamp() {
        return this.#timestamp;
    }

    generateBlockData() {
        return { 
            prev: this.getPrev(), 
            next: this.getNext(), 
            transactions: this.getTransactions(), 
            timestamp: this.getTimestamp(), 
            hash: this.getHash() 
        };
    }

    validateTransactions() {
        for (let transaction of this.#transactions) {
            const [isValid, message] = transaction.validateSignature();
            if (!isValid) {
                return [false, message];
            }
        }
        return [true, 'All transactions are valid'];
    }

    validateBlock(prev, next) {
        if (this.#prev === prev && this.#next === next) {
            return [true, 'Previous and next block hashes are all valid'];
        } else {
            return [false, 'Invalid previous or next block hashes', {
                expect: {
                    prev,
                    next
                },
                actual: {
                    prev: this.#prev,
                    next: this.#next
                }
            }]
        }
    }
}

module.exports = Block;