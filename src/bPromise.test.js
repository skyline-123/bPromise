var promisesAplusTests = require("promises-aplus-tests");
const adapter = require("../index.js");
promisesAplusTests(adapter, function (err) {
    // All done; output is in the console. Or check `err` for number of failures.
});