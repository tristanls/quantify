/*

meter.test.js - Meter test

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

const Meter = require('../entries/meter.js');
const Quantify = require('../index.js');
const UNIT_MAP = require('../test/unitMap.js');

describe("Meter", () =>
{
    let meter, metrics;
    beforeEach(() =>
        {
            metrics = new Quantify();
            meter = metrics.meter("foo", UNIT_MAP.meter);
        }
    );
    it("returns the same meter object when given the same name", () =>
        {
            const meter2 = metrics.meter("foo", UNIT_MAP.meter);
            expect(meter).toBeInstanceOf(Meter);
            expect(meter).toBe(meter2);
        }
    );
    it("throws exception when creating meter without a name", () =>
        {
            expect(() => metrics.meter()).toThrow(Error);
        }
    );
    it("creates a meter with initial values of 0", () =>
        {
            expect(meter.updateCount()).toBe(0);
            expect(meter.meanRate()).toBe(0);
            expect(meter.oneMinuteRate()).toBe(0);
            expect(meter.fiveMinuteRate()).toBe(0);
            expect(meter.fifteenMinuteRate()).toBe(0);
        }
    );
    it("decays over two marks and ticks",
        done =>
        {
            meter.update(5);
            setTimeout(() =>
                {
                    expect(meter.updateCount()).toBe(5);
                    expect(meter.oneMinuteRate().toFixed(4)).toBe("0.0736");
                    expect(meter.fiveMinuteRate().toFixed(4)).toBe("0.0163");
                    expect(meter.fifteenMinuteRate().toFixed(4)).toBe("0.0055");

                    meter.update(10);
                    setTimeout(() =>
                        {
                            expect(meter.updateCount()).toBe(15);
                            expect(meter.oneMinuteRate().toFixed(3)).toBe("0.209");
                            expect(meter.fiveMinuteRate().toFixed(3)).toBe("0.048");
                            expect(meter.fifteenMinuteRate().toFixed(3)).toBe("0.016");

                            done();
                        },
                        5000 // one tick interval of 5 seconds
                    );
                },
                5000 // one tick interval of 5 seconds
            );
        },
        11000
    );
});
