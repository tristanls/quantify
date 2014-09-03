/*

weightedSnapshot.js - WeightedSnapshot test

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

var WeightedSnapshot = require('../snapshots/weighted.js');

var test = module.exports = {};

var WEIGHTED_ARRAY;

test.setUp = function (callback) {
    WEIGHTED_ARRAY = [];
    WEIGHTED_ARRAY[0] = {value: 5, weight: 1};
    WEIGHTED_ARRAY[1] = {value: 1, weight: 2};
    WEIGHTED_ARRAY[2] = {value: 2, weight: 3};
    WEIGHTED_ARRAY[3] = {value: 3, weight: 2};
    WEIGHTED_ARRAY[4] = {value: 4, weight: 2};
    callback();
};

test['small quantiles are first values'] = function (test) {
    test.expect(2);

    var snapshot = new WeightedSnapshot(WEIGHTED_ARRAY);
    // within 0.1
    test.ok(snapshot.quantile(0.0) < 1.1);
    test.ok(snapshot.quantile(0.0) > 0.9);

    test.done();
};

test['big quantiles are the last value'] = function (test) {
    test.expect(2);

    var snapshot = new WeightedSnapshot(WEIGHTED_ARRAY);
    // within 0.1
    test.ok(snapshot.quantile(1.0) < 5.1);
    test.ok(snapshot.quantile(1.0) > 4.9);

    test.done();
};

test['has median'] = function (test) {
    test.expect(2);

    var snapshot = new WeightedSnapshot(WEIGHTED_ARRAY);
    // within 0.1
    test.ok(snapshot.median() < 3.1);
    test.ok(snapshot.median() > 2.9);

    test.done();
};

test['has percentile75'] = function (test) {
    test.expect(2);

    var snapshot = new WeightedSnapshot(WEIGHTED_ARRAY);
    // within 0.1
    test.ok(snapshot.percentile75() < 4.1);
    test.ok(snapshot.percentile75() > 3.9);

    test.done();
};

test['has percentile95'] = function (test) {
    test.expect(2);

    var snapshot = new WeightedSnapshot(WEIGHTED_ARRAY);
    // within 0.1
    test.ok(snapshot.percentile95() < 5.1);
    test.ok(snapshot.percentile95() > 4.9);

    test.done();
};

test['has percentile98'] = function (test) {
    test.expect(2);

    var snapshot = new WeightedSnapshot(WEIGHTED_ARRAY);
    // within 0.1
    test.ok(snapshot.percentile98() < 5.1);
    test.ok(snapshot.percentile98() > 4.9);

    test.done();
};

test['has percentile99'] = function (test) {
    test.expect(2);

    var snapshot = new WeightedSnapshot(WEIGHTED_ARRAY);
    // within 0.1
    test.ok(snapshot.percentile99() < 5.1);
    test.ok(snapshot.percentile99() > 4.9);

    test.done();
};

test['has percentile999'] = function (test) {
    test.expect(2);

    var snapshot = new WeightedSnapshot(WEIGHTED_ARRAY);
    // within 0.1
    test.ok(snapshot.percentile999() < 5.1);
    test.ok(snapshot.percentile999() > 4.9);

    test.done();
};

test['has values'] = function (test) {
    test.expect(1);

    var snapshot = new WeightedSnapshot(WEIGHTED_ARRAY);

    test.deepEqual(snapshot.values, [1, 2, 3, 4, 5]);

    test.done();
};

test['has size'] = function (test) {
    test.expect(1);

    var snapshot = new WeightedSnapshot(WEIGHTED_ARRAY);

    test.equal(snapshot.size(), 5);

    test.done();
};

test['calculates the minimum value'] = function (test) {
    test.expect(1);

    var snapshot = new WeightedSnapshot(WEIGHTED_ARRAY);

    test.equal(snapshot.min(), 1);

    test.done();
};

test['calculates the maximum value'] = function (test) {
    test.expect(1);

    var snapshot = new WeightedSnapshot(WEIGHTED_ARRAY);

    test.equal(snapshot.max(), 5);

    test.done();
};

test['calculates the mean'] = function (test) {
    test.expect(1);

    var snapshot = new WeightedSnapshot(WEIGHTED_ARRAY);

    test.equal(snapshot.mean(), 2.7);

    test.done();
};

test['calculates the standard deviation'] = function (test) {
    test.expect(2);

    var snapshot = new WeightedSnapshot(WEIGHTED_ARRAY);
    // within 0.0001
    test.ok(snapshot.standardDeviation() < 1.2689);
    test.ok(snapshot.standardDeviation() > 1.2687);

    test.done();
};

test['calculates a minimum of 0 for an empty snapshot'] = function (test) {
    test.expect(1);

    var snapshot = new WeightedSnapshot([]);

    test.equal(snapshot.min(), 0);

    test.done();
};

test['calculates a max of 0 for an empty snapshot'] = function (test) {
    test.expect(1);

    var snapshot = new WeightedSnapshot([]);

    test.equal(snapshot.max(), 0);

    test.done();
};

test['calculates a mean of 0 for an empty snapshot'] = function (test) {
    test.expect(1);

    var snapshot = new WeightedSnapshot([]);

    test.equal(snapshot.mean(), 0);

    test.done();
};

test['calculates a standard deviation of 0 for an empty snapshot'] = function (test) {
    test.expect(1);

    var snapshot = new WeightedSnapshot([]);

    test.equal(snapshot.standardDeviation(), 0);

    test.done();
};

test['calculates a standard deviation of 0 for a singleton snapshot'] = function (test) {
    test.expect(1);

    var snapshot = new WeightedSnapshot([{value: 1, weight: 1}]);

    test.equal(snapshot.standardDeviation(), 0);

    test.done();
};

test['expect no overflow for low weights'] = function (test) {
    test.expect(1);

    var snapshot = new WeightedSnapshot([
            {value: 1, weight: Number.MIN_VALUE},
            {value: 2, weight: Number.MIN_VALUE},
            {value: 3, weight: Number.MIN_VALUE}
        ]);

    test.equal(snapshot.mean(), 2);

    test.done();
};
