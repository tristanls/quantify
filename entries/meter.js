/*

meter.js: Meter

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

var ExponentiallyMovingWeightedAverage = require('../util/exponentiallyMovingWeightedAverage.js');

function getTime() {
    var hrtime = process.hrtime();
    return (hrtime[0] * 1000) + (hrtime[1] / (1000000)); // to milliseconds
};

var Meter = module.exports = function Meter(config) {
    var self = this;

    config = config || {};

    self.rateUnit = config.rateUnit || 1000; // 1 second
    self.tickInterval = config.tickInterval || 5000; // 5 seconds

    self.startTime = getTime();
    self.lastTick = self.startTime;
    self._count = 0;

    self.m1rate = new ExponentiallyMovingWeightedAverage({
        timePeriod: 1000 * 60, // 1 minute
        tickInterval: self.tickInterval
    });
    self.m5rate = new ExponentiallyMovingWeightedAverage({
        timePeriod: 1000 * 60 * 5, // 5 minutes
        tickInterval: self.tickInterval
    });
    self.m15rate = new ExponentiallyMovingWeightedAverage({
        timePeriod: 1000 * 60 * 15, // 15 minutes
        tickInterval: self.tickInterval
    });
};

Meter.prototype.count = function count() {
    var self = this;

    return self._count;
};

Meter.prototype.meanRate = function meanRate() {
    var self = this;

    if (self._count == 0) {
        return 0;
    } else {
        var elapsed = getTime() - self.startTime;
        return (self._count / elapsed) * 1000 /* per second */;
    }
};

Meter.prototype.oneMinuteRate = function oneMinuteRate() {
    var self = this;

    self.tickIfNecessary();
    return self.m1rate.rate() * 1000 /* per second */;
};

Meter.prototype.fiveMinuteRate = function fiveMinuteRate() {
    var self = this;

    self.tickIfNecessary();
    return self.m5rate.rate() * 1000 /* per second */;
};

Meter.prototype.fifteenMinuteRate = function fifteenMinuteRate() {
    var self = this;

    self.tickIfNecessary();
    return self.m15rate.rate() * 1000 /* per second */;
};

Meter.prototype.tickIfNecessary = function tickIfNecessary() {
    var self = this;

    var oldTick = self.lastTick;
    var newTick = getTime();
    var age = newTick - oldTick;
    if (age > self.tickInterval) {
        var newIntervalStartTick = newTick - age % self.tickInterval;
        self.lastTick = newIntervalStartTick;
        var requiredTicks = age / self.tickInterval;
        for (var i = 0; i < requiredTicks; i++) {
            self.m1rate.tick();
            self.m5rate.tick();
            self.m15rate.tick();
        }
    }
};

Meter.prototype.update = function update(n) {
    var self = this;

    n = n || 1;
    self.tickIfNecessary();
    self._count += n;
    self.m1rate.update(n);
    self.m5rate.update(n);
    self.m15rate.update(n);
};
