/*

weighted.test.js - WeightedSnapshot test

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

const WeightedSnapshot = require('./weighted.js');

expect.extend(
    {
        toBeBetween(received, floor, ceiling)
        {
            const pass = received < ceiling && received > floor;
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

describe("WeightedSnapshot", () =>
{
    let snapshot, WEIGHTED_ARRAY;
    beforeEach(() =>
        {
            WEIGHTED_ARRAY =
            [
                {
                    value: 5,
                    weight: 1
                },
                {
                    value: 1,
                    weight: 2
                },
                {
                    value: 2,
                    weight: 3
                },
                {
                    value: 3,
                    weight: 2
                },
                {
                    value: 4,
                    weight: 2
                }
            ];
            snapshot = new WeightedSnapshot(WEIGHTED_ARRAY);
        }
    );
    it("small quantiles are first values", () =>
        {
            expect(snapshot.quantile(0.0)).toBeBetween(0.9, 1.1);
        }
    );
    it("big quantiles are the last value", () =>
        {
            expect(snapshot.quantile(1.0)).toBeBetween(4.9, 5.1);
        }
    );
    it("has median", () =>
        {
            expect(snapshot.median()).toBeBetween(2.9, 3.1);
        }
    );
    it("has percentile75", () =>
        {
            expect(snapshot.percentile75()).toBeBetween(3.9, 4.1);
        }
    );
    it("has percentile95", () =>
        {
            expect(snapshot.percentile95()).toBeBetween(4.9, 5.1);
        }
    );
    it("has percentile98", () =>
        {
            expect(snapshot.percentile98()).toBeBetween(4.9, 5.1);
        }
    );
    it("has percentile99", () =>
        {
            expect(snapshot.percentile99()).toBeBetween(4.9, 5.1);
        }
    );
    it("has percentile999", () =>
        {
            expect(snapshot.percentile999()).toBeBetween(4.9, 5.1);
        }
    );
    it("has values", () =>
        {
            expect(snapshot.values).toEqual([1, 2, 3, 4, 5]);
        }
    );
    it("has size", () =>
        {
            expect(snapshot.size()).toBe(5);
        }
    );
    it("calculates the minimum value", () =>
        {
            expect(snapshot.min()).toBe(1);
        }
    );
    it("calculates the maximum value", () =>
        {
            expect(snapshot.max()).toBe(5);
        }
    );
    it("calculates the mean value", () =>
        {
            expect(snapshot.mean()).toBe(2.7);
        }
    );
    it("calculates the standard deviation", () =>
        {
            expect(snapshot.standardDeviation()).toBeBetween(1.2687, 1.2689);
        }
    );
    describe("empty snapshot", () =>
    {
        beforeEach(() =>
            {
                snapshot = new WeightedSnapshot([]);
            }
        );
        it("calculates a minimum of 0", () =>
            {
                expect(snapshot.min()).toBe(0);
            }
        );
        it("calculates a maximum of 0", () =>
            {
                expect(snapshot.max()).toBe(0);
            }
        );
        it("calculates a mean of 0", () =>
            {
                expect(snapshot.mean()).toBe(0);
            }
        );
        it("calculates a standard deviation of 0", () =>
            {
                expect(snapshot.standardDeviation()).toBe(0);
            }
        );
    });
    describe("singleton snapshot", () =>
    {
        beforeEach(() =>
            {
                snapshot = new WeightedSnapshot(
                    [
                        {
                            value: 1,
                            weight: 1
                        }
                    ]
                );
            }
        );
        it("calculates a standard deviation of 0", () =>
            {
                expect(snapshot.standardDeviation()).toBe(0);
            }
        );
    });
    describe("low weights", () =>
    {
        beforeEach(() =>
            {
                snapshot = new WeightedSnapshot(
                    [
                        {
                            value: 1,
                            weight: Number.MIN_VALUE
                        },
                        {
                            value: 2,
                            weight: Number.MIN_VALUE
                        },
                        {
                            value: 3,
                            weight: Number.MIN_VALUE
                        }
                    ]
                );
            }
        );
        it("no overflow", () =>
            {
                expect(snapshot.mean()).toBe(2);
            }
        );
    });
});
