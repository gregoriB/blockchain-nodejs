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
 * Create custom console log methods to be used automatically
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
function findMatchingFiles(regex, dir = path.resolve(''), currPath = "") {
    const skips = ['node_modules', '.git', 'testlib'];
    const files = [];
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        // const fullcurrPath = `${currPath}/${file}`;
        const isDirectory = fs.lstatSync(fullPath).isDirectory();
        const isSkipped = skips.some(skip => file.match(new RegExp(skip)));
        if (isDirectory && !isSkipped) {
            currPath = `${currPath}/${file}`;
            const result = findMatchingFiles(regex, fullPath, currPath);
            files.push(result)
            files.flat();
            // Back up if the folder is a dead end
            if (!result.length) {
                const currPathSplit = currPath.split('/');
                currPath = currPathSplit.slice(0, currPathSplit.length - 1).join('/');
            }
        } else if (!isDirectory && file.match(regex)) {
            files.push(`${currPath}/${file}`);
        }
    });
    return files.flat();
}

function formatFixtureImports(files) {
    const dir = path.resolve('');
    const fixtures = files.map(file => require(dir + file));
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
    const dir = path.resolve('');
    const testRe = /.test.js/;
    let testFiles = findMatchingFiles(testRe, dir);

    if (args.length) {
        testFiles = testFiles.filter(file => args.some(arg => {
            arg = `${arg}.test.js`.toLowerCase();
            const fileSplit = file.split('/');
            return arg === fileSplit[fileSplit.length - 1].toLowerCase();
        }));
    }
    return testFiles.map(file => require(dir + file))
}


module.exports = {
    findMatchingFiles,
    formatFixtureImports,
    getFixtureData,
    applyFlags,
    setCustomLogs,
    getTestResults
};