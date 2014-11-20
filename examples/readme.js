/*

readme.js - readme example script

The MIT License (MIT)

Copyright (c) 2014 Tristan Slominski, Leora Pearson

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

var Quantify = require('../index.js');

var metrics = new Quantify();

// create a counter
var counter = metrics.counter("errors", "Err");
// create a gauge
var gauge = metrics.gauge("cpuLoad", "Load");
// create a histogram
var histogram = metrics.histogram("searchResultsReturned", {
    measureUnit: "Result",
    sampleSizeUnit: "Req"
});
// create a meter
var meter = metrics.meter("requests", {
    rateUnit: "Req/s",
    updateCountUnit: "Req"
});
// create a timer
var timer = metrics.timer("requestLatency", {
    measureUnit: "ms",
    rateUnit: "Req/s",
    sampleSizeUnit: "Req"
});

// create a counter with metadata
var counterWithMetadata = metrics.counter("warnings", "Warn", {server: "i-17"});

counter.update(1); // increment
counter.update(-1); // decrement

counterWithMetadata.update(1); // increment

gauge.update(17); // set

histogram.update(1227); // update
histogram.update(7122); // update

meter.update(); // mark
meter.update(10); // 10 "simultaneous" marks

var stopwatch = timer.start(); // start a timer
stopwatch.stop(); // stop a timer
timer.update(178); // explicitly update the timer with given value

console.log("== Synchronous getMetrics() output: ==");
console.dir(metrics.getMetrics()); // get metrics synchronously

var subscriptionName = metrics.subscribe({label: "mySubscription"});
metrics.on(subscriptionName, function (data) {
    // console logger
    console.log("== Subscription logged to console: ==");
    console.log(data.label); // mySubscription
    console.log(data.counters.errors.value); // 0
    console.log(data.counters.errors.unit); // Err
    console.log(data.counters.errors.metadata); // undefined
    console.log(data.counters.warnings.value); // 1
    console.log(data.counters.warnings.unit); // Warn
    console.log(data.counters.warnings.metadata); // {"some_tag": "metadata"}
    console.log(data.gauges.cpuLoad.value); // 17
    console.log(data.gauges.cpuLoad.unit); // Load
    console.log(data.histograms.searchResultsReturned.updateCount); // total count of histogram updates
    console.log(data.histograms.searchResultsReturned.max); // maximum
    console.log(data.histograms.searchResultsReturned.mean); // mean
    console.log(data.histograms.searchResultsReturned.median); // median
    console.log(data.histograms.searchResultsReturned.min); // minimum
    console.log(data.histograms.searchResultsReturned.percentile75); // 75th percentile
    console.log(data.histograms.searchResultsReturned.percentile95); // 95th percentile
    console.log(data.histograms.searchResultsReturned.percentile98); // 98th percentile
    console.log(data.histograms.searchResultsReturned.percentile99); // 99th percentile
    console.log(data.histograms.searchResultsReturned.percentile999); // 99.9th percentile
    console.log(data.histograms.searchResultsReturned.sampleSize); // sample size
    console.log(data.histograms.searchResultsReturned.standardDeviation); // standard deviation
    console.log(data.histograms.searchResultsReturned.measureUnit); // Result
    console.log(data.histograms.searchResultsReturned.sampleSizeUnit); // Req
    console.log(data.meters.requests.updateCount); // total count of meter updates
    console.log(data.meters.requests.meanRate); // mean rate since creation
    console.log(data.meters.requests.oneMinuteRate); // one minute rate
    console.log(data.meters.requests.fiveMinuteRate); // five minute rate
    console.log(data.meters.requests.fifteenMinuteRate); // fifteen minute rate
    console.log(data.meters.requests.rateUnit); // Req/s
    console.log(data.meters.requests.updateCountUnit); // Req
    console.log(data.timers.requestLatency.updateCount); // total count of timer updates
    console.log(data.timers.requestLatency.meanRate); // mean rate since creation
    console.log(data.timers.requestLatency.oneMinuteRate); // one minute rate
    console.log(data.timers.requestLatency.fiveMinuteRate); // five minute rate
    console.log(data.timers.requestLatency.fifteenMinuteRate); // fifteen minute rate
    console.log(data.timers.requestLatency.max); // maximum
    console.log(data.timers.requestLatency.mean); // mean
    console.log(data.timers.requestLatency.median); // median
    console.log(data.timers.requestLatency.min); // minimum
    console.log(data.timers.requestLatency.percentile75); // 75th percentile
    console.log(data.timers.requestLatency.percentile95); // 95th percentile
    console.log(data.timers.requestLatency.percentile98); // 98th percentile
    console.log(data.timers.requestLatency.percentile99); // 99th percentile
    console.log(data.timers.requestLatency.percentile999); // 99.9th percentile
    console.log(data.timers.requestLatency.sampleSize); // sample size
    console.log(data.timers.requestLatency.standardDeviation); // standard deviation
    console.log(data.timers.requestLatency.measureUnit); // ms
    console.log(data.timers.requestLatency.rateUnit); // Req/s
    console.log(data.timers.requestLatency.sampleSizeUnit); // Req
});
metrics.on(subscriptionName, function (data) {
    // "statsd" logger
    console.log("== 'statsd' subscription: ==");
    console.log("**statsd**", "label:" + data.label + '\n');

    console.log("**statsd**", "counter.errors." + data.counters.errors.unit
        + ":" + data.counters.errors.value + "|c\n");

    var tagsString = "#";
    Object.keys(data.counters.warnings.metadata).forEach(function(tagName) {
        tagsString += tagName + ":" + data.counters.warnings.metadata[tagName];
    });
    console.log("**statsd**", "counter.warnings." + data.counters.warnings.unit
        + ":" + data.counters.warnings.value + "|c|" + tagsString + "\n");

    console.log("**statsd**", "gauge.cpuLoad." + data.gauges.cpuLoad.unit
        + ":" + data.gauges.cpuLoad.value + "|g\n");

    Quantify.HISTOGRAM_MEASURE_FIELDS.forEach(function (field) {
        console.log("**statsd**", "histogram.searchResultsReturned." + field
            + "." + data.histograms.searchResultsReturned.measureUnit + ":"
            + data.histograms.searchResultsReturned[field] + "|g\n");
    });
    console.log("**statsd**", "histogram.searchResultsReturned.updateCount."
        + data.histograms.searchResultsReturned.sampleSizeUnit + ":"
        + data.histograms.searchResultsReturned.updateCount + "|g\n");
    console.log("**statsd**", "histogram.searchResultsReturned.sampleSize."
        + data.histograms.searchResultsReturned.sampleSizeUnit + ":"
        + data.histograms.searchResultsReturned.sampleSize + "|g\n");

    Quantify.METER_RATE_FIELDS.forEach(function (field) {
        console.log("**statsd**", "meter.requests." + field + "."
            + data.meters.requests.rateUnit + ":"
            + data.meters.requests[field] + "|g\n");
    })
    console.log("**statsd**", "meter.requests.updateCount."
            + data.meters.requests.updateCountUnit + ":"
            + data.meters.requests.updateCount + "|g\n");

    Quantify.TIMER_MEASURE_FIELDS.forEach(function (field) {
        console.log("**statsd**", "timer.requestLatency." + field
            + "." + data.timers.requestLatency.measureUnit + ":"
            + data.timers.requestLatency[field] + "|g\n");
    });
    console.log("**statsd**", "timer.requestLatency.updateCount."
        + data.timers.requestLatency.sampleSizeUnit + ":"
        + data.timers.requestLatency.updateCount + "|g\n");
    console.log("**statsd**", "timer.requestLatency.sampleSize."
        + data.timers.requestLatency.sampleSizeUnit + ":"
        + data.timers.requestLatency.sampleSize + "|g\n");
    Quantify.TIMER_RATE_FIELDS.forEach(function (field) {
        console.log("**statsd**", "timer.requestLatency." + field + "."
            + data.timers.requestLatency.rateUnit + ":"
            + data.timers.requestLatency[field] + "|g\n");
    });
});

// invoke a specific subscription every 5 seconds
setInterval(function () { metrics[subscriptionName](); }, 1000 * 5);
