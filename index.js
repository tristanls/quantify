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

    self._metadata = {
        counters: {},
        gauges: {},
        histograms: {},
        meters: {},
        timers: {}
    };
};

util.inherits(Quantify, events.EventEmitter);

Quantify.COUNTER_FIELDS = ['value'];

/*
  * `name`: _String_ Counter name.
  * `metadata`: _Object_ Optional metadata.
  * Return: _Counter_ Instance of a Counter entry.
*/
Quantify.prototype.counter = function counter(name, metadata) {
    var self = this;

    if (!name) {
        throw new Error("'name' must be specified");
    }

    if (self._counters[name]) {
        return self._counters[name];
    }

    var entry = new Counter();
    if (metadata) {
        self._metadata.counters[name] = metadata;
    }
    self._counters[name] = entry;
    return entry;
};

Quantify.GAUGE_FIELDS = ['value'];

/*
  * `name`: _String_ Gauge name.
  * `metadata`: _Object_ Optional metadata.
  * Return: _Gauge_ Instance of a Gauge entry.
*/
Quantify.prototype.gauge = function gauge(name, metadata) {
    var self = this;

    if (!name) {
        throw new Error("'name' must be specified");
    }

    if (self._gauges[name]) {
        return self._gauges[name];
    }

    var entry = new Gauge();
    if (metadata) {
        self._metadata.gauges[name] = metadata;
    }
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

    filters = filters || {};

    if (!(filters.counters instanceof RegExp)) {
        filters.counters = /.*/;
    }
    Object.keys(self._counters).forEach(function (metricName) {
        if (metricName.match(filters.counters)) {
            var metric = data.counters[metricName] = {value: self._counters[metricName].value};
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
            var metric = data.gauges[metricName] = {value: self._gauges[metricName].value};
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
            var snapshot = histogram.snapshot();
            var metric = data.histograms[metricName] = {
                count: histogram.count()
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
            var metric = data.meters[metricName] = {};
            Quantify.METER_FIELDS.forEach(function (field) {
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
            var snapshot = timer.snapshot();
            var metric = data.timers[metricName] = {
                count: timer.count()
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
    'count', 'sampleSize']);

/*
  * `name`: _String_ Histogram name.
  * `metadata`: _Object_ Optional metadata.
  * Return: _Histogram_ Instance of a Histogram entry.
*/
Quantify.prototype.histogram = function histogram(name, metadata) {
    var self = this;

    if (!name) {
        throw new Error("'name' must be specified");
    }

    if (self._histograms[name]) {
        return self._histograms[name];
    }

    var entry = new Histogram();
    if (metadata) {
        self._metadata.histograms[name] = metadata;
    }
    self._histograms[name] = entry;
    return entry;
};

Quantify.METER_RATE_FIELDS = ['meanRate', 'oneMinuteRate', 'fiveMinuteRate',
    'fifteenMinuteRate'];

Quantify.METER_FIELDS = Quantify.METER_RATE_FIELDS.concat(['count']);

/*
  * `name`: _String_ Meter name.
  * `metadata`: _Object_ Optional metadata.
  * Return: _Meter_ Instance of a Meter entry.
*/
Quantify.prototype.meter = function meter(name, metadata) {
    var self = this;

    if (!name) {
        throw new Error("'name' must be specified");
    }

    if (self._meters[name]) {
        return self._meters[name];
    }

    var entry = new Meter();
    if (metadata) {
        self._metadata.meters[name] = metadata;
    }
    self._meters[name] = entry;
    return entry;
};

Quantify.TIMER_MEASURE_FIELDS = ['max', 'mean', 'median', 'min', 'percentile75',
    'percentile95', 'percentile98', 'percentile99', 'percentile999',
    'standardDeviation'];

Quantify.TIMER_RATE_FIELDS = ['meanRate', 'oneMinuteRate', 'fiveMinuteRate',
    'fifteenMinuteRate'];

Quantify.TIMER_FIELDS =
    Quantify.TIMER_MEASURE_FIELDS.concat(
        Quantify.TIMER_RATE_FIELDS.concat(['count', 'sampleSize']));

/*
  * `name`: _String_ Timer name.
  * `metadata`: _Object_ Optional metadata.
  * Return: _Timer_ Instance of a Timer entry.
*/
Quantify.prototype.timer = function timer(name, metadata) {
    var self = this;

    if (!name) {
        throw new Error("'name' must be specified");
    }

    if (self._timers[name]) {
        return self._timers[name];
    }

    var entry = new Timer();
    if (metadata) {
        self._metadata.timers[name] = metadata;
    }
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
