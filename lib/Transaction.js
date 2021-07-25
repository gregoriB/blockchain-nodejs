class Transaction {
    constructor(sender, receiver, amount) {
        this.sender = sender;
        this.receiver = receiver;
        this.amount = amount;
    }

    getDetails() {
        return {
            sender: this.sender,
            receiver: this.receiver,
            amount: this.amount
        }
    }
}

module.exports = Transaction;