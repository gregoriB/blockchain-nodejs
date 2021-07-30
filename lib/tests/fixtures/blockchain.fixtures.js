const chainData = {
    name: 'testChain',
    difficulty: 1,
    payout: 5,
    supply: 1000,
}
const chainArgs = Object.values(chainData);
const payoutAddress = 1234567890;

module.exports = {
    chainArgs,
    chainData,
    payoutAddress
}
