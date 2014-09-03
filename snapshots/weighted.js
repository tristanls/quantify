/*

weighted.js: WeightedSnapshot

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

var WeightedSnapshot = module.exports = function WeightedSnapshot(values) {
    var self = this;

    var copy = values.slice(0);
    copy.sort(function (a, b){
        if (a.value > b.value) {
            return 1;
        }
        if (a.value < b.value) {
            return -1;
        }
        return 0;
    });

    self.values = [];
    self.normWeights = [];
    self.quantiles = [];

    var sumWeight = 0;
    copy.forEach(function (sample) {
        sumWeight += sample.weight;
    });
    copy.forEach(function (sample) {
        self.values.push(sample.value);
        self.normWeights.push(sample.weight / sumWeight);
    });
    self.quantiles[0] = 0;
    for (var i = 1; i < copy.length; i++) {
        self.quantiles[i] = self.quantiles[i - 1] + self.normWeights[i - 1];
    }
};

WeightedSnapshot.prototype.max = function max() {
    var self = this;

    if (self.values.length == 0) {
        return 0;
    }
    return self.values[self.values.length - 1];
};

WeightedSnapshot.prototype.mean = function mean() {
    var self = this;

    if (self.values.length == 0) {
        return 0;
    }

    var sum = 0;
    for (var i = 0; i < self.values.length; i++) {
        sum += self.values[i] * self.normWeights[i];
    }
    return sum;
};

WeightedSnapshot.prototype.median = function median() {
    return this.quantile(0.5);
};

WeightedSnapshot.prototype.min = function min() {
    var self = this;

    if (self.values.length == 0) {
        return 0;
    }
    return self.values[0];
};

WeightedSnapshot.prototype.percentile75 = function percentile75() {
    return this.quantile(0.75);
};

WeightedSnapshot.prototype.percentile95 = function percentile95() {
    return this.quantile(0.95);
};

WeightedSnapshot.prototype.percentile98 = function percentile98() {
    return this.quantile(0.98);
};

WeightedSnapshot.prototype.percentile99 = function percentile99() {
    return this.quantile(0.99);
};

WeightedSnapshot.prototype.percentile999 = function percentile999() {
    return this.quantile(0.999);
};

WeightedSnapshot.prototype.quantile = function quantile(q) {
    var self = this;

    if (q < 0.0 || q > 1.0) {
        throw new Error(q + " is not in [0..1]");
    }

    if (self.values.length == 0) {
        return 0.0;
    }

    // FIXME: Take advantage of the fact that the quantiles array is sorted and
    //        implement a binary search.
    var i = 0;
    while (q > self.quantiles[i] && i < self.quantiles.length) {
        i++;
    }

    // if we are not exactly equal, we went too far, go back one
    if (q != self.quantiles[i]) {
        i--;
    }

    // normalize if needed
    if (i < 0) {
        i = 0;
    }

    if (i >= self.values.length) {
        return self.values[self.values.length - 1];
    }

    return self.values[i];
};

WeightedSnapshot.prototype.size = function size() {
    return this.values.length;
};

WeightedSnapshot.prototype.standardDeviation = function standardDeviation() {
    var self = this;

    if (self.values.length <= 1) {
        return 0;
    }

    var mean = self.mean();
    var variance = 0;

    for (var i = 0; i < self.values.length; i++) {
        var diff = self.values[i] - mean;
        variance += self.normWeights[i] * diff * diff;
    }

    return Math.sqrt(variance);
};
