class TestSuite {
    constructor() {
        this.description = '';
        this.initializeTestData();
        this.beforeEachCallbacks = [];
    }

    initializeTestData() {
        this.tallies = {
            tests: {
                passed: 0,
                failed: 0
            },
            assertions: {
                passed: 0,
                failed: 0
            }
        }
        this.beforeEachCallbacks = [];
    }

    getResults() {
        return { name: this.description, tallies: this.tallies };
    }

    describe(description, fn) {
        this.description = description;
        this.initializeTestData();
        console.log(`\nRunning tests for ${description} \n`);
        fn(this.getTestMethods());
    }

    getTestMethods() {
        const context = this;
        return {
            assert: new Assert(context).getMethodsWithContext(),
            beforeEach: this.beforeEach.bind(this),
            it: this.it.bind(this)
        }
    }

    it(test, fn) {
        console.log(`Test: "${test}"`);
        this.beforeEachCallbacks.forEach(cb => cb());
        const oldFailedTally = this.tallies.assertions.failed;
        fn();
        const verdict = oldFailedTally < this.tallies.assertions.failed ? 'failed' : 'passed';
        this.updateTestResults(verdict);
        if (verdict === 'failed') {
            this.alertTestFailure(test);
        }
    }

    alertTestFailure(test) {
        console.log(`\nALERT: "${test}" TEST HAS FAILED! SEE ABOVE ERROR FOR DETAILS\n`)
    }

    updateTestResults(verdict) {
        this.tallies.tests[verdict]++;
    }

    beforeEach(fn) {
        if (typeof fn === 'function') {
            this.beforeEachCallbacks.push(fn);
        }
    }

    incrementPassed() {
        this.tallies.assertions.passed++;
    }

    incrementFailed() {
        this.tallies.assertions.failed++;
    }

    handlePass() {
        this.incrementPassed();
    }

    handleFail(error, message) {
        message = message || '\nAssertion Fail';
        console.log(message);
        console.log(error);
        this.incrementFailed();
    }

    logTestResults(resultsArr) {
        console.log('\n\n=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~= TEST RESULTS =~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=');
        let passed = 0, failed = 0;
        resultsArr.forEach(result => {
            const { tests, assertions } = result.tallies;
            passed += tests.passed;
            failed += tests.failed;
            console.log(`
                ===== ${result.name} =====
                
                ${tests.passed + tests.failed} TESTS FINISHED

                *
                * ${assertions.passed} Assertions Passed
                * ${assertions.failed} Assertions Failed
                * 
                * ${tests.passed} Tests Passed
                * ${tests.failed} Tests Failed
                * 
            `);
        });
        console.log();
        console.log(`TOTAL: Passed: ${passed}, Failed: ${failed}`);
        console.log('\n=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=~=\n\n');
    }
}

class Assert {
    constructor(context) {
        this.context = context;
    }

    equal(actual, expected) {
        try {
            if (actual === expected) {
                this.handlePass();
            } else {
                throw `Expected "${expected}" but instead got "${actual}"`;
            }
        }
        catch(error) {
            this.handleFail(error);
        }
    }

    doesNotEqual(actual, expected) {
        try {
            if (actual !== expected) {
                this.handlePass();
            } else {
                throw `Expected "${expected}" to not equal "${actual}"`;
            }
        }
        catch(error) {
            this.handleFail(error);
        }
    }

    hasExpectedKeys(actual, expected) {
        try {
            for (let key of expected) {
                if (!actual.hasOwnProperty(key)) {
                    throw `"Missing expected property: "${key}"`;
                }
            }
            this.handlePass();
        } catch(error) {
            this.handleFail(error, `\nAssertion Fail, Object missing key`);
        }
    }

    hasExpectedValues(actual, expected) {
        try {
            for (let key in expected) {
                if (actual[key] !== expected[key]) {
                    throw `"${actual[key]}" does not equal "${expected[key]}"`;
                }
            }
            this.handlePass();
        } catch(error) {
            this.handleFail(error, `\nAssertion Fail, Object properties not equal`);
        }
    }

    exists(value) {
        try {
            if (value !== undefined) {
                this.handlePass();
            } else {
                throw `"${value}" does not exist.`;
            }
        }
        catch(error) {
            this.handleFail(error);
        }
    }

    getMethodsWithContext() {
        const { equal, doesNotEqual, hasExpectedKeys, hasExpectedValues, exists } = this;
        return {
            equal: equal.bind(this.context),
            doesNotEqual: doesNotEqual.bind(this.context),
            hasExpectedKeys: hasExpectedKeys.bind(this.context),
            hasExpectedValues: hasExpectedValues.bind(this.context),
            exists: exists.bind(this.context)
        }
    }
}

module.exports = TestSuite;