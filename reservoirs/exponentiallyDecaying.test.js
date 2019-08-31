/*

exponentiallyDecaying.test.js - ExponentiallyDecayingReservoir test

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

const sinon = require('sinon');
const ExponentiallyDecayingReservoir = require('./exponentiallyDecaying.js');

expect.extend(
    {
        toBeEqualOrBetween(received, floor, ceiling)
        {
            const pass = received < ceiling && received >= floor;
            if (pass)
            {
                return (
                    {
                        message: () => `expected ${received} not to be between ${floor} and ${ceiling}`,
                        pass: true
                    }
                );
            }
            return (
                {
                    message: () => `expected ${received} to be between ${floor} and ${ceiling}`,
                    pass: false
                }
            );
        }
    }
);

describe("ExponentiallyDecayingReservoir", () =>
{
    let reservoir;
    describe("size of 100", () =>
    {
        beforeEach(() =>
            {
                reservoir = new ExponentiallyDecayingReservoir(
                    {
                        size: 100,
                        alpha: 0.99
                    }
                );
            }
        );
        it("updated with 1000 elements has 100 elements within min and max", () =>
            {
                for (let i = 0; i < 1000; i++)
                {
                    reservoir.update(i);
                }
                expect(reservoir.size()).toBe(100);
                const snapshot = reservoir.snapshot();
                expect(snapshot.size()).toBe(100);
                snapshot.values.map(value => expect(value).toBeEqualOrBetween(0, 1000));
            }
        );
        it("updated with 10 elements has 10 elements within min and max", () =>
            {
                for (let i = 0; i < 10; i++)
                {
                    reservoir.update(i);
                }
                expect(reservoir.size()).toBe(10);
                const snapshot = reservoir.snapshot();
                expect(snapshot.size()).toBe(10);
                snapshot.values.map(value => expect(value).toBeEqualOrBetween(0, 10));
            }
        );
    });
    describe("heavily biased with size of 1000", () =>
    {
        beforeEach(() =>
            {
                reservoir = new ExponentiallyDecayingReservoir(
                    {
                        size: 1000,
                        alpha: 0.01
                    }
                );
            }
        );
        it("updated with 100 elements has 100 elements within min and max", () =>
            {
                for (let i = 0; i < 100; i++)
                {
                    reservoir.update(i);
                }
                expect(reservoir.size()).toBe(100);
                const snapshot = reservoir.snapshot();
                expect(snapshot.size()).toBe(100);
                snapshot.values.map(value => expect(value).toBeEqualOrBetween(0, 100));
            }
        );
    });
    it("long periods of inactivity should not corrupt sampling rate", () =>
        {
            const clock = sinon.useFakeTimers();
            reservoir = new ExponentiallyDecayingReservoir(
                {
                    size: 10,
                    alpha: 0.015
                }
            );
            // Add 1000 values at a rate of 10 values per second
            for (let i = 0; i < 1000; i++)
            {
                reservoir.update(1000 + i);
                clock.tick(100);
            }
            let snapshot = reservoir.snapshot();
            expect(snapshot.size()).toBe(10);
            snapshot.values.map(value => expect(value).toBeEqualOrBetween(1000, 2000));

            // Wait for 15 hours and add another value.
            // This should trigger a rescale. Note that the number of samples will be
            // reduced to 2 because of the very small scaling factor will make all
            // existing priorities equal to zero after rescale.
            clock.tick(1000 * 60 * 60 * 15);
            reservoir.update(2000);
            snapshot = reservoir.snapshot();
            expect(snapshot.size()).toBe(2);
            snapshot.values.map(value => expect(value).toBeEqualOrBetween(1000, 2001));

            // Add 1000 values at a rate of 10 values per second
            for (let i = 0; i < 1000; i++)
            {
                reservoir.update(3000 + i);
                clock.tick(100);
            }
            snapshot = reservoir.snapshot();
            expect(snapshot.size()).toBe(10);
            snapshot.values.map(value => expect(value).toBeEqualOrBetween(3000, 4000));

            clock.restore();
        }
    );
    it("spot lift should occur relatively quickly", () =>
        {
            const clock = sinon.useFakeTimers();
            reservoir = new ExponentiallyDecayingReservoir(
                {
                    size: 1000,
                    alpha: 0.015
                }
            );

            // Mode 1: steady regime for 120 minutes
            const valuesRatePerMinute = 10;
            const valuesIntervalMillis = parseInt(1000 * 60 / valuesRatePerMinute);
            for (let i = 0; i < (120 * valuesRatePerMinute); i++)
            {
                reservoir.update(177);
                clock.tick(valuesIntervalMillis);
            }

            // Switching to mode 2: 10 minutes more with same rate but larger value
            for (let i = 0; i < (10 * valuesRatePerMinute); i++)
            {
                reservoir.update(9999);
                clock.tick(valuesIntervalMillis);
            }

            // Expect that quantiles should be more about mode 2 after 10 minutes
            expect(reservoir.snapshot().median()).toBe(9999);

            clock.restore();
        }
    );
    it("spot fall should occur relatively quickly", () =>
        {
            const clock = sinon.useFakeTimers();
            reservoir = new ExponentiallyDecayingReservoir(
                {
                    size: 1000,
                    alpha: 0.015
                }
            );

            // Mode 1: steady regime for 120 minutes
            const valuesRatePerMinute = 10;
            const valuesIntervalMillis = parseInt(1000 * 60 / valuesRatePerMinute);
            for (let i = 0; i < (120 * valuesRatePerMinute); i++)
            {
                reservoir.update(9998);
                clock.tick(valuesIntervalMillis);
            }

            // Switching to mode 2: 10 minutes more with same rate but smaller value
            for (let i = 0; i < (10 * valuesRatePerMinute); i++)
            {
                reservoir.update(178);
                clock.tick(valuesIntervalMillis);
            }

            // Expect that quantiles should be more about mode 2 after 10 minutes
            expect(reservoir.snapshot().median()).toBe(178);

            clock.restore();
        }
    );
    it("quantiles should be based on weights", () =>
        {
            const clock = sinon.useFakeTimers();
            reservoir = new ExponentiallyDecayingReservoir(
                {
                    size: 1000,
                    alpha: 0.015
                }
            );
            for (let i = 0; i < 40; i++)
            {
                reservoir.update(177);
            }
            clock.tick(1000 * 120);
            for (let i = 0; i < 10; i++)
            {
                reservoir.update(9999);
            }
            const snapshot = reservoir.snapshot();
            expect(snapshot.size()).toBe(50);

            // The first 40 items (177) have weights of 1.
            // The next 10 items (9999) have weights of ~6
            // So, it is 40 vs 60 distribution, not 40 vs 10
            expect(snapshot.median()).toBe(9999);
            expect(snapshot.percentile75()).toBe(9999);

            clock.restore();
        }
    );
});
