//TODO: Make fancy recursive function that gets test files by the "test" in the file name

const log = console.log;
console.logAssert = log;
console.logResult = log;
console.logTest = log;

const args = process.argv.slice(2);
const tests = args.filter(arg => !arg.includes('-'));
const flags = args.filter(arg => arg.includes('-'));

flags.forEach(handleFlag);

const TestSuite = require('./lib/TestSuite');
const transactionTestResults = require('./lib/tests/transaction.test');
const blockTestResults = require('./lib/tests/block.test');
const blockchainTestResults = require('./lib/tests/blockchain.test');

const results = {
    block: blockTestResults,
    blockchain: blockchainTestResults,
    transaction: transactionTestResults
}

/*
 * Specify which test results to display, eg: node runTests.js blockchain
 * Otherwise all test results will be displayed.
 * All tests will still run no matter what because the results from each file are being
 * imported, and right now that causes logs for each test to always be displayed.
 * That will change once test files are being run selectively based on the name.
 */
let testResultsFromArgs = tests.map(test => results[test]);
testResultsFromArgs = testResultsFromArgs.length ? testResultsFromArgs : Object.values(results);

const testSuite = new TestSuite();
testSuite.logTestResults(testResultsFromArgs);

function handleFlag(flag) {
    switch(flag) {
        case '-no-logs':
            return disableConsoleProperty('log');
        case '-no-errors':
            return disableConsoleProperty('error');
        case '-no-assert-logs':
            return disableConsoleProperty('logAssert');
        case '-no-test-logs':
            return disableConsoleProperty('logTest');
        case '-no-result-logs':
            return disableConsoleProperty('logResult');
        case '-only-result-logs':
            const disabledProperties = [
                'log',
                'error',
                'logAssert',
                'logTest',
            ];
            disabledProperties.forEach(disableConsoleProperty);
            return;
    }
}

function disableConsoleProperty(property) {
    console[property] = function() {};
}