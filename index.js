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

function validateExists(input, message) {
    if (!input) {
        throw new Error(message);
    }
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

    self._metadata = {
        counters: {},
        gauges: {},
        histograms: {},
        meters: {},
        timers: {}
    };

    self._units = {
        counters: {},
        gauges: {},
        histograms: {},
        meters: {},
        timers: {}
    };
};

util.inherits(Quantify, events.EventEmitter);

Quantify.COUNTER_FIELDS = ['unit', 'value'];

/*
  * `name`: _String_ Counter name.
  * `unit`: _String_ What is counted.
  * `metadata`: _Object_ Optional metadata.
  * Return: _Counter_ Instance of a Counter entry.
*/
Quantify.prototype.counter = function counter(name, unit, metadata) {
    var self = this;

    if (!name) {
        throw new Error("'name' must be specified");
    }

    if (self._counters[name]) {
        return self._counters[name];
    }

    var entry = new Counter();
    self._counters[name] = entry;

    validateExists(unit, "Missing 'unit'.");
    self._units.counters[name] = unit;

    if (metadata) {
        self._metadata.counters[name] = metadata;
    }

    return entry;
};

Quantify.GAUGE_FIELDS = ['unit', 'value'];

/*
  * `name`: _String_ Gauge name.
  * `unit`: _String_ What is measured.
  * `metadata`: _Object_ Optional metadata.
  * Return: _Gauge_ Instance of a Gauge entry.
*/
Quantify.prototype.gauge = function gauge(name, unit, metadata) {
    var self = this;

    if (!name) {
        throw new Error("'name' must be specified");
    }

    if (self._gauges[name]) {
        return self._gauges[name];
    }

    var entry = new Gauge();
    self._gauges[name] = entry;

    validateExists(unit, "Missing 'unit'.");
    self._units.gauges[name] = unit;

    if (metadata) {
        self._metadata.gauges[name] = metadata;
    }

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

    filters = filters || {};

    if (!(filters.counters instanceof RegExp)) {
        filters.counters = /.*/;
    }
    Object.keys(self._counters).forEach(function (metricName) {
        if (metricName.match(filters.counters)) {
            var metric = data.counters[metricName] = {
                unit: self._units.counters[metricName],
                value: self._counters[metricName].value
            };
            if (metricName in self._metadata.counters) {
                metric.metadata = self._metadata.counters[metricName];
            }
        }
    });

    if (!(filters.gauges instanceof RegExp)) {
        filters.gauges = /.*/;
    }
    Object.keys(self._gauges).forEach(function (metricName) {
        if (metricName.match(filters.gauges)) {
            var metric = data.gauges[metricName] = {
                unit: self._units.gauges[metricName],
                value: self._gauges[metricName].value
            };
            if (metricName in self._metadata.gauges) {
                metric.metadata = self._metadata.gauges[metricName];
            }
        }
    });

    if (!(filters.histograms instanceof RegExp)) {
        filters.histograms = /.*/;
    }
    Object.keys(self._histograms).forEach(function (metricName) {
        if (metricName.match(filters.histograms)) {
            var histogram = self._histograms[metricName];
            var units = self._units.histograms[metricName];
            var snapshot = histogram.snapshot();
            var metric = data.histograms[metricName] = {
                measureUnit: units.measureUnit,
                sampleSizeUnit: units.sampleSizeUnit,
                updateCount: histogram.updateCount()
            };
            Quantify.HISTOGRAM_MEASURE_FIELDS.forEach(function (field) {
                metric[field] = snapshot[field]();
            });
            metric.sampleSize = snapshot.size();
            if (metricName in self._metadata.histograms) {
                metric.metadata = self._metadata.histograms[metricName];
            }
        }
    });

    if (!(filters.meters instanceof RegExp)) {
        filters.meters = /.*/;
    }
    Object.keys(self._meters).forEach(function (metricName) {
        if (metricName.match(filters.meters)) {
            var meter = self._meters[metricName];
            var units = self._units.meters[metricName];
            var metric = data.meters[metricName] = {
                rateUnit: units.rateUnit,
                updateCount: meter.updateCount(),
                updateCountUnit: units.updateCountUnit
            };
            Quantify.METER_RATE_FIELDS.forEach(function (field) {
                metric[field] = meter[field]();
            });
            if (metricName in self._metadata.meters) {
                metric.metadata = self._metadata.meters[metricName];
            }
        }
    });

    if (!(filters.timers instanceof RegExp)) {
        filters.timers = /.*/;
    }
    Object.keys(self._timers).forEach(function (metricName) {
        if (metricName.match(filters.timers)) {
            var timer = self._timers[metricName];
            var units = self._units.timers[metricName];
            var snapshot = timer.snapshot();
            var metric = data.timers[metricName] = {
                measureUnit: units.measureUnit,
                rateUnit: units.rateUnit,
                sampleSizeUnit: units.sampleSizeUnit,
                updateCount: timer.updateCount()
            };
            Quantify.TIMER_RATE_FIELDS.forEach(function (field) {
                metric[field] = timer[field]();
            });
            Quantify.TIMER_MEASURE_FIELDS.forEach(function (field) {
                metric[field] = snapshot[field]();
            });
            metric.sampleSize = snapshot.size();
            if (metricName in self._metadata.timers) {
               metric.metadata = self._metadata.timers[metricName];
            }
        }
    });

    data.latency = getTime() - data.latency;

    return data;
};

