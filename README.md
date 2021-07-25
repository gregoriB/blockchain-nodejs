Very basic token blockchain built with Nodejs.

Uses a custom testing framework(still a work in progress).

To run tests, run `node ./runTests.js`

Currently the test results for each test suite must be imported into the file and manually added to the results config.
To only display the results of specific tests, add those to the command: `node ./runTests.js blockchain transactions`

Flags can also be added for configuration of the console output: `node ./runTests.js -no-errors -no-assert-logs`

Currently implemented flags
`-no-logs` - Disables user input console logs
`-no-errors` Disables user input console errors
`-no-test-logs` Disables test logs
`-no-assert-logs` Disables assertion failure logs
`-no-result-logs` Disables the results log(though I don't know why you'd want to do that)
`-only-result-logs` All logs except for the results log are disabled.  Doesn't show you which test failed though.

Probably only worthwhile to run `-no-errors` and `-no-test-logs` in most cases.


Still lots to do on this, both with the blockchain, and with the testing framework.