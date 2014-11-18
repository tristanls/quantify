/*

index.js: Quantify

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

var crypto = require('crypto');
var events = require('events');
var util = require('util');

var Counter = require('./entries/counter.js');
var Gauge = require('./entries/gauge.js');
var Histogram = require('./entries/histogram.js');
var Meter = require('./entries/meter.js');
var Timer = require('./entries/timer.js');

function getTime() {
    var hrtime = process.hrtime();
    return (hrtime[0] * 1000) + (hrtime[1] / (1000000)); // to milliseconds
};

/*
  * `name`: _String_ Quantify instance name.
*/
var Quantify = module.exports = function Quantify(name) {
    var self = this;
    events.EventEmitter.call(self);

    self.name = name;
    self._counters = {};
    self._gauges = {};
    self._histograms = {};
    self._meters = {};
    self._timers = {};
};

util.inherits(Quantify, events.EventEmitter);

/*
  * `name`: _String_ Counter name.
  * Return: _Counter_ Instance of a Counter entry.
*/
Quantify.prototype.counter = function counter(name) {
    var self = this;

    if (!name) {
        throw new Error("'name' must be specified");
    }

    if (self._counters[name]) {
        return self._counters[name];
    }

    var entry = new Counter();
    self._counters[name] = entry;
    return entry;
};

/*
  * `name`: _String_ Gauge name.
  * Return: _Gauge_ Instance of a Gauge entry.
*/
Quantify.prototype.gauge = function gauge(name) {
    var self = this;

    if (!name) {
        throw new Error("'name' must be specified");
    }

    if (self._gauges[name]) {
        return self._gauges[name];
    }

    var entry = new Gauge();
    self._gauges[name] = entry;
    return entry;
};

/*
  * `filters`: _Object_ _(Default: undefined)_
    * `counters`: _RegExp_ _(Default: undefined)_ If specified, subscription
        will only return counters with names that match the RegExp.
    * `gauges`: _RegExp_ _(Default: undefined)_ If specified, subscription
        will only return gauges with names that match the RegExp.
    * `histograms`: _RegExp_ _(Default: undefined)_ If specified, subscription
        will only return histograms with names that match the RegExp.
    * `meters`: _RegExp_ _(Default: undefined)_ If specified, subscription
        will only return meters with names that match the RegExp.
    * `timers`: _RegExp_ _(Default: undefined)_ If specified, subscription
        will only return timers with names that match the RegExp.
  * Return: _Object_ Snapshot of metrics.
*/
Quantify.prototype.getMetrics = function getMetrics(filters) {
    var self = this;

    var data = {
        counters: {},
        gauges: {},
        histograms: {},
        latency: getTime(),
        meters: {},
        timers: {}
    };

    if (!filters || !(filters.counters instanceof RegExp)) {
        Object.keys(self._counters).forEach(function (key) {
            data.counters[key] = {value: self._counters[key].value};
        });
    } else {
        Object.keys(self._counters).forEach(function (key) {
            if (key.match(filters.counters)) {
                data.counters[key] = {value: self._counters[key].value};
            }
        });
    }

    if (!filters || !(filters.gauges instanceof RegExp)) {
        Object.keys(self._gauges).forEach(function (key) {
            data.gauges[key] = {value: self._gauges[key].value};
        });
    } else {
        Object.keys(self._gauges).forEach(function (key) {
            if (key.match(filters.gauges)) {
                data.gauges[key] = {value: self._gauges[key].value};
            }
        });
    }

    if (!filters || !(filters.histograms instanceof RegExp)) {
        Object.keys(self._histograms).forEach(function (key) {
            var snapshot = self._histograms[key].snapshot();
            data.histograms[key] = {
                max: snapshot.max(),
                mean: snapshot.mean(),
                median: snapshot.median(),
                min: snapshot.min(),
                percentile75: snapshot.percentile75(),
                percentile95: snapshot.percentile95(),
                percentile98: snapshot.percentile98(),
                percentile99: snapshot.percentile99(),
                percentile999: snapshot.percentile999(),
                size: snapshot.size(),
                standardDeviation: snapshot.standardDeviation()
            };
        });
    } else {
        Object.keys(self._histograms).forEach(function (key) {
            if (key.match(filters.histograms)) {
                var snapshot = self._histograms[key].snapshot();
                data.histograms[key] = {
                    max: snapshot.max(),
                    mean: snapshot.mean(),
                    median: snapshot.median(),
                    min: snapshot.min(),
                    percentile75: snapshot.percentile75(),
                    percentile95: snapshot.percentile95(),
                    percentile98: snapshot.percentile98(),
                    percentile99: snapshot.percentile99(),
                    percentile999: snapshot.percentile999(),
                    size: snapshot.size(),
                    standardDeviation: snapshot.standardDeviation()
                };
            }
        });
    }

    if (!filters || !(filters.meters instanceof RegExp)) {
        Object.keys(self._meters).forEach(function (key) {
            var meter = self._meters[key];
            data.meters[key] = {
                count: meter.count,
                meanRate: meter.meanRate(),
                oneMinuteRate: meter.oneMinuteRate(),
                fiveMinuteRate: meter.fiveMinuteRate(),
                fifteenMinuteRate: meter.fifteenMinuteRate()
            };
        });
    } else {
        Object.keys(self._meters).forEach(function (key) {
            if (key.match(filters.meters)) {
                var meter = self._meters[key];
                data.meters[key] = {
                    count: meter.count,
                    meanRate: meter.meanRate(),
                    oneMinuteRate: meter.oneMinuteRate(),
                    fiveMinuteRate: meter.fiveMinuteRate(),
                    fifteenMinuteRate: meter.fifteenMinuteRate()
                };
            }
        });
    }

    if (!filters || !(filters.timers instanceof RegExp)) {
        Object.keys(self._timers).forEach(function (key) {
            var timer = self._timers[key];
            var snapshot = timer.snapshot();
            data.timers[key] = {
                count: timer.count(),
                meanRate: timer.meanRate(),
                oneMinuteRate: timer.oneMinuteRate(),
                fiveMinuteRate: timer.fiveMinuteRate(),
                fifteenMinuteRate: timer.fifteenMinuteRate(),
                max: snapshot.max(),
                mean: snapshot.mean(),
                median: snapshot.median(),
                min: snapshot.min(),
                percentile75: snapshot.percentile75(),
                percentile95: snapshot.percentile95(),
                percentile98: snapshot.percentile98(),
                percentile99: snapshot.percentile99(),
                percentile999: snapshot.percentile999(),
                size: snapshot.size(),
                standardDeviation: snapshot.standardDeviation()
            };
        });
    } else {
        Object.keys(self._timers).forEach(function (key) {
            if (key.match(filters.timers)) {
                var timer = self._timers[key];
                var snapshot = timer.snapshot();
                data.timers[key] = {
                    count: timer.count(),
                    meanRate: timer.meanRate(),
                    oneMinuteRate: timer.oneMinuteRate(),
                    fiveMinuteRate: timer.fiveMinuteRate(),
                    fifteenMinuteRate: timer.fifteenMinuteRate(),
                    max: snapshot.max(),
                    mean: snapshot.mean(),
                    median: snapshot.median(),
                    min: snapshot.min(),
                    percentile75: snapshot.percentile75(),
                    percentile95: snapshot.percentile95(),
                    percentile98: snapshot.percentile98(),
                    percentile99: snapshot.percentile99(),
                    percentile999: snapshot.percentile999(),
                    size: snapshot.size(),
                    standardDeviation: snapshot.standardDeviation()
                };
            }
        });
    }

    data.latency = getTime() - data.latency;

    return data;
};

