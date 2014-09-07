/*

timer.js: Timer

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

var Histogram = require('./histogram.js');
var Meter = require('./meter.js');

function getTime() {
    var hrtime = process.hrtime();
    return (hrtime[0] * 1000) + (hrtime[1] / (1000000)); // to milliseconds
};

var Timer = module.exports = function Timer() {
    var self = this;

    self.meter = new Meter();
    self.histogram = new Histogram();
};

Timer.prototype.count = function count() {
    var self = this;

    return self.meter.count;
};

Timer.prototype.fifteenMinuteRate = function fifteenMinuteRate() {
    var self = this;

    return self.meter.fifteenMinuteRate();
};

Timer.prototype.fiveMinuteRate = function fiveMinuteRate() {
    var self = this;

    return self.meter.fiveMinuteRate();
};

Timer.prototype.meanRate = function meanRate() {
    var self = this;

    return self.meter.meanRate();
};

Timer.prototype.oneMinuteRate = function oneMinuteRate() {
    var self = this;

    return self.meter.oneMinuteRate();
};

Timer.prototype.snapshot = function snapshot() {
    var self = this;

    return self.histogram.snapshot();
};

Timer.prototype.start = function start() {
    var self = this;

    return new Stopwatch(self);
};

Timer.prototype.update = function update(value) {
    var self = this;

    self.meter.update();
    self.histogram.update(value);
};

var Stopwatch = function Stopwatch(timer) {
    var self = this;

    self.startTime = getTime();
    self.stopped = false;
    self.timer = timer;
};

Stopwatch.prototype.stop = function stop() {
    var self = this;

    if (self.stopped) {
        return;
    }

    var elapsed = getTime() - self.startTime;

    self.stopped = true;
    self.timer.update(elapsed);
};
