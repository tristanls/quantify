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

var Counter = require('../entries/counter.js');
var Gauge = require('../entries/gauge.js');
var Histogram = require('../entries/histogram.js');
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
    test.expect(9);
    var metrics = new Quantify();
    metrics.counter("foo");
    metrics.counter("bar");
    metrics.gauge("foo");
    metrics.gauge("bar");
    metrics.histogram("foo");
    metrics.histogram("bar");

    var subscriptionName = metrics.subscribe();
    metrics.on(subscriptionName, function (data) {
        test.ok(data.counters);
        test.ok(data.counters.foo instanceof Counter);
        test.ok(data.counters.bar instanceof Counter);
        test.ok(data.gauges);
        test.ok(data.gauges.foo instanceof Gauge);
        test.ok(data.gauges.bar instanceof Gauge);
        test.ok(data.histograms);
        test.ok(data.histograms.foo instanceof Histogram);
        test.ok(data.histograms.bar instanceof Histogram);
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
        test.ok(data.counters.foo instanceof Counter);
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
        test.ok(data.gauges.foo instanceof Gauge);
        test.done();
    });
    metrics[subscriptionName]();
};

test['emits event with histograms matching histograms filter'] = function (test) {
    test.expect(3);
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
        test.ok(data.histograms.foo instanceof Histogram);
        test.done();
    });
    metrics[subscriptionName]();
};

test['multiple subscriptions work independently'] = function (test) {
    test.expect(33);
    var metrics = new Quantify();
    metrics.counter("foo");
    metrics.counter("bar");
    metrics.gauge("foo");
    metrics.gauge("bar");
    metrics.histogram("foo");
    metrics.histogram("bar");

    var subscription1 = metrics.subscribe({filters: {counters: /foo/}});
    var subscription2 = metrics.subscribe({filters: {gauges: /bar/}});
    var subscription3 = metrics.subscribe({filters: {histograms: /bar/}});
    metrics.on(subscription1, function (data) {
        test.ok(data.counters);
        test.equal(Object.keys(data.counters).length, 1);
        test.ok(data.counters.foo instanceof Counter);
        test.ok(data.gauges);
        test.equal(Object.keys(data.gauges).length, 2);
        test.ok(data.gauges.foo instanceof Gauge);
        test.ok(data.gauges.bar instanceof Gauge);
        test.ok(data.histograms);
        test.equal(Object.keys(data.histograms).length, 2);
        test.ok(data.histograms.foo instanceof Histogram);
        test.ok(data.histograms.bar instanceof Histogram);
        metrics[subscription2]();
    });
    metrics.on(subscription2, function (data) {
        test.ok(data.counters);
        test.equal(Object.keys(data.counters).length, 2);
        test.ok(data.counters.foo instanceof Counter);
        test.ok(data.counters.bar instanceof Counter);
        test.ok(data.gauges);
        test.equal(Object.keys(data.gauges).length, 1);
        test.ok(data.gauges.bar instanceof Gauge);
        test.ok(data.histograms);
        test.equal(Object.keys(data.histograms).length, 2);
        test.ok(data.histograms.foo instanceof Histogram);
        test.ok(data.histograms.bar instanceof Histogram);
        metrics[subscription3]();
    });
    metrics.on(subscription3, function (data) {
        test.ok(data.counters);
        test.equal(Object.keys(data.counters).length, 2);
        test.ok(data.counters.foo instanceof Counter);
        test.ok(data.counters.bar instanceof Counter);
        test.ok(data.gauges);
        test.equal(Object.keys(data.gauges).length, 2);
        test.ok(data.gauges.foo instanceof Gauge);
        test.ok(data.gauges.bar instanceof Gauge);
        test.ok(data.histograms);
        test.equal(Object.keys(data.histograms).length, 1);
        test.ok(data.histograms.bar instanceof Histogram);
        test.done();
    });
    metrics[subscription1]();
};
