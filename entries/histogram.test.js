/*

histogram..test.js - Histogram test

The MIT License (MIT)

Copyright (c) 2014-2019 Tristan Slominski

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

const ExponentiallyDecayingReservoir = require('../reservoirs/exponentiallyDecaying.js');
const Histogram = require('../entries/histogram.js');
const Quantify = require('../index.js');
const WeightedSnapshot = require('../snapshots/weighted.js');
const UNIT_MAP = require('../test/unitMap.js');

describe("Histogram", () =>
{
    let histogram, metrics;
    beforeEach(() =>
        {
            metrics = new Quantify();
            histogram = metrics.histogram("foo", UNIT_MAP.histogram);
        }
    );
    it("returns the same histogram object when given the same name", () =>
        {
            const histogram2 = metrics.histogram("foo", UNIT_MAP.histogram);
            expect(histogram).toBeInstanceOf(Histogram);
            expect(histogram).toBe(histogram2);
        }
    );
    it("throws exception when creating histogram without a name", () =>
        {
            expect(() => metrics.histogram()).toThrow(Error);
        }
    );
    it("creates a histogram with updateCount of 0", () =>
        {
            expect(histogram.updateCount()).toBe(0);
        }
    );
    it("creates a histogram with an ExponentiallyDecayingReservoir", () =>
        {
            expect(histogram.reservoir).toBeInstanceOf(ExponentiallyDecayingReservoir);
        }
    );
    it("creates a histogram with a WeightedSnapshot", () =>
        {
            expect(histogram.reservoir.snapshot()).toBeInstanceOf(WeightedSnapshot);
        }
    );
    describe("update()", () =>
    {
        it("updates the histogram", () =>
            {
                histogram.update(17);
                const snapshot = histogram.snapshot();
                expect(snapshot.min()).toBe(17);
                expect(snapshot.max()).toBe(17);
                expect(snapshot.standardDeviation()).toBe(0);
                expect(snapshot.percentile999()).toBe(17);
            }
        );
    });
});
