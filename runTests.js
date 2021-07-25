//TODO: Make fancy recursive function that gets test files by the "test" in the file name
const TestSuite = require('./lib/TestSuite');
const transactionTestResults = require('./lib/tests/transaction.test');
const blockTestResults = require('./lib/tests/block.test');
const blockchainTestResults = require('./lib/tests/blockchain.test');

const testSuite = new TestSuite();
const results = [transactionTestResults, blockTestResults, blockchainTestResults];

testSuite.logTestResults(results);