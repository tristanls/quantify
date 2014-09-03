/*

histogram.js - Histogram test

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

var ExponentiallyDecayingReservoir = require('../reservoirs/exponentiallyDecaying.js');
var Histogram = require('../entries/histogram.js');
var Quantify = require('../index.js');
var WeightedSnapshot = require('../snapshots/weighted.js');

var test = module.exports = {};

test['returns the same histogram object when given the same name'] = function (test) {
    test.expect(2);
    var metrics = new Quantify();
    var histogram = metrics.histogram("foo");
    var histogram2 = metrics.histogram("foo");

    test.ok(histogram instanceof Histogram);
    test.strictEqual(histogram, histogram2);

    test.done();
};

test['throws exception when creating histogram without a name'] = function (test) {
    test.expect(1);
    var metrics = new Quantify();
    test.throws(function () {
        metrics.histogram();
    }, Error);
    test.done();
};

test['creates a histogram with count of 0 values'] = function (test) {
    test.expect(1);
    var metrics = new Quantify();
    var histogram = metrics.histogram("foo");

    test.equal(histogram.count(), 0);
    test.done();
};

test['creates a histogram with an ExponentiallyDecayingReservoir'] = function (test) {
    test.expect(1);
    var metrics = new Quantify();
    var histogram = metrics.histogram("foo");

    test.ok(histogram.reservoir instanceof ExponentiallyDecayingReservoir);
    test.done();
};

test['creates a histogram with a WeightedSnapshot'] = function (test) {
    test.expect(1);
    var metrics = new Quantify();
    var histogram = metrics.histogram("foo");

    test.ok(histogram.reservoir.snapshot() instanceof WeightedSnapshot);
    test.done();
};

test['update() updates the histogram'] = function (test) {
    test.expect(4);
    var metrics = new Quantify();
    var histogram = metrics.histogram("foo");

    histogram.update(17);
    var snapshot = histogram.snapshot();
    test.equal(snapshot.min(), 17);
    test.equal(snapshot.max(), 17);
    test.equal(snapshot.standardDeviation(), 0);
    test.equal(snapshot.percentile999(), 17);
    test.done();
};
