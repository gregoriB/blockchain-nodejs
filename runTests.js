const fs = require('fs');
const path = require('path');
const TestSuite = require('./lib/TestSuite');

init();

function init() {
    /*** Function call order matters here ***/
    setupCustomLogs();
    const args = process.argv.slice(2);
    applyFlags(args);
    const results = getTestResults(args);
    runTests(results);
}

function runTests(results) {
    const testSuite = new TestSuite();
    testSuite.logTestResults(results);
}

/*
 * Create custom console log methods to be used automatically
 * by the test framework. 
 */
function setupCustomLogs() {
    const log = console.log;
    console.logAssert = log;
    console.logResult = log;
    console.logTest = log;
}

/*
 * Apply flags input in the command line.  eg: "-no-logs" disables all user
 * input console logs.
 */
function applyFlags(args) {
    const flags = args.filter(arg => arg.includes('-'));
    const methods = {
        '-no-logs': () => disableConsoleProperty('log'),
        '-no-errors': () => disableConsoleProperty('error'),
        '-no-test-logs': () => disableConsoleProperty('logTest'),
        '-no-assert-logs': () => disableConsoleProperty('logAssert'),
        '-no-result-logs': () => disableConsoleProperty('logResult'),
        '-only-result-logs': () => {
            ['log',
            'error',
            'logTest',
            'logAssert'].forEach(disableConsoleProperty);
        }
    }
    flags.forEach(flag => {
        methods[flag]?.();
    });
}

/*
 * Gets the test results from the test files.  Filters by test file name 
 * args input in the command line, eg: "blockchain"
 */
function getTestResults(args) {
    args = args.filter(arg => !arg.includes('-'));
    let testFiles = findTestFiles(__dirname);

    if (args.length) {
        testFiles = testFiles.filter(file => args.some(arg => {
            arg = `${arg}.test.js`.toLowerCase();
            const fileSplit = file.split('/');
            return arg === fileSplit[fileSplit.length - 1].toLowerCase();
        }));
    }

    return testFiles.map(file => require(file));
}

function disableConsoleProperty(property) {
    console[property] = function() {};
}

/*
 * Recursively walk from the root directly and build a list of test files.
 */
function findTestFiles(dir, root = ".") {
    const skips = ['node_modules', '.git'];
    const files = [];
    fs.readdirSync(dir).forEach(file => {
        const re = /.test.js/;
        const fullPath = path.join(dir, file);
        const isDirectory = fs.lstatSync(fullPath).isDirectory();
        const isSkipped = skips.some(skip => file.match(new RegExp(skip)));
        if (isDirectory && !isSkipped) {
            root = `${root}/${file}`;
            files.push(findTestFiles(fullPath, root));
            files.flat();
        } else if (!isDirectory && file.match(re)) {
            files.push(`${root}/${file}`)
        }
    });
    return files.flat();
}