Quantify.HISTOGRAM_MEASURE_FIELDS = ['max', 'mean', 'median', 'min',
    'percentile75', 'percentile95', 'percentile98', 'percentile99',
    'percentile999', 'standardDeviation'];

Quantify.HISTOGRAM_FIELDS = Quantify.HISTOGRAM_MEASURE_FIELDS.concat([
    'updateCount', 'sampleSize', 'measureUnit', 'sampleSizeUnit']);

/*
  * `name`: _String_ Histogram name.
  * `units`: _Object_ Units to use.
    * `measureUnit`: _String_ What specific feature/property/aspect is being measured (ex: request latency).
    * `sampleSizeUnit`: _String_ What is being measured (ex: web request).
  * `metadata`: _Object_ Optional metadata.
  * Return: _Histogram_ Instance of a Histogram entry.
*/
Quantify.prototype.histogram = function histogram(name, units, metadata) {
    var self = this;

    if (!name) {
        throw new Error("'name' must be specified");
    }

    if (self._histograms[name]) {
        return self._histograms[name];
    }

    var entry = new Histogram();
    self._histograms[name] = entry;

    validateExists(units, "Missing 'units'.");
    validateExists(units.measureUnit, "Missing 'units.measureUnit'.");
    validateExists(units.sampleSizeUnit, "Missing 'units.sampleSizeUnit'.");
    self._units.histograms[name] = units;

    if (metadata) {
        self._metadata.histograms[name] = metadata;
    }

    return entry;
};

Quantify.METER_RATE_FIELDS = ['meanRate', 'oneMinuteRate', 'fiveMinuteRate',
    'fifteenMinuteRate'];

Quantify.METER_FIELDS = Quantify.METER_RATE_FIELDS.concat(['updateCount',
    'rateUnit', 'updateCountUnit']);

/*
  * `name`: _String_ Meter name.
  * `units`: _Object_ Units to use.
    * `rateUnit`: _String_ The rate of what is being measured per second (ex: web requests per second).
    * `updateCountUnit`: _String_ What is being measured (ex: web request).
  * `metadata`: _Object_ Optional metadata.
  * Return: _Meter_ Instance of a Meter entry.
*/
Quantify.prototype.meter = function meter(name, units, metadata) {
    var self = this;

    if (!name) {
        throw new Error("'name' must be specified");
    }

    if (self._meters[name]) {
        return self._meters[name];
    }

    var entry = new Meter();
    self._meters[name] = entry;

    validateExists(units, "Missing 'units'.");
    validateExists(units.rateUnit, "Missing 'units.rateUnit'.");
    validateExists(units.updateCountUnit, "Missing 'units.updateCountUnit'.");
    self._units.meters[name] = units;

    if (metadata) {
        self._metadata.meters[name] = metadata;
    }

    return entry;
};

Quantify.TIMER_MEASURE_FIELDS = ['max', 'mean', 'median', 'min', 'percentile75',
    'percentile95', 'percentile98', 'percentile99', 'percentile999',
    'standardDeviation'];

Quantify.TIMER_RATE_FIELDS = ['meanRate', 'oneMinuteRate', 'fiveMinuteRate',
    'fifteenMinuteRate'];

Quantify.TIMER_FIELDS =
    Quantify.TIMER_MEASURE_FIELDS.concat(
        Quantify.TIMER_RATE_FIELDS.concat(['updateCount', 'sampleSize',
            'measureUnit', 'rateUnit', 'sampleSizeUnit']));

/*
  * `name`: _String_ Timer name.
  * `unit`: _Object_ Units to use.
    * `measureUnit`: _String_ What specific feature/property/aspect is being measured (ex: request latency).
    * `rateUnit`: _String_ The rate of what is being measured per second (ex: web requests per second).
    * `sampleSizeUnit`: _String_ What is being measured (ex: web request).
  * `metadata`: _Object_ Optional metadata.
  * Return: _Timer_ Instance of a Timer entry.
*/
Quantify.prototype.timer = function timer(name, units, metadata) {
    var self = this;

    if (!name) {
        throw new Error("'name' must be specified");
    }

    if (self._timers[name]) {
        return self._timers[name];
    }

    var entry = new Timer();
    self._timers[name] = entry;

    validateExists(units, "Missing 'units'.");
    validateExists(units.measureUnit, "Missing 'units.measureUnit'.");
    validateExists(units.rateUnit, "Missing 'units.rateUnit'.");
    validateExists(units.sampleSizeUnit, "Missing 'units.sampleSizeUnit'.");
    self._units.timers[name] = units;

    if (metadata) {
        self._metadata.timers[name] = metadata;
    }

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
