/*

exponentiallyDecayingReservoir.js - ExponentiallyDecayingReservoir test

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

var sinon = require('sinon');

var ExponentiallyDecayingReservoir = require('../reservoirs/exponentiallyDecaying.js');

var test = module.exports = {};

test['size of 100 updated with 1000 elements has 100 elements within min and max'] = function (test) {
    test.expect(202);

    var reservoir = new ExponentiallyDecayingReservoir({size: 100, alpha: 0.99});
    for (var i = 0; i < 1000; i++) {
        reservoir.update(i);
    }

    test.equal(reservoir.size(), 100);

    var snapshot = reservoir.snapshot();

    test.equal(snapshot.size(), 100);

    // 200 assertions
    snapshot.values.forEach(function (value) {
        test.ok(value < 1000);
        test.ok(value >= 0);
    });

    test.done();
};

test['size of 100 updated with 10 elements has 10 elements within min and max'] = function (test) {
    test.expect(22);

    var reservoir = new ExponentiallyDecayingReservoir({size: 100, alpha: 0.99});
    for (var i = 0; i < 10; i++) {
        reservoir.update(i);
    }

    test.equal(reservoir.size(), 10);

    var snapshot = reservoir.snapshot();

    test.equal(snapshot.size(), 10);

    // 20 assertions
    snapshot.values.forEach(function (value) {
        test.ok(value < 10);
        test.ok(value >= 0);
    });

    test.done();
};

test['heavily biased with size of 1000 updated with 100 elements has 100 elements within min and max'] = function (test) {
    test.expect(202);

    var reservoir = new ExponentiallyDecayingReservoir({size: 1000, alpha: 0.01});
    for (var i = 0; i < 100; i++) {
        reservoir.update(i);
    }

    test.equal(reservoir.size(), 100);

    var snapshot = reservoir.snapshot();

    test.equal(snapshot.size(), 100);

    // 200 assertions
    snapshot.values.forEach(function (value) {
        test.ok(value < 100);
        test.ok(value >= 0);
    });

    test.done();
};

test['long periods of inactivity should not corrupt sampling state'] = function (test) {
    test.expect(47);

    var clock = sinon.useFakeTimers();
    var reservoir = new ExponentiallyDecayingReservoir({size: 10, alpha: 0.015});

    // Add 1000 values at a rate of 10 values per second.
    for (var i = 0; i < 1000; i++) {
        reservoir.update(1000 + i);
        clock.tick(100);
    }

    var snapshot = reservoir.snapshot();
    test.equal(snapshot.size(), 10);
    // 20 assertions
    snapshot.values.forEach(function (value) {
        test.ok(value < 2000);
        test.ok(value >= 1000);
    });

    // Wait for 15 hours and add another value.
    // This should trigger a rescale. Note that the number of samples will be
    // reduced to 2 because of the very small scaling factor will make all
    // existing priorities equal to zero after rescale.
    clock.tick(1000 * 60 * 60 * 15);
    reservoir.update(2000);

    snapshot = reservoir.snapshot();
    test.equal(snapshot.size(), 2);
    // 4 assertions
    snapshot.values.forEach(function (value) {
        test.ok(value < 2001);
        test.ok(value >= 1000);
    });

    // Add 1000 values at a rate of 10 values per second.
    for (var i = 0; i < 1000; i++) {
        reservoir.update(3000 + i);
        clock.tick(100);
    }

    snapshot = reservoir.snapshot();
    test.equal(snapshot.size(), 10);
    // 20 assertions
    snapshot.values.forEach(function (value) {
        test.ok(value < 4000);
        test.ok(value >= 3000);
    });

    clock.restore();
    test.done();
};

test['spot lift should occur relatively quickly'] = function (test) {
    test.expect(1);

    var clock = sinon.useFakeTimers();
    var reservoir = new ExponentiallyDecayingReservoir({size: 1000, alpha: 0.015});

    // Mode 1: steady regime for 120 minutes
    var valuesRatePerMinute = 10;
    var valuesIntervalMillis = parseInt(1000 * 60 / valuesRatePerMinute);
    for (var i = 0; i < (120 * valuesRatePerMinute); i++) {
        reservoir.update(177);
        clock.tick(valuesIntervalMillis);
    }

    // Switching to mode 2: 10 minutes more with same rate but larger value
    for (var i = 0; i < (10 * valuesRatePerMinute); i++) {
        reservoir.update(9999);
        clock.tick(valuesIntervalMillis);
    }

    // Expect that quantiles should be more about mode 2 after 10 minutes
    test.equal(reservoir.snapshot().median(), 9999);

    clock.restore();
    test.done();
};

test['spot fall should occur relatively quickly'] = function (test) {
    test.expect(1);

    var clock = sinon.useFakeTimers();
    var reservoir = new ExponentiallyDecayingReservoir({size: 1000, alpha: 0.015});

    // Mode 1: steady regime for 120 minutes
    var valuesRatePerMinute = 10;
    var valuesIntervalMillis = parseInt(1000 * 60 / valuesRatePerMinute);
    for (var i = 0; i < (120 * valuesRatePerMinute); i++) {
        reservoir.update(9998);
        clock.tick(valuesIntervalMillis);
    }

    // Switching to mode 2: 10 minutes more with same rate but smaller value
    for (var i = 0; i < (10 * valuesRatePerMinute); i++) {
        reservoir.update(178);
        clock.tick(valuesIntervalMillis);
    }

    // Expect that quantiles should be more about mode 2 after 10 minutes
    test.equal(reservoir.snapshot().percentile95(), 178);

    clock.restore();
    test.done();
};

test['quantiles should be based on weights'] = function (test) {
    test.expect(3);

    var clock = sinon.useFakeTimers();
    var reservoir = new ExponentiallyDecayingReservoir({size: 1000, alpha: 0.015});

    for (var i = 0; i < 40; i++) {
        reservoir.update(177);
    }

    clock.tick(1000 * 120);

    for (var i = 0; i < 10; i++) {
        reservoir.update(9999);
    }

    var snapshot = reservoir.snapshot();

    test.equal(snapshot.size(), 50);

    // the first added 40 items (177) have weights 1
    // the next added 10 items (9999) have weights ~6
    // so, it's 40 vs 60 distribution, not 40 vs 10

    // The first 40 items (177) have weights of 1.
    // The next 10 items (9999) have weights of ~6
    // So, it is 40 vs 60 distribution, not 40 vs 10
    test.equal(snapshot.median(), 9999);
    test.equal(snapshot.percentile75(), 9999);

    clock.restore();
    test.done();
};
