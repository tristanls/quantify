/*

exponentiallyDecaying.js: ExponentiallyDecayingReservoir

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

var WeightedSnapshot = require('../snapshots/weighted.js');

var DEFAULT_SIZE = 1028;
var DEFAULT_ALPHA = 0.015;
var RESCALE_THRESHOLD_IN_MILLISECONDS = 1000 * 60 * 60; // 1 hour in milliseconds

var ExponentiallyDecayingReservoir = module.exports = function ExponentiallyDecayingReservoir(config) {
    var self = this;

    config = config || {};

    self._values = {};
    self.alpha = config.alpha || DEFAULT_ALPHA;
    self.count = 0;
    self._size = config.size || DEFAULT_SIZE;
    self.startTimeInMilliseconds = new Date().getTime();
    self.nextScaleTimeInMilliseconds = self.startTimeInMilliseconds + RESCALE_THRESHOLD_IN_MILLISECONDS;
};

ExponentiallyDecayingReservoir.prototype.rescale = function rescale(nowInMilliseconds) {
    var self = this;

    self.nextScaleTimeInMilliseconds = nowInMilliseconds + RESCALE_THRESHOLD_IN_MILLISECONDS;
    var oldStartTime = self.startTimeInMilliseconds;
    self.startTimeInMilliseconds = new Date().getTime();
    var scalingFactor = Math.exp((-1 * self.alpha) * ((self.startTimeInMilliseconds - oldStartTime) / 1000 /* to seconds */));

    var keys = Object.keys(self._values);
    keys.forEach(function (key) {
        var sample = self._values[key];
        delete self._values[key];
        var newSample = {value: sample.value, weight: sample.weight * scalingFactor};
        self._values[(key * scalingFactor)] = newSample;
    });

    self.count = Object.keys(self._values).length;
};

ExponentiallyDecayingReservoir.prototype.size = function size() {
    var self = this;

    return Math.min(self._size, self.count);
};

ExponentiallyDecayingReservoir.prototype.snapshot = function snapshot() {
    var self = this;

    var values = [];
    Object.keys(self._values).forEach(function (key) {
        values.push(self._values[key]);
    });
    return new WeightedSnapshot(values);
};

ExponentiallyDecayingReservoir.prototype.update = function update(value) {
    var self = this;

    // rescale if needed
    var nowInMilliseconds = new Date().getTime();
    if (nowInMilliseconds >= self.nextScaleTimeInMilliseconds) {
        self.rescale(nowInMilliseconds);
    }

    var itemWeight = self.weight(nowInMilliseconds - self.startTimeInMilliseconds);
    var sample = {value: value, weight: itemWeight};
    var priority = itemWeight / Math.random();

    self.count++;
    if (self.count <= self._size) {
        self._values[priority] = sample;
    } else {
        var first = Object.keys(self._values)[0];
        var existed = self._values[priority] !== undefined;
        if (first < priority && !existed) {
            self._values[priority] = sample;
            // make sure we delete one if it didn't exist before
            delete self._values[first];
        }
    }

};

ExponentiallyDecayingReservoir.prototype.weight = function weight(timeInMilliseconds) {
    var self = this;

    return Math.exp(self.alpha * (timeInMilliseconds / 1000 /* to seconds */));
};
