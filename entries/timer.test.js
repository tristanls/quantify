/*

timer.test.js - Timer test

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

const Timer = require('../entries/timer.js');
const Quantify = require('../index.js');
const UNIT_MAP = require('../test/unitMap.js');

describe("Timer", () =>
{
    let metrics, timer;
    beforeEach(() =>
        {
            metrics = new Quantify();
            timer = metrics.timer("foo", UNIT_MAP.timer);
        }
    );
    it("returns the same timer object when given the same name", () =>
        {
            const timer2 = metrics.timer("foo", UNIT_MAP.timer);
            expect(timer).toBeInstanceOf(Timer);
            expect(timer).toBe(timer2);
        }
    );
    it("throws exception when creating timer without a name", () =>
        {
            expect(() => metrics.timer()).toThrow(Error);
        }
    );
    it("creates a timer with count of 0 values", () =>
        {
            expect(timer.updateCount()).toBe(0);
        }
    );
    describe("start()", () =>
    {
        it("creates a stopwatch", done =>
            {
                const stopwatch = timer.start();
                setTimeout(() =>
                    {
                        stopwatch.stop();
                        const snapshot = timer.snapshot();
                        expect(timer.updateCount()).toBe(1);
                        const min = snapshot.min();
                        expect(min).toBeLessThan(200);
                        expect(min).toBeGreaterThan(0);
                        const max = snapshot.max();
                        expect(max).toBeLessThan(200);
                        expect(max).toBeGreaterThan(0);
                        expect(snapshot.standardDeviation()).toBe(0);
                        const p999 = snapshot.percentile999();
                        expect(p999).toBeLessThan(200);
                        expect(p999).toBeGreaterThan(0);
                        done();
                    },
                    100
                );
            }
        );
    });
    describe("update()", () =>
    {
        it("updates the timer", () =>
            {
                timer.update(17);
                const snapshot = timer.snapshot();
                expect(snapshot.min()).toBe(17);
                expect(snapshot.max()).toBe(17);
                expect(snapshot.standardDeviation()).toBe(0);
                expect(snapshot.percentile999()).toBe(17);
            }
        );
    });
});
