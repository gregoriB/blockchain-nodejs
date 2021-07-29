const KeyGenerator = require('../../keyGenerator.js');

const address = new KeyGenerator();
const transactionDetails = { sender: address.getPublic(), receiver: 5678, amount: 5 };
const transactionArgs = Object.values(transactionDetails);

module.exports = {
    address,
    transactionDetails,
    transactionArgs,
}