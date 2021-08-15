# JS Testing Framework

Very light and limited testing framework.

<br>

## Features

* Automatic running test files
* Automatic importing of fixtures
* Spy on methods
* Use CLI to Specify which files to test and which console logs to log
* Familiar style to popular frameworks like Jest and Mocha.

<br>

## Usage in Nodejs

Extract folder to root directly of project. Import the `TestSuite` and be sure to export your test results after writing the tests.

Test files should containt `.test.js` in the name.  Fixture files should contain `.fixtures.js`.

To run all tests, execute `node ./testlib/runner.js` in the CLI.  
Specific test or tests can be run by adding the file name without the extensions
as an argument,
<br>
eg: `node ./testlib/runner.js person`

<br>

### Basic example testing a `Person` class from `/src/tests/person.test.js`:
```js
const Person = require("../person");
const TestSuite = require("../../testlib/TestSuite.js");
const tests = new TestSuite();

tests.run("Person Class", (tools) => {
    const { test, assert } = tools;

    test("Person has a name", () => {
        const person = new Person("Heisenberg");
        assert.equal(person.getName(), "Heisenberg");
    });
});

module.exports = tests.getResults();
```
Here are an explanation of the tools that are passed into the `tests.run` callback:

```js
/* Accepts a function to run before each test. Can pass in fixture data if the parameter
 * name matches the fixture name.  Multiple `beforeEach` functions can run before each test.
 * ie: beforeEach((fixture1, fixture2) => ...)
 */
beforeEach(Function);

/*
 * Main function for running our test.  Accepts a test description and the actual test in the callback.  
 * Also can pass in fixtures as long as the names match.
 * ie: test("Some test to make sure thing works", (fixture1, fixture2) => { ... });
 */
test(String, Function);

/*
 * Wrapper to pass a fixture object containing all fixture data into any function as the last argument.
 * ie: const doThingWithFixtures = fixtureProvider((arg1, arg2, fixtures) => { ... }));
 * In that example, the 3rd argument when `doThingWithFixtures` is called would always 
 * be the fixtures object, even when no 1st or 2nd arguments are passed in. 
 * Regardless of how many parameters there are, the last parameter should represent the fixtures object.
 */ 
fixtureProvider(Function);

/* assert methods will always have `actual` as the first argument.
 * ie: assert.equal(actual, expected) 
 */
assert = {
    equal // fn(<primitive>, <primitive>) - Tests that 2 primitives are equal.
    notEqual, // fn(<primitive>, <primitive>) - Tests that 2 primitives are not equal
    hasExpectedKeys, // fn(<object>, <array>) - Tests that an object contains all of the keys in a list
    hasExpectedValues, // fn(<object>, <object>) - Tests that an object contains the values from a different object
    exists // fn(value) - Tests that a value is not undefined
    doesNotExist // fn(value) - Test that a value is undefined
}

/*
 * Create a new spy instance.  Accepts a class or object to use for context. Then can be used
 * to watch a method on the object, and eventually get a "report" of how the method was used.
 * eg: const person = new Person("Mary");
 *     const spy = createSpy(person);
 *     const person.getName = spy.watch(person.getName);
 *     person.getName();
 *     const report = spy.getReport(); // method name, call count, args and return values for each call
 */
createSpy(Function);
```
<br>

### CLI Flags

Here is a list of CLI flags that can be run to change logging behavior:

```js
-no-logs // Disables user input console logs
-no-errors // Disables user input console errors
-no-test-logs // Disables test logs
-no-assert-logs // Disables assertion failure logs
-no-result-logs // Disables the results log(though I don't know why you'd want to do that)
-only-result-logs // All logs except for the results log are disabled.  Doesn't show you which test failed though.
```
eg: `node ./testlib/runner.js person -no-logs -no-errors`

<br>

## Some examples of tests from an actual project

```js
const BlockChain = require('../BlockChain.js');
const Transaction = require('../Transaction.js');
const TestSuite = require('../../testlib/TestSuite.js');

const tests = new TestSuite();

tests.run('Blockchain', (tools) => {
    const { test, beforeEach, assert, createSpy, fixtureProvider } = tools;

    let chain;
    let transaction;

    const addTransactionsToPending = (qty = 0, transaction, fixtures = {}) => {
        if (!transaction) {
            const { transactionArgs, walletA } = fixtures;
            transaction = new Transaction(...transactionArgs);
            transaction.sign(walletA);
        }
        for (let i = 0; i < qty; i++) {
            chain.addTransactionToPending(transaction);
        }
    }

    const addTransactionsToPendingWithFixtures = fixtureProvider(addTransactionsToPending);

    // chainArgs, transactionArgs, and walletA come from the fixture data
    // Creates a fresh blockchain and fresh transaction before each test
    beforeEach((chainArgs, transactionArgs, walletA) => {
        chain = new BlockChain(...chainArgs);
        transaction = new Transaction(...transactionArgs);
        transaction.sign(walletA);
    });

    // chainData comes from the fixture data
    test('Creates a new blockchain', (chainData) => {
        const actual = chain.generateChainData();
        assert.hasExpectedValues(actual, chainData);
    });

    // payoutAddress comes from the fixture data
    test('Validates the chain when every block has integritry', (payoutAddress) => {
        addTransactionsToPendingWithFixtures(4);
        chain.minePending(payoutAddress);
        assert.equal(chain.validateAll()[0], true);
    });

    // Example of a "spy" being used to spy on a method
    test('Execute observers when the chain is updated', (payoutAddress) => {
        let counter = 0;
        const spy = createSpy(chain);
        chain.executeObservers = spy.watch(chain.executeObservers);
        chain.subscribe(() => counter++);
        chain.subscribe(() => counter += 5);
        chain.addTransactionToPending(transaction);
        chain.minePending(payoutAddress);
        chain.addTransactionToPending(transaction);
        chain.minePending(payoutAddress);
        const spyReport = spy.getReport();
        assert.equal(spyReport.callCount, 2);
        assert.equal(counter, 12);
    });
});

module.exports = tests.getResults();
```