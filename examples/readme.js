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
var counter = metrics.counter("foo");
// create a gauge
var gauge = metrics.gauge("foo");
// create a histogram
var histogram = metrics.histogram("foo");
// create a meter
var meter = metrics.meter("foo");
// create a timer
var timer = metrics.timer("foo");

// create a counter with metadata
var counterWithMetadata = metrics.counter("a_counter", {some_tag: "metadata"});

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
    console.log(data.counters.foo.value); // 0
    console.log(data.counters.foo.metadata); // undefined
    console.log(data.counters.a_counter.value); // 1
    console.log(data.counters.a_counter.metadata); // {"some_tag": "metadata"}
    console.log(data.gauges.foo.value); // 17
    console.log(data.histograms.foo.count); // total count of histogram updates
    console.log(data.histograms.foo.max); // maximum
    console.log(data.histograms.foo.mean); // mean
    console.log(data.histograms.foo.median); // median
    console.log(data.histograms.foo.min); // minimum
    console.log(data.histograms.foo.percentile75); // 75th percentile
    console.log(data.histograms.foo.percentile95); // 95th percentile
    console.log(data.histograms.foo.percentile98); // 98th percentile
    console.log(data.histograms.foo.percentile99); // 99th percentile
    console.log(data.histograms.foo.percentile999); // 99.9th percentile
    console.log(data.histograms.foo.sampleSize); // sample size
    console.log(data.histograms.foo.standardDeviation); // standard deviation
    console.log(data.meters.foo.count); // total count of meter updates
    console.log(data.meters.foo.meanRate); // mean rate since creation
    console.log(data.meters.foo.oneMinuteRate); // one minute rate
    console.log(data.meters.foo.fiveMinuteRate); // five minute rate
    console.log(data.meters.foo.fifteenMinuteRate); // fifteen minute rate
    console.log(data.timers.foo.count); // total count of timer updates
    console.log(data.timers.foo.meanRate); // mean rate since creation
    console.log(data.timers.foo.oneMinuteRate); // one minute rate
    console.log(data.timers.foo.fiveMinuteRate); // five minute rate
    console.log(data.timers.foo.fifteenMinuteRate); // fifteen minute rate
    console.log(data.timers.foo.max); // maximum
    console.log(data.timers.foo.mean); // mean
    console.log(data.timers.foo.median); // median
    console.log(data.timers.foo.min); // minimum
    console.log(data.timers.foo.percentile75); // 75th percentile
    console.log(data.timers.foo.percentile95); // 95th percentile
    console.log(data.timers.foo.percentile98); // 98th percentile
    console.log(data.timers.foo.percentile99); // 99th percentile
    console.log(data.timers.foo.percentile999); // 99.9th percentile
    console.log(data.timers.foo.sampleSize); // sample size
    console.log(data.timers.foo.standardDeviation); // standard deviation
});
metrics.on(subscriptionName, function (data) {
    // "statsd" logger
    console.log("== 'statsd' subscription: ==");
    console.log("**statsd**", "label:" + data.label + '\n');
    // COUNTER_FIELDS and GAUGE_FIELDS = ['value']
    console.log("**statsd**", "counter.foo:" + data.counters.foo.value + "|c\n");
    var tagsString = "#";
    Object.keys(data.counters.a_counter.metadata).forEach(function(tagName) {
        tagsString += tagName + ":" + data.counters.a_counter.metadata[tagName];
    });
    console.log("**statsd**", "counter.a_counter:" + data.counters.a_counter.value + "|c|" +
      tagsString + "\n");
    console.log("**statsd**", "gauge.foo:" + data.gauges.foo.value + "|g\n");
    Quantify.HISTOGRAM_FIELDS.forEach(function (field) {
        console.log("**statsd**", "histogram.foo." + field + ":" + data.histograms.foo[field] + "|g\n");
    });
    Quantify.METER_FIELDS.forEach(function (field) {
        console.log("**statsd**", "meter.foo." + field + ":" + data.meters.foo[field] + "|g\n");
    });
    Quantify.TIMER_FIELDS.forEach(function (field) {
        console.log("**statsd**", "timer.foo." + field + ":" + data.timers.foo[field] + "|g\n");
    });
});

// invoke a specific subscription every 5 seconds
setInterval(function () { metrics[subscriptionName](); }, 1000 * 5);