/*
  * `name`: _String_ Histogram name.
  * Return: _Histogram_ Instance of a Histogram entry.
*/
Quantify.prototype.histogram = function histogram(name) {
    var self = this;

    if (!name) {
        throw new Error("'name' must be specified");
    }

    if (self._histograms[name]) {
        return self._histograms[name];
    }

    var entry = new Histogram();
    self._histograms[name] = entry;
    return entry;
};

/*
  * `name`: _String_ Meter name.
  * Return: _Meter_ Instance of a Meter entry.
*/
Quantify.prototype.meter = function meter(name) {
    var self = this;

    if (!name) {
        throw new Error("'name' must be specified");
    }

    if (self._meters[name]) {
        return self._meters[name];
    }

    var entry = new Meter();
    self._meters[name] = entry;
    return entry;
};

/*
  * `name`: _String_ Timer name.
  * Return: _Timer_ Instance of a Timer entry.
*/
Quantify.prototype.timer = function timer(name) {
    var self = this;

    if (!name) {
        throw new Error("'name' must be specified");
    }

    if (self._timers[name]) {
        return self._timers[name];
    }

    var entry = new Timer();
    self._timers[name] = entry;
    return entry;
};

/*
  * `config`: _Object
    * `filters`: _Object_ _(Default: undefined)_
      * `counters`: _RegExp_ _(Default: undefined)_ If specified, subscription
          will only return counters with names that match the RegExp.
      * `gauges`: _RegExp_ _(Default: undefined)_ If specified, subscription
          will only return gauges with names that match the RegExp.
      * `histograms`: _RegExp_ _(Default: undefined)_ If specified, subscription
          will only return histograms with names that match the RegExp.
      * `meters`: _RegExp_ _(Default: undefined)_ If specified, subscription
          will only return meters with names that match the RegExp.
      * `timers`: _RegExp_ _(Default: undefined)_ If specified, subscription
          will only return timers with names that match the RegExp.
    * `label`: _String_ _(Default: undefined)_ Optional label for human readibility.
  * Return: _String_ Unique subscription name.
*/
Quantify.prototype.subscribe = function subscribe(config) {
    var self = this;

    config = config || {};
    var label = config.label;

    var filters = config.filters;

    var subscriptionName = crypto.randomBytes(4).toString('hex');
    // Ensure we have a unique subscription name.
    while (self[subscriptionName]) {
        subscriptionName = crypto.randomBytes(4).toString('hex');
    }

    // Create a unique method that when called will emit the event
    // with the specified unique name. This allows the timing concerns to be
    // delegated outside of this module and be driven by an external timing
    // mechanism.
    self[subscriptionName] = function () {
        var data = self.getMetrics(filters);

        if (label) {
            data.label = label;
        }

        process.nextTick(function () {
            self.emit(subscriptionName, data);
        });
    };

    return subscriptionName;
};

/*
  * `subscriptionName`: _String_ Name of subscription to unsubscribe.
  * Return: _Boolean_ `false` if subcription does not exist, `true` if
      successfully unsubscribed.
*/
Quantify.prototype.unsubscribe = function unsubscribe(subscriptionName) {
    var self = this;

    if (!self[subscriptionName]) {
        return false; // nothing to unsubscribe
    }

    delete self[subscriptionName];
    self.removeAllListeners(subscriptionName);

    return true; // successfully unsubscribed
};
