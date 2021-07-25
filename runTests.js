//TODO: Make fancy recursive function that gets test files by the "test" in the file name
const TestSuite = require('./lib/TestSuite');
const blockTestResults = require('./lib/tests/block.test');
const blockchainTestResults = require('./lib/tests/blockchain.test');

new TestSuite().logTestResults(blockTestResults);
new TestSuite().logTestResults(blockchainTestResults);