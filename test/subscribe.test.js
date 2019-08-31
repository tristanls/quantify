/*

subscribe.test.js - subscribe() test

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

describe("subscribe", () =>
{
    let metrics, subscriptionName;
    beforeEach(() =>
        {
            metrics = new Quantify();
            subscriptionName = metrics.subscribe();
        }
    );
    it("emits event with subscription name when subscription name method is invoked", done =>
        {
            metrics.on(subscriptionName, () => done());
            metrics[subscriptionName]();
        }
    );
    it("emits event with subscription label when subscription name method is invoked", done =>
        {
            subscriptionName = metrics.subscribe(
                {
                    label: "foo"
                }
            );
            metrics.on(subscriptionName, data =>
                {
                    expect(data.label).toBe("foo");
                    done();
                }
            );
            metrics[subscriptionName]();
        }
    );
    it("emits event returned by getMetrics() call", done =>
        {
            const _data = {};
            metrics.getMetrics = () => _data;
            metrics.on(subscriptionName, data =>
                {
                    expect(data).toBe(_data);
                    done();
                }
            );
            metrics[subscriptionName]();
        }
    );
    it("emits event with counters matching counters filter", done =>
        {
            metrics.counter("foo", UNIT_MAP.counter);
            metrics.counter("bar", UNIT_MAP.counter);
            subscriptionName = metrics.subscribe(
                {
                    filters:
                    {
                        counters: /foo/
                    }
                }
            );
            metrics.on(subscriptionName, data =>
                {
                    expect(data.counters).toEqual(
                        {
                            foo:
                            {
                                value: 0,
                                unit: UNIT_MAP.counter
                            }
                        }
                    );
                    done();
                }
            );
            metrics[subscriptionName]();
        }
    );
    it("emits event with gauges matching gauges filter", done =>
        {
            metrics.gauge("foo", UNIT_MAP.gauge);
            metrics.gauge("bar", UNIT_MAP.gauge);
            subscriptionName = metrics.subscribe(
                {
                    filters:
                    {
                        gauges: /foo/
                    }
                }
            );
            metrics.on(subscriptionName, data =>
                {
                    expect(data.gauges).toEqual(
                        {
                            foo:
                            {
                                value: 0,
                                unit: UNIT_MAP.gauge
                            }
                        }
                    );
                    done();
                }
            );
            metrics[subscriptionName]();
        }
    );
    it("emits event with histograms matching histograms filter", done =>
        {
            metrics.histogram("foo", UNIT_MAP.histogram);
            metrics.histogram("bar", UNIT_MAP.histogram);
            subscriptionName = metrics.subscribe(
                {
                    filters:
                    {
                        histograms: /foo/
                    }
                }
            );
            metrics.on(subscriptionName, data =>
                {
                    expect(data.histograms).toEqual(
                        {
                            foo:
                            {
                                max: 0,
                                mean: 0,
                                median: 0,
                                min: 0,
                                percentile75: 0,
                                percentile95: 0,
                                percentile98: 0,
                                percentile99: 0,
                                percentile999: 0,
                                sampleSize: 0,
                                standardDeviation: 0,
                                updateCount: 0,
                                ...UNIT_MAP.histogram
                            }
                        }
                    );
                    done();
                }
            );
            metrics[subscriptionName]();
        }
    );
    it("emits event with meters matching meters filter", done =>
        {
            metrics.meter("foo", UNIT_MAP.meter);
            metrics.meter("bar", UNIT_MAP.meter);
            subscriptionName = metrics.subscribe(
                {
                    filters:
                    {
                        meters: /foo/
                    }
                }
            );
            metrics.on(subscriptionName, data =>
                {
                    expect(data.meters).toEqual(
                        {
                            foo:
                            {
                                updateCount: 0,
                                meanRate: 0,
                                oneMinuteRate: 0,
                                fiveMinuteRate: 0,
                                fifteenMinuteRate: 0,
                                ...UNIT_MAP.meter
                            }
                        }
                    );
                    done();
                }
            );
            metrics[subscriptionName]();
        }
    );
    it("emits event with timers matching timers filter", done =>
        {
            metrics.timer("foo", UNIT_MAP.timer);
            metrics.timer("bar", UNIT_MAP.timer);
            subscriptionName = metrics.subscribe(
                {
                    filters:
                    {
                        timers: /foo/
                    }
                }
            );
            metrics.on(subscriptionName, data =>
                {
                    expect(data.timers).toEqual(
                        {
                            foo:
                            {
                                updateCount: 0,
                                meanRate: 0,
                                oneMinuteRate: 0,
                                fiveMinuteRate: 0,
                                fifteenMinuteRate: 0,
                                max: 0,
                                mean: 0,
                                median: 0,
                                min: 0,
                                percentile75: 0,
                                percentile95: 0,
                                percentile98: 0,
                                percentile99: 0,
                                percentile999: 0,
                                sampleSize: 0,
                                standardDeviation: 0,
                                updateCount: 0,
                                ...UNIT_MAP.timer
                            }
                        }
                    );
                    done();
                }
            );
            metrics[subscriptionName]();
        }
    );
    it("multiple subscriptions work independently", () =>
        {
            const subscriptions = [];
            ENTRIES.map(entry =>
                {
                    metrics[entry]("foo", UNIT_MAP[entry]);
                    metrics[entry]("bar", UNIT_MAP[entry]);
                    let regex;
                    if (entry == "counter")
                    {
                        regex = /foo/
                    }
                    else
                    {
                        regex = /bar/
                    }
                    subscriptions.push(
                        metrics.subscribe(
                            {
                                filters:
                                {
                                    [`${entry}s`]: regex
                                }
                            }
                        )
                    );
                }
            );
            metrics.on(subscriptions[0], data =>
                {
                    expect(Object.keys(data.counters)).toEqual(["foo"]);
                    expect(Object.keys(data.gauges)).toEqual(["foo", "bar"]);
                    expect(Object.keys(data.histograms)).toEqual(["foo", "bar"]);
                    expect(Object.keys(data.meters)).toEqual(["foo", "bar"]);
                    expect(Object.keys(data.timers)).toEqual(["foo", "bar"]);
                    metrics[subscriptions[1]]();
                }
            );
            metrics.on(subscriptions[1], data =>
                {
                    expect(Object.keys(data.counters)).toEqual(["foo", "bar"]);
                    expect(Object.keys(data.gauges)).toEqual(["bar"]);
                    expect(Object.keys(data.histograms)).toEqual(["foo", "bar"]);
                    expect(Object.keys(data.meters)).toEqual(["foo", "bar"]);
                    expect(Object.keys(data.timers)).toEqual(["foo", "bar"]);
                    metrics[subscriptions[2]]();
                }
            );
            metrics.on(subscriptions[3], data =>
                {
                    expect(Object.keys(data.counters)).toEqual(["foo", "bar"]);
                    expect(Object.keys(data.gauges)).toEqual(["foo", "bar"]);
                    expect(Object.keys(data.histograms)).toEqual(["bar"]);
                    expect(Object.keys(data.meters)).toEqual(["foo", "bar"]);
                    expect(Object.keys(data.timers)).toEqual(["foo", "bar"]);
                    metrics[subscriptions[3]]();
                }
            );
            metrics.on(subscriptions[3], data =>
                {
                    expect(Object.keys(data.counters)).toEqual(["foo", "bar"]);
                    expect(Object.keys(data.gauges)).toEqual(["foo", "bar"]);
                    expect(Object.keys(data.histograms)).toEqual(["foo", "bar"]);
                    expect(Object.keys(data.meters)).toEqual(["bar"]);
                    expect(Object.keys(data.timers)).toEqual(["foo", "bar"]);
                    metrics[subscriptions[4]]();
                }
            );
            metrics.on(subscriptions[4], data =>
                {
                    expect(Object.keys(data.counters)).toEqual(["foo", "bar"]);
                    expect(Object.keys(data.gauges)).toEqual(["foo", "bar"]);
                    expect(Object.keys(data.histograms)).toEqual(["foo", "bar"]);
                    expect(Object.keys(data.meters)).toEqual(["foo", "bar"]);
                    expect(Object.keys(data.timers)).toEqual(["bar"]);
                    done();
                }
            );
            metrics[subscriptions[0]]();
        }
    );
});
