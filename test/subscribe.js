/*

subscribe.js - subscribe() test

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

var Quantify = require('../index.js');

var test = module.exports = {};

test['emits event with subscription name when subscription name method is invoked'] = function (test) {
    test.expect(1);
    var metrics = new Quantify();

    var subscriptionName = metrics.subscribe();
    metrics.on(subscriptionName, function () {
        test.ok(true);
        test.done();
    });
    metrics[subscriptionName]();
};

test['emits event with all metrics when subscription name method is invoked'] = function (test) {
    test.expect(15);
    var metrics = new Quantify();
    metrics.counter("foo");
    metrics.counter("bar");
    metrics.gauge("foo");
    metrics.gauge("bar");
    metrics.histogram("foo");
    metrics.histogram("bar");
    metrics.meter("foo");
    metrics.meter("bar");
    metrics.timer("foo");
    metrics.timer("bar");

    var subscriptionName = metrics.subscribe();
    metrics.on(subscriptionName, function (data) {
        test.ok(data.counters);
        test.equal(data.counters.foo.value, 0);
        test.equal(data.counters.bar.value, 0);
        test.ok(data.gauges);
        test.equal(data.gauges.foo.value, 0);
        test.equal(data.gauges.bar.value, 0);
        test.ok(data.histograms);
        test.equal(data.histograms.foo.size, 0);
        test.equal(data.histograms.bar.size, 0);
        test.ok(data.meters);
        test.equal(data.meters.foo.count, 0);
        test.equal(data.meters.bar.count, 0);
        test.ok(data.timers);
        test.equal(data.timers.foo.count, 0);
        test.equal(data.timers.bar.count, 0);
        test.done();
    });
    metrics[subscriptionName]();
};

test['emits event with counters matching counters filter'] = function (test) {
    test.expect(3);
    var metrics = new Quantify();
    metrics.counter("foo");
    metrics.counter("bar");

    var subscriptionName = metrics.subscribe({
        filters: {
            counters: /foo/
        }
    });
    metrics.on(subscriptionName, function (data) {
        test.ok(data.counters);
        test.equal(Object.keys(data.counters).length, 1);
        test.equal(data.counters.foo.value, 0);
        test.done();
    });
    metrics[subscriptionName]();
};

test['emits event with gauges matching gauges filter'] = function (test) {
    test.expect(3);
    var metrics = new Quantify();
    metrics.gauge("foo");
    metrics.gauge("bar");

    var subscriptionName = metrics.subscribe({
        filters: {
            gauges: /foo/
        }
    });
    metrics.on(subscriptionName, function (data) {
        test.ok(data.gauges);
        test.equal(Object.keys(data.gauges).length, 1);
        test.equal(data.gauges.foo.value, 0);
        test.done();
    });
    metrics[subscriptionName]();
};

test['emits event with histograms matching histograms filter'] = function (test) {
    test.expect(13);
    var metrics = new Quantify();
    metrics.histogram("foo");
    metrics.histogram("bar");

    var subscriptionName = metrics.subscribe({
        filters: {
            histograms: /foo/
        }
    });
    metrics.on(subscriptionName, function (data) {
        test.ok(data.histograms);
        test.equal(Object.keys(data.histograms).length, 1);
        test.equal(data.histograms.foo.max, 0);
        test.equal(data.histograms.foo.mean, 0);
        test.equal(data.histograms.foo.median, 0);
        test.equal(data.histograms.foo.min, 0);
        test.equal(data.histograms.foo.percentile75, 0);
        test.equal(data.histograms.foo.percentile95, 0);
        test.equal(data.histograms.foo.percentile98, 0);
        test.equal(data.histograms.foo.percentile99, 0);
        test.equal(data.histograms.foo.percentile999, 0);
        test.equal(data.histograms.foo.size, 0);
        test.equal(data.histograms.foo.standardDeviation, 0);
        test.done();
    });
    metrics[subscriptionName]();
};

test['emits event with meters matching meters filter'] = function (test) {
    test.expect(7);
    var metrics = new Quantify();
    metrics.meter("foo");
    metrics.meter("bar");

    var subscriptionName = metrics.subscribe({
        filters: {
            meters: /foo/
        }
    });
    metrics.on(subscriptionName, function (data) {
        test.ok(data.meters);
        test.equal(Object.keys(data.meters).length, 1);
        test.equal(data.meters.foo.count, 0);
        test.equal(data.meters.foo.meanRate, 0);
        test.equal(data.meters.foo.oneMinuteRate, 0);
        test.equal(data.meters.foo.fiveMinuteRate, 0);
        test.equal(data.meters.foo.fifteenMinuteRate, 0);
        test.done();
    });
    metrics[subscriptionName]();
};

test['emits event with timers matching timers filter'] = function (test) {
    test.expect(18);
    var metrics = new Quantify();
    metrics.timer("foo");
    metrics.timer("bar");

    var subscriptionName = metrics.subscribe({
        filters: {
            timers: /foo/
        }
    });
    metrics.on(subscriptionName, function (data) {
        test.ok(data.timers);
        test.equal(Object.keys(data.timers).length, 1);
        test.equal(data.timers.foo.count, 0);
        test.equal(data.timers.foo.meanRate, 0);
        test.equal(data.timers.foo.oneMinuteRate, 0);
        test.equal(data.timers.foo.fiveMinuteRate, 0);
        test.equal(data.timers.foo.fifteenMinuteRate, 0);
        test.equal(data.timers.foo.max, 0);
        test.equal(data.timers.foo.mean, 0);
        test.equal(data.timers.foo.median, 0);
        test.equal(data.timers.foo.min, 0);
        test.equal(data.timers.foo.percentile75, 0);
        test.equal(data.timers.foo.percentile95, 0);
        test.equal(data.timers.foo.percentile98, 0);
        test.equal(data.timers.foo.percentile99, 0);
        test.equal(data.timers.foo.percentile999, 0);
        test.equal(data.timers.foo.size, 0);
        test.equal(data.timers.foo.standardDeviation, 0);
        test.done();
    });
    metrics[subscriptionName]();
};

test['multiple subscriptions work independently'] = function (test) {
    test.expect(85);
    var metrics = new Quantify();
    metrics.counter("foo");
    metrics.counter("bar");
    metrics.gauge("foo");
    metrics.gauge("bar");
    metrics.histogram("foo");
    metrics.histogram("bar");
    metrics.meter("foo");
    metrics.meter("bar");
    metrics.timer("foo");
    metrics.timer("bar");

    var subscription1 = metrics.subscribe({filters: {counters: /foo/}});
    var subscription2 = metrics.subscribe({filters: {gauges: /bar/}});
    var subscription3 = metrics.subscribe({filters: {histograms: /bar/}});
    var subscription4 = metrics.subscribe({filters: {meters: /bar/}});
    var subscription5 = metrics.subscribe({filters: {timers: /bar/}});
    metrics.on(subscription1, function (data) {
        test.ok(data.counters);
        test.equal(Object.keys(data.counters).length, 1);
        test.equal(data.counters.foo.value, 0);
        test.ok(data.gauges);
        test.equal(Object.keys(data.gauges).length, 2);
        test.equal(data.gauges.foo.value, 0);
        test.equal(data.gauges.bar.value, 0);
        test.ok(data.histograms);
        test.equal(Object.keys(data.histograms).length, 2);
        test.equal(data.histograms.foo.size, 0);
        test.equal(data.histograms.bar.size, 0);
        test.equal(Object.keys(data.meters).length, 2);
        test.equal(data.meters.foo.count, 0);
        test.equal(data.meters.bar.count, 0);
        test.ok(Object.keys(data.timers).length, 2);
        test.equal(data.timers.foo.count, 0);
        test.equal(data.timers.bar.count, 0);
        metrics[subscription2]();
    });
    metrics.on(subscription2, function (data) {
        test.ok(data.counters);
        test.equal(Object.keys(data.counters).length, 2);
        test.equal(data.counters.foo.value, 0);
        test.equal(data.counters.bar.value, 0);
        test.ok(data.gauges);
        test.equal(Object.keys(data.gauges).length, 1);
        test.equal(data.gauges.bar.value, 0);
        test.ok(data.histograms);
        test.equal(Object.keys(data.histograms).length, 2);
        test.equal(data.histograms.foo.size, 0);
        test.equal(data.histograms.bar.size, 0);
        test.equal(Object.keys(data.meters).length, 2);
        test.equal(data.meters.foo.count, 0);
        test.equal(data.meters.bar.count, 0);
        test.ok(Object.keys(data.timers).length, 2);
        test.equal(data.timers.foo.count, 0);
        test.equal(data.timers.bar.count, 0);
        metrics[subscription3]();
    });
    metrics.on(subscription3, function (data) {
        test.ok(data.counters);
        test.equal(Object.keys(data.counters).length, 2);
        test.equal(data.counters.foo.value, 0);
        test.equal(data.counters.bar.value, 0);
        test.ok(data.gauges);
        test.equal(Object.keys(data.gauges).length, 2);
        test.equal(data.gauges.foo.value, 0);
        test.equal(data.gauges.bar.value, 0);
        test.ok(data.histograms);
        test.equal(Object.keys(data.histograms).length, 1);
        test.equal(data.histograms.bar.size, 0);
        test.equal(Object.keys(data.meters).length, 2);
        test.equal(data.meters.foo.count, 0);
        test.equal(data.meters.bar.count, 0);
        test.ok(Object.keys(data.timers).length, 2);
        test.equal(data.timers.foo.count, 0);
        test.equal(data.timers.bar.count, 0);
        metrics[subscription4]();
    });
    metrics.on(subscription4, function (data) {
        test.ok(data.counters);
        test.equal(Object.keys(data.counters).length, 2);
        test.equal(data.counters.foo.value, 0);
        test.equal(data.counters.bar.value, 0);
        test.ok(data.gauges);
        test.equal(Object.keys(data.gauges).length, 2);
        test.equal(data.gauges.foo.value, 0);
        test.equal(data.gauges.bar.value, 0);
        test.ok(data.histograms);
        test.equal(Object.keys(data.histograms).length, 2);
        test.equal(data.histograms.foo.size, 0);
        test.equal(data.histograms.bar.size, 0);
        test.equal(Object.keys(data.meters).length, 1);
        test.equal(data.meters.bar.count, 0);
        test.ok(Object.keys(data.timers).length, 2);
        test.equal(data.timers.foo.count, 0);
        test.equal(data.timers.bar.count, 0);
        metrics[subscription5]();
    });
    metrics.on(subscription5, function (data) {
        test.ok(data.counters);
        test.equal(Object.keys(data.counters).length, 2);
        test.equal(data.counters.foo.value, 0);
        test.equal(data.counters.bar.value, 0);
        test.ok(data.gauges);
        test.equal(Object.keys(data.gauges).length, 2);
        test.equal(data.gauges.foo.value, 0);
        test.equal(data.gauges.bar.value, 0);
        test.ok(data.histograms);
        test.equal(Object.keys(data.histograms).length, 2);
        test.equal(data.histograms.foo.size, 0);
        test.equal(data.histograms.bar.size, 0);
        test.equal(Object.keys(data.meters).length, 2);
        test.equal(data.meters.foo.count, 0);
        test.equal(data.meters.bar.count, 0);
        test.ok(Object.keys(data.timers).length, 1);
        test.equal(data.timers.bar.count, 0);
        test.done();
    });
    metrics[subscription1]();
};
