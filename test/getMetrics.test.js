/*

getMetrics.test.js - getMetrics() test

The MIT License (MIT)

Copyright (c) 2014-2019 Tristan Slominski, Leora Pearson

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

const Quantify = require("../index.js");
const UNIT_MAP = require("./unitMap.js");

const ENTRIES = ["counter", "gauge", "histogram", "meter", "timer"];

describe("getMetrics", () =>
{
    let metrics;
    beforeEach(() =>
        {
            metrics = new Quantify();
        }
    );
    it("returns all metrics when invoked", () =>
        {
            ENTRIES.map(entry =>
                {
                    metrics[entry]("foo", UNIT_MAP[entry]);
                    metrics[entry]("bar", UNIT_MAP[entry]);
                }
            );
            const data = metrics.getMetrics();
            ENTRIES.map(entry =>
                {
                    const fields = `${entry.toUpperCase()}_FIELDS`;
                    [ "foo", "bar" ].map(p =>
                        {
                            Quantify[fields].map(field => expect(Object.keys(data[`${entry}s`][p])).toContain(field));
                            expect(Quantify[fields].length).toBe(Object.keys(data[`${entry}s`][p]).length);
                        }
                    );
                }
            );
        }
    );
    it("returned metrics include metadata if specified at creation but otherwise do not include a metadata field", () =>
        {
            const metadata = {};
            ENTRIES.map(entry =>
                {
                    metrics[entry]("foo", UNIT_MAP[entry]);
                    metadata[entry] = {};
                    metrics[entry]("bar", UNIT_MAP[entry], metadata[entry]);
                }
            );
            const data = metrics.getMetrics();
            ENTRIES.map(entry =>
                {
                    const fields = `${entry.toUpperCase()}_FIELDS`;
                    [ "foo", "bar" ].map(p =>
                        {
                            Quantify[fields].map(field => expect(Object.keys(data[`${entry}s`][p])).toContain(field));
                            let expectedFields = Quantify[fields];
                            if (p === "bar")
                            {
                                expectedFields = [ ...expectedFields, "metadata" ];
                                expect(data[`${entry}s`][p].metadata).toBe(metadata[entry]);
                            }
                            expect(expectedFields.length).toBe(Object.keys(data[`${entry}s`][p]).length);
                        }
                    );
                }
            );
        }
    );
    it("returns the latency of preparing metrics", () =>
        {
            ENTRIES.map(entry =>
                {
                    metrics[entry]("foo", UNIT_MAP[entry]);
                    metrics[entry]("bar", UNIT_MAP[entry]);
                }
            );
            const data = metrics.getMetrics();
            expect(data.latency).toBeGreaterThan(0);
        }
    );
    it("returns metrics with counters matching counters filter", () =>
        {
            metrics.counter("foo", UNIT_MAP.counter);
            metrics.counter("bar", UNIT_MAP.counter);
            const data = metrics.getMetrics(
                {
                    counters: /foo/
                }
            );
            expect(Object.keys(data.counters)).toEqual(["foo"]);
            expect(Object.keys(data.counters.foo).sort()).toEqual(Quantify.COUNTER_FIELDS.sort());
        }
    );
    it("returns metrics with gauges matching gauges filter", () =>
        {
            metrics.gauge("foo", UNIT_MAP.gauge);
            metrics.gauge("bar", UNIT_MAP.gauge);
            const data = metrics.getMetrics(
                {
                    gauges: /foo/
                }
            );
            expect(Object.keys(data.gauges)).toEqual(["foo"]);
            expect(Object.keys(data.gauges.foo).sort()).toEqual(Quantify.GAUGE_FIELDS.sort());
        }
    );
    it("returns metrics with histograms matching histograms filter", () =>
        {
            metrics.histogram("foo", UNIT_MAP.histogram);
            metrics.histogram("bar", UNIT_MAP.histogram);
            const data = metrics.getMetrics(
                {
                    histograms: /foo/
                }
            );
            expect(Object.keys(data.histograms)).toEqual(["foo"]);
            expect(Object.keys(data.histograms.foo).sort()).toEqual(Quantify.HISTOGRAM_FIELDS.sort());
        }
    );
    it("returns metrics with meters matching meters filter", () =>
        {
            metrics.meter("foo", UNIT_MAP.meter);
            metrics.meter("bar", UNIT_MAP.meter);
            const data = metrics.getMetrics(
                {
                    meters: /foo/
                }
            );
            expect(Object.keys(data.meters)).toEqual(["foo"]);
            expect(Object.keys(data.meters.foo).sort()).toEqual(Quantify.METER_FIELDS.sort());
        }
    );
    it("returns metrics with timers matching timers filter", () =>
        {
            metrics.timer("foo", UNIT_MAP.timer);
            metrics.timer("bar", UNIT_MAP.timer);
            const data = metrics.getMetrics(
                {
                    timers: /foo/
                }
            );
            expect(Object.keys(data.timers)).toEqual(["foo"]);
            expect(Object.keys(data.timers.foo).sort()).toEqual(Quantify.TIMER_FIELDS.sort());
        }
    );
});
