/*

subscribe.js - subscribe() test

The MIT License (MIT)

Copyright (c) 2014 Tristan Slominski, Leora Pearson

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

test['returns all metrics when invoked'] = function (test) {
    test.expect(79);
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

    var data = metrics.getMetrics();
    test.ok(data.counters);
    ['counter', 'gauge', 'histogram', 'meter', 'timer'].forEach(function (entry) {
        metrics[entry].FIELDS.forEach(function (field) {
            test.ok(field in data[entry + 's'].foo);
            test.ok(field in data[entry + 's'].bar);
        })
        test.equal(metrics[entry].FIELDS.length, Object.keys(data[entry + 's'].foo).length);
        test.equal(metrics[entry].FIELDS.length, Object.keys(data[entry + 's'].bar).length);
    });
    test.done();
};

test['returns the latency of preparing metrics'] = function (test) {
    test.expect(1);
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

    var data = metrics.getMetrics();
    test.ok(data.latency > 0);
    test.done();
};

test['returns metrics with counters matching counters filter'] = function (test) {
    test.expect(4);
    var metrics = new Quantify();
    metrics.counter("foo");
    metrics.counter("bar");

    var data = metrics.getMetrics({counters: /foo/});
    test.ok(data.counters);
    test.ok(!('bar' in data.counters));
    test.ok('value' in data.counters.foo);
    test.equal(metrics.counter.FIELDS.length, Object.keys(data.counters.foo).length);
    test.done();
};

test['returns metrics with counters matching gauges filter'] = function (test) {
    test.expect(4);
    var metrics = new Quantify();
    metrics.gauge("foo");
    metrics.gauge("bar");

    var data = metrics.getMetrics({gauges: /foo/});
    test.ok(data.gauges);
    test.ok(!('bar' in data.gauges));
    test.ok('value' in data.gauges.foo);
    test.equal(metrics.gauge.FIELDS.length, Object.keys(data.gauges.foo).length);
    test.done();
};

test['returns metrics with counters matching histograms filter'] = function (test) {
    test.expect(14);
    var metrics = new Quantify();
    metrics.histogram("foo");
    metrics.histogram("bar");

    var data = metrics.getMetrics({histograms: /foo/});
    test.ok(data.histograms);
    test.ok(!('bar' in data.histograms));
    metrics.histogram.FIELDS.forEach(function (field) {
        test.ok(field in data.histograms.foo);
    });
    test.equal(metrics.histogram.FIELDS.length, Object.keys(data.histograms.foo).length);
    test.done();
};

test['returns metrics with counters matching meters filter'] = function (test) {
    test.expect(8);
    var metrics = new Quantify();
    metrics.meter("foo");
    metrics.meter("bar");

    var data = metrics.getMetrics({meters: /foo/});
    test.ok(data.meters);
    test.ok(!('bar' in data.meters));
    metrics.meter.FIELDS.forEach(function (field) {
        test.ok(field in data.meters.foo);
    });
    test.equal(metrics.meter.FIELDS.length, Object.keys(data.meters.foo).length);
    test.done();
};

test['returns metrics with counters matching timers filter'] = function (test) {
    test.expect(19);
    var metrics = new Quantify();
    metrics.timer("foo");
    metrics.timer("bar");

    var data = metrics.getMetrics({timers: /foo/});
    test.ok(data.timers);
    test.ok(!('bar' in data.timers));
    metrics.timer.FIELDS.forEach(function (field) {
        test.ok(field in data.timers.foo);
    });
    test.equal(metrics.timer.FIELDS.length, Object.keys(data.timers.foo).length);
    test.done();
};
