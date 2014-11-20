/*

timer.js - Timer test

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

var Timer = require('../entries/timer.js');
var Quantify = require('../index.js');

var test = module.exports = {};

test['returns the same timer object when given the same name'] = function (test) {
    test.expect(2);
    var metrics = new Quantify();
    var timer = metrics.timer("foo");
    var timer2 = metrics.timer("foo");

    test.ok(timer instanceof Timer);
    test.strictEqual(timer, timer2);

    test.done();
};

test['throws exception when creating timer without a name'] = function (test) {
    test.expect(1);
    var metrics = new Quantify();
    test.throws(function () {
        metrics.timer();
    }, Error);
    test.done();
};

test['creates a timer with count of 0 values'] = function (test) {
    test.expect(1);
    var metrics = new Quantify();
    var timer = metrics.timer("foo");

    test.equal(timer.updateCount(), 0);
    test.done();
};

test['update() updates the timer'] = function (test) {
    test.expect(4);
    var metrics = new Quantify();
    var timer = metrics.timer("foo");

    timer.update(17);
    var snapshot = timer.snapshot();
    test.equal(snapshot.min(), 17);
    test.equal(snapshot.max(), 17);
    test.equal(snapshot.standardDeviation(), 0);
    test.equal(snapshot.percentile999(), 17);
    test.done();
};

test['start() creates a stopwatch'] = function (test) {
    test.expect(5);
    var metrics = new Quantify();
    var timer = metrics.timer("foo");

    var stopwatch = timer.start();
    setTimeout(function () {
        stopwatch.stop();
        var snapshot = timer.snapshot();
        test.equal(timer.updateCount(), 1);
        test.ok(snapshot.min() < 200 && snapshot.min() > 0);
        test.ok(snapshot.max() < 200 && snapshot.max() > 0);
        test.equal(snapshot.standardDeviation(), 0);
        test.ok(snapshot.percentile999() < 200 && snapshot.percentile999() > 0);
        test.done();
    }, 100);
};
