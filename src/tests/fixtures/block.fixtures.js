const KeyGenerator = require('../../keyGenerator.js');

const walletA = new KeyGenerator();
const walletB = new KeyGenerator();
const transactionDetails = { sender: walletA.getPublic(), receiver: 5678, amount: 5 };
const transactionArgs = Object.values(transactionDetails);

module.exports = {
    walletA,
    walletB,
    transactionDetails,
    transactionArgs,
}