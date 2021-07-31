const fs = require('fs');
const path = require('path');

/*
 * Apply flags input in the command line.  eg: "-no-logs" disables all user
 * input console logs.
 */
function applyFlags(args) {
    const flags = args.filter(arg => arg.includes('-'));
    const methods = {
        '-no-logs': () => disableConsoleMethod('log'),
        '-no-errors': () => disableConsoleMethod('error'),
        '-no-test-logs': () => disableConsoleMethod('logTest'),
        '-no-assert-logs': () => disableConsoleMethod('logAssert'),
        '-no-result-logs': () => disableConsoleMethod('logResult'),
        '-only-result-logs': () => {
            ['log',
             'error',
             'logTest',
             'logAssert'].forEach(disableConsoleMethod);
        }
    }
    flags.forEach(flag => methods[flag]?.()); 
}

function disableConsoleMethod(method) {
    console[method] = function() {};
}

/*
 * Create special console log methods to be used automatically
 * by the test framework. 
 */
function setCustomLogs() {
    const log = console.log;
    console.logAssert = log;
    console.logResult = log;
    console.logTest = log;
}

/*
 * Recursively walk from the root directly and build a list of test files.
 */
function findMatchingFiles(regex, dir = path.resolve('')) {
    const skips = ['node_modules', '.git', 'testlib'];
    const files = [];
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        const isDirectory = fs.lstatSync(fullPath).isDirectory();
        const isSkipped = skips.some(skip => file.match(new RegExp(skip)));
        if (isDirectory && !isSkipped) {
            const result = findMatchingFiles(regex, fullPath);
            files.push(result)
            files.flat();
        } else if (!isDirectory && file.match(regex)) {
            files.push(fullPath)
        }
    });
    return files.flat();
}

function formatFixtureImports(files) {
    const fixtures = files.map(file => require(file));
    return fixtures.reduce((obj, curr) => {
        obj[curr] = curr;
        return { ...obj, ...curr}
    }, {});
}

function getFixtureData() {
    const fixturesRe = /.fixtures.js/;
    const files = findMatchingFiles(fixturesRe);
    return formatFixtureImports(files);
}

/*
 * Gets the test results from the test files.  Filters by test file name 
 * args input in the command line, eg: "blockchain"
 */
function getTestResults(args) {
    args = args.filter(arg => !arg.includes('-'));
    const testRe = /.test.js/;
    let testFiles = findMatchingFiles(testRe);

    if (args.length) {
        testFiles = testFiles.filter(file => args.some(arg => {
            arg = `${arg}.test.js`.toLowerCase();
            // Get only full file name without path
            const fileSplit = file.split('\\');
            const isMatch = arg === fileSplit[fileSplit.length - 1].toLowerCase();
            return isMatch;
        }));
    }
    return testFiles.map(file => require(file));
}

module.exports = {
    findMatchingFiles,
    formatFixtureImports,
    getFixtureData,
    applyFlags,
    setCustomLogs,
    getTestResults
};