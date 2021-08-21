const SHA265 = require("crypto-js/SHA256");

class Transaction {
    #timestamp
    #sender
    #receiver
    #amount
    #hash
    #signature
    constructor(sender, receiver, amount) {
        this.#timestamp = new Date();
        this.#sender = sender;
        this.#receiver = receiver;
        this.#amount = amount;
        this.#hash = this.calculateHash();
    }

    generateTransactionDetails() {
        return {
            sender: this.getSender(),
            receiver: this.getReceiver(),
            amount: this.getAmount(),
            timestamp: this.getTimestamp(),
            signature: this.getSignature()
        }
    }

    getSender() {
        return this.#sender;
    }

    getReceiver() {
        return this.#receiver;
    }

    getAmount() {
        return this.#amount;
    }

    getTimestamp() {
        return this.#timestamp;
    }

    getSignature() {
        return this.#signature;
    }

    calculateHash() {
        return SHA265(this.#sender, this.#receiver, this.#amount, this.#timestamp).toString();
    }

    getHash() {
        return this.#hash;
    }

    sign(signingKey) {
        try {
            if (signingKey.getPublic() !== this.#sender) {
                throw 'Could not sign due to public address mismatch';
            }
            this.#signature = signingKey.generateSignature(this.#hash);
        } catch(error) {
            console.error(error)
        }
    }

    validateSignature() {
        if (this.#sender === null) {
            return [true, 'No signature required for this transaction'];
        }
        if (!this.#signature) {
            return [false, `INVALID SIGNATURE. HASH: ${this.getHash()}`];
        }
        return [true, this.#signature];
    }
}

module.exports = Transaction;