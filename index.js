/*

index.js: Quantify

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

var crypto = require('crypto');
var events = require('events');
var util = require('util');

var Counter = require('./entries/counter.js');
var Gauge = require('./entries/gauge.js');
var Histogram = require('./entries/histogram.js');

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
  * `config`: _Object
    * `filters`: _Object_ _(Default: undefined)_
      * `counters`: _RegExp_ _(Default: undefined)_ If specified, subscription
          will only return counters with names that match the RegExp.
      * `gauges`: _RegExp_ _(Default: undefined)_ If specified, subscription
          will only return gauges with names that match the RegExp.
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
        var data = {};

        if (label) {
            data.label = label;
        }

        // short-circuit filters if none specified
        if (!filters) {
            data.counters = self._counters;
            data.gauges = self._gauges;
            data.histograms = self._histograms;
            process.nextTick(function () {
                self.emit(subscriptionName, data);
            })

            return;
        }

        if (!(filters.counters instanceof RegExp)) {
            data.counters = self._counters;
        } else {
            data.counters = {};
            Object.keys(self._counters).forEach(function (counter) {
                if (counter.match(filters.counters)) {
                    data.counters[counter] = self._counters[counter];
                }
            });
        }

        if (!(filters.gauges instanceof RegExp)) {
            data.gauges = self._gauges;
        } else {
            data.gauges = {};
            Object.keys(self._gauges).forEach(function (gauge) {
                if (gauge.match(filters.gauges)) {
                    data.gauges[gauge] = self._gauges[gauge];
                }
            });
        }

        if (!(filters.histograms instanceof RegExp)) {
            data.histograms = self._histograms;
        } else {
            data.histograms = {};
            Object.keys(self._histograms).forEach(function (histogram) {
                if (histogram.match(filters.histograms)) {
                    data.histograms[histogram] = self._histograms[histogram];
                }
            });
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
