/*

meter.js - Meter test

The MIT License (MIT)

Copyright (c) 2014 Tristan Slominski

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

*/

"use strict";

var Meter = require('../entries/meter.js');
var Quantify = require('../index.js');

var test = module.exports = {};

test['returns the same meter object when given the same name'] = function (test) {
    test.expect(2);
    var metrics = new Quantify();
    var meter = metrics.meter("foo");
    var meter2 = metrics.meter("foo");

    test.ok(meter instanceof Meter);
    test.strictEqual(meter, meter2);

    test.done();
};

test['throws exception when creating meter without a name'] = function (test) {
    test.expect(1);
    var metrics = new Quantify();
    test.throws(function () {
        metrics.meter();
    }, Error);
    test.done();
};

test['creates a meter with initial values of 0'] = function (test) {
    test.expect(5);
    var metrics = new Quantify();
    var meter = metrics.meter("foo");

    test.equal(meter.count, 0);
    test.equal(meter.meanRate(), 0);
    test.equal(meter.oneMinuteRate(), 0);
    test.equal(meter.fiveMinuteRate(), 0);
    test.equal(meter.fifteenMinuteRate(), 0);
    test.done();
};

test['decays over two marks and ticks'] = function (test) {
    test.expect(8);
    var metrics = new Quantify();
    var meter = metrics.meter("foo");

    meter.update(5);
    setTimeout(function () {

        test.equal(meter.count, 5);
        test.equal(meter.oneMinuteRate().toFixed(4), '0.0736');
        test.equal(meter.fiveMinuteRate().toFixed(4), '0.0163');
        test.equal(meter.fifteenMinuteRate().toFixed(4), '0.0055');

        meter.update(10);
        setTimeout(function () {

            test.equal(meter.count, 15);
            test.equal(meter.oneMinuteRate().toFixed(3), '0.209');
            test.equal(meter.fiveMinuteRate().toFixed(3), '0.048');
            test.equal(meter.fifteenMinuteRate().toFixed(3), '0.016');

            test.done();
        }, 5000); // one tick interval of 5 seconds
    }, 5000); // one tick interval of 5 seconds
};
