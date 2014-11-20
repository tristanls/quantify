# quantify

_Stability: 1 - [Experimental](https://github.com/tristanls/stability-index#stability-1---experimental)_

[![NPM version](https://badge.fury.io/js/quantify.png)](http://npmjs.org/package/quantify)

Yet another Node.js metrics module.

This one was created and inspired by the [measured](https://github.com/felixge/node-measured) module. Much as the creator of that one, I wanted to better understand the underlying algorithms, as well as provide for a different interface for interacting with metrics informed by the _metric_, _entry_, _reporter_, _subscription_ ideas of [@bltroutwine](https://twitter.com/bltroutwine) from [Ten Billion a Day, One-Hundred Milliseconds Per - Monitoring Real-Time Bidding At AdRoll](http://www.infoq.com/presentations/erlang-bidding-system) presentation.

The _subscription_ concept is elaborated in the [quantify.subscribe(config)](#quantifysubscribeconfig) section.

The histogram implementation uses weighted sampling and exponentially decaying reservoir described [here](https://github.com/dropwizard/metrics/pull/421).

## Contributors

[@tristanls](https://github.com/tristanls), [@lpearson05](https://github.com/lpearson05)

## Usage

To run the below example run:

    npm run readme

```javascript
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

```

## Tests

```
npm test
```

## Documentation

  * [Quantify](#quantify)
  * [Counter](#counter)
  * [Gauge](#gauge)
  * [Histogram](#histogram)
  * [Meter](#meter)
  * [Timer](#timer)

### Quantify

**Public API**

  * [Quantify.COUNTER_FIELDS](#quantifycounter_fields)
  * [Quantify.GAUGE_FIELDS](#quantifygauge_fields)
  * [Quantify.HISTOGRAM_FIELDS](#quantifyhistogram_fields)
  * [Quantify.HISTOGRAM_MEASURE_FIELDS](#quantifyhistogram_measure_fields)
  * [Quantify.METER_FIELDS](#quantifymeter_fields)
  * [Quantify.METER_RATE_FIELDS](#quantifymeter_rate_fields)
  * [Quantify.TIMER_FIELDS](#quantifytimer_fields)
  * [Quantify.TIMER_MEASURE_FIELDS](#quantifytimer_measure_fields)
  * [Quantify.TIMER_RATE_FIELDS](#quantifytimer_rate_fields)
  * [new Quantify(name)](#new-quantifyname)
  * [quantify.counter(name, unit, \[metadata\])](#quantifycountername-unit-metadata)
  * [quantify.gauge(name, unit, \[metadata\])](#quantifygaugename-unit-metadata)
  * [quantify.getMetrics(filters)](#quantifygetmetricsfilters)
  * [quantify.histogram(name, units, \[metadata\])](#quantifyhistogramname-units-metadata)
  * [quantify.meter(name, units, \[metadata\])](#quantifymetername-units-metadata)
  * [quantify.subscribe(config)](#quantifysubscribeconfig)
  * [quantify.timer(name, units, \[metadata\])](#quantifytimername-units-metadata)
  * [quantify.unsubscribe(subscriptionName)](#quantifyunsubscribesubscriptionname)
  * [Event '&lt;subscriptionName&gt;'](#event-subscriptionname)

### Quantify.COUNTER_FIELDS

  * ['unit', 'value']

Counter only has `value` field.

### Quantify.GAUGE_FIELDS

  * ['unit', 'value']

Gauge only has `value` field.

### Quantify.HISTOGRAM_FIELDS

  * ['updateCount', 'max', 'mean', 'median', 'min', 'percentile75', 'percentile95', 'percentile98', 'percentile99', 'percentile999', 'standardDeviation', 'sampleSize', 'measureUnit', 'sampleSizeUnit']

All histogram fields.

### Quantify.HISTOGRAM_MEASURE_FIELDS

  * ['max', 'mean', 'median', 'min', 'percentile75', 'percentile95', 'percentile98', 'percentile99', 'percentile999', 'standardDeviation']

`HISTOGRAM_MEASURE_FIELDS` are the `HISTOGRAM_FIELDS` that share the measure unit. The measure unit is the unit associated with the value given to `histogram.update(<value>)`.

### Quantify.METER_FIELDS

  * ['updateCount', 'meanRate', 'oneMinuteRate','fiveMinuteRate', 'fifteenMinuteRate', 'rateUnit', 'updateCountUnit']

All meter fields.

### Quantify.METER_RATE_FIELDS

  * ['meanRate', 'oneMinuteRate', 'fiveMinuteRate', 'fifteenMinuteRate']

`METER_RATE_FIELDS` are the `METER_FIELDS` that are per second rates.

### Quantify.TIMER_FIELDS

  * ['updateCount', 'meanRate', 'oneMinuteRate', 'fiveMinuteRate', 'fifteenMinuteRate', 'max', 'mean', 'median', 'min', 'percentile75', 'percentile95', 'percentile98', 'percentile99', 'percentile999', 'standardDeviation', 'sampleSize', 'measureUnit', 'rateUnit', 'sampleSizeUnit']

All timer fields.

### Quantify.TIMER_MEASURE_FIELDS

  * ['max', 'mean', 'median', 'min', 'percentile75', 'percentile95', 'percentile98', 'percentile99', 'percentile999', 'standardDeviation']

`TIMER_MEASURE_FIELDS` are the `TIMER_FIELDS` that share the measure unit. The measure unit is the unit associated with the value given to `timer.update(<value>)`.

### Quantify.TIMER_RATE_FIELDS

  * ['meanRate', 'oneMinuteRate', 'fiveMinuteRate', 'fifteenMinuteRate'];

`TIMER_RATE_FIELDS` are the `TIMER_FIELDS` that are per second rates.

### new Quantify(name)

  * `name`: _String_ Quantify instance name.

### quantify.counter(name, [metadata])

  * `name`: _String_ Counter name.
  * `unit`: _String_ What is counted.
  * `metadata`: _Object_ Optional metadata.
  * Return: _Counter_ Instance of a Counter entry.

Get or create a counter with provided name.

```javascript
var Quantify = require('quantify');
var metrics = new Quantify();
var counter = metrics.counter("errors", "Err");
var counterWithMetadata = metrics.counter("warnings", "Warn", {some: "metadata"});
counter.update(1); // increment
counter.update(1); // increment
counter.update(-1); // decrement
```

### quantify.gauge(name, [metadata])

  * `name`: _String_ Gauge name.
  * `unit`: _String_ What is measured.
  * `metadata`: _Object_ Optional metadata.
  * Return: _Gauge_ Instance of a Gauge entry.

Get or create a gauge with provided name.

```javascript
var Quantify = require('quantify');
var metrics = new Quantify();
var gauge = metrics.gauge("cpuLoad", "Load");
var gaugeWithMetadata = metrics.gauge("connections", "Conn", {some: "metadata"});
gauge.update(17); // set to 17
gauge.update(10); // set to 10
gauge.update(122); // set to 122
```

### quantify.getMetrics(filters)

  * `filters`: _Object_ _(Default: undefined)_
    * `counters`: _RegExp_ _(Default: undefined)_ If specified, subscription
        will only return counters with names that match the RegExp.
    * `gauges`: _RegExp_ _(Default: undefined)_ If specified, subscription
        will only return gauges with names that match the RegExp.
    * `histograms`: _RegExp_ _(Default: undefined)_ If specified, subscription
        will only return histograms with names that match the RegExp.
    * `meters`: _RegExp_ _(Default: undefined)_ If specified, subscription
        will only return meters with names that match the RegExp.
    * `timers`: _RegExp_ _(Default: undefined)_ If specified, subscription
        will only return timers with names that match the RegExp.
  * Return: _Object_ Snapshot of metrics.

Synchronously calculate the snapshot of all metrics and return it.

With filters, one can specify what should be returned:

```javascript
var metrics = new Quantify();

var fooCounter = metrics.counter("foo");
var barCounter = metrics.counter("bar");

var fooSnasphot = metrics.getMetrics({filters: {counters: /foo/}});
console.log(fooSnasphot.counters.foo.value); // 0
console.log(fooSnasphot.counters.bar); // undefined

var barSnapshot = metrics.getMetrics({filters: {counters: /bar/}});
console.log(barSnapshot.counters.foo); // undefined
console.log(barSnapshot.counters.bar.value); // 0
```

### quantify.histogram(name, [metadata])

  * `name`: _String_ Histogram name.
  * `units`: _Object_ Units to use.
    * `measureUnit`: _String_ What specific feature/property/aspect is being measured (ex: request latency).
    * `sampleSizeUnit`: _String_ What is being measured (ex: web request).
  * `metadata`: _Object_ Optional metadata.
  * Return: _Histogram_ Instance of a Histogram entry.

Get or create a histogram with provided name.

```javascript
var Quantify = require('quantify');
var metrics = new Quantify();
var histogram = metrics.histogram("searchResultsReturned", {
    measureUnit: "Result",
    sampleSizeUnit: "Req"
});
var histogramWithMetadata = metrics.histogram("friends", {
    measureUnit: "Friend",
    sampleSizeUnit: "Req"
}, {some: "metadata"});
histogram.update(17);
histogram.update(10);
histogram.update(122);
```

### quantify.meter(name, [metadata])

  * `name`: _String_ Meter name.
  * `units`: _Object_ Units to use.
    * `rateUnit`: _String_ The rate of what is being measured per second (ex: web requests per second).
    * `updateCountUnit`: _String_ What is being measured (ex: web request).
  * `metadata`: _Object_ Optional metadata.
  * Return: _Meter_ Instance of a Meter entry.

Get or create a meter with provided name.

```javascript
var Quantify = require('quantify');
var metrics = new Quantify();
var meter = metrics.meter("requests", {
    rateUnit: "Req/s",
    updateCountUnit: "Req"
});
var meterWithMetadata = metrics.meter("events", {
    rateUnit: "Event/s",
    updateCountUnit: "Event"
}, {some: "metadata"});
meter.update();
meter.update();
meter.update(2);
```

### quantify.subscribe(config)

  * `config`: _Object
    * `filters`: _Object_ _(Default: undefined)_
      * `counters`: _RegExp_ _(Default: undefined)_ If specified, subscription will only return counters with names that match the RegExp.
      * `gauges`: _RegExp_ _(Default: undefined)_ If specified, subscription will only return gauges with names that match the RegExp.
      * `histograms`: _RegExp_ _(Default: undefined)_ If specified, subscription will only return histograms with names that match the RegExp.
      * `meters`: _RegExp_ _(Default: undefined)_ If specified, subscription will only return meters with names that match the RegExp.
      * `timers`: _RegExp_ _(Default: undefined)_ If specified, subscription will only return timers with names that match the RegExp.
    * `label`: _String_ _(Default: undefined)_ Optional label for human readibility.
  * Return: _String_ Unique subscription name.

Creates a new subscription. The subscription name returned has two uses. First, it is a name of a method to call when this subscription should emit current data. Second, it is a name of an event that will be emitted when the method with this subscription name is called.

```javascript
var metrics = new Quantify();

var subscriptionName = metrics.subscribe();
metrics.on(subscriptionName, function (data) {
    // report the data or do whatever
});

metrics[subscriptionName](); // trigger the subscription
```

Why? This is in order to decouple the timing of metric reporting from Quantify itself. Additionally, we decouple the timing of metric reporting from whatever reporters are interested in the particular subscription.

Another module can handle scheduling of when various metrics should be reported. If you want some things to be reported once a minute, but others once every five minutes, a way to achieve that in Quantify is to setup two subscriptions. For example:

```javascript
var metrics = new Quantify();

var everyMinute = metrics.subscribe();
var everyFiveMinutes = metrics.subscribe();

metrics.on(everyMinute, function (data) {
    // handle reporting the data
});
metrics.on(everyFiveMinutes, function (data) {
    // handle reporting the data
});

setInterval(function () { metrics[everyMinute](); }, 1000 * 60);
setInterval(function () { metrics[everyFiveMinutes](); }, 1000 * 60 * 5);
```

With filters, one can specify what should be reported for each subscription:

```javascript
var metrics = new Quantify();

var fooCounter = metrics.counter("requests", "Req");
var barCounter = metrics.counter("events", "Event");

var everyMinute = metrics.subscribe({filters: {counters: /requests/}});
var everyFiveMinutes = metrics.subscribe({filters: {counters: /events/}});

metrics.on(everyMinute, function (data) {
    console.log(data.counters.requests.value); // 0
    console.log(data.counters.events); // undefined
});
metrics.on(everyFiveMinutes, function (data) {
    console.log(data.counters.requests); // undefined
    console.log(data.counters.events.value); // 0
});

setInterval(function () { metrics[everyMinute](); }, 1000 * 60);
setInterval(function () { metrics[everyFiveMinutes](); }, 1000 * 60 * 5);
```

Lastly, Quantify enables mutliple handlers to subscribe to the emitted subscription event:

```javascript
var metrics = new Quantify();

var fooCounter = metrics.counter("requests", "Req");

var everyMinute = metrics.subscribe();

metrics.on(everyMinute, function (data) {
    // this is some sort of console reporter
    console.log(data.counters.requests.value); // 0
    console.log(data.counters.bar); // undefined
});
metrics.on(everyMinute, function (data) {
    // this is some sort of HTTP reporter
    var req = http.request(options, function (res) {
        // do something with response
    });
    req.end("requests:" + data.counters.requests.value);
});

setInterval(function () { metrics[everyMinute](); }, 1000 * 60);
```

### quantify.timer(name, [metadata])

  * `name`: _String_ Timer name.
  * `unit`: _Object_ Units to use.
    * `measureUnit`: _String_ What specific feature/property/aspect is being measured (ex: request latency).
    * `rateUnit`: _String_ The rate of what is being measured per second (ex: web requests per second).
    * `sampleSizeUnit`: _String_ What is being measured (ex: web request).
  * `metadata`: _Object_ Optional metadata.
  * Return: _Timer_ Instance of a Timer entry.

Get or create a timer with provided name.

```javascript
var Quantify = require('quantify');
var metrics = new Quantify();
var timer = metrics.timer("requestLatency", {
    measureUnit: "ms",
    rateUnit: "Req/s",
    sampleSizeUnit: "Req"
});
var timerWithMetadata = metrics.timer("processLatency", {
    measureUnit: "ms",
    rateUnit: "Process/s",
    sampleSizeUnit: "Process"
}, {some: "metadata"});
timer.update(177); // explicitly record a time interval
var stopwatch = timer.start(); // start measuring a time interval
setTimeout(function () {
    stopwatch.stop(); // stop measuring a time interval and record it (in milliseconds)
}, 100);
```

If you use `stopwatch` functionality, the interval is calculated in **milliseconds** and the value provided internally via `timer.update()` will be updated in **milliseconds**.

If you never use `stopwatch` for a specific timer instance, the unit of the `timer.update()` call are whatever you want them to be.

### quantify.unsubscribe(subscriptionName)

  * `subscriptionName`: _String_ Name of subscription to unsubscribe.
  * Return: _Boolean_ `false` if subcription does not exist, `true` if successfully unsubscribed.

### Event `<subscriptionName>`

  * `function (data) {}`
    * `data`: _Object_ Object containing counters, gauges, histograms, and meters corresponding to the given `<subscriptionName>`.
      * `latency`: _Number_ Number of milliseconds it took to prepare this subscription.
      * `counters`: _Object_ Object containing counters by name. Each counter having the properties: `unit`, `value`.
      * `gauges`: _Object_ Object containing gauges by name. Each gauge having the properties: `unit`, `value`.
      * `histograms`: _Object_ Object containing histograms by name. Each histogram having the properties: `updateCount`, `max`, `mean`, `median`, `min`, `percentile75`, `percentile95`, `percentile98`, `percentile99`, `percentile999`, `sampleSize`, `standardDeviation`, `measureUnit`, `sampleSizeUnit`.
      * `meters`: _Object_ Object containing meters by name. Each meter having the properties: `updateCount`, `fifteenMinuteRate`, `fiveMinuteRate`, `meanRate`, `oneMinuteRate`, `rateUnit`, `updateCountUnit`.
      * `timers`: _Object_ Object containing timers by name. Each timer having the properties: `updateCount`, `fifteenMinuteRate`, `fiveMinuteRate`, `meanRate`, `oneMinuteRate`, `max`, `mean`, `median`, `min`, `percentile75`, `percentile95`, `percentile98`, `percentile99`, `percentile999`, `sampleSize`, `standardDeviation`, `measureUnit`, `rateUnit`, `sampleSizeUnit`.

Each subscription emits an event uniquely named with a given `subscriptionName` and containing the appropriate `data` according to previously set subscription filters.

### Counter

An incrementing and decrementing value.

**Public API**

  * [counter.update(n)](#counterupdaten)
  * [counter.reset()](#counterreset)
  * [counter.value](#countervalue)

### counter.update(n)

  * `n`: _Integer_ Value to update the counter with. Use negative value to decrement.

Updates the counter value with provided integer. To decrement, use a negative integer.

### counter.reset()

Resets the counter value to 0.

### counter.value

Returns the current counter value.

### Gauge

The instantenous value of something.

**Public API**

  * [gauge.update(n)](#gaugeupdaten)
  * [gauge.value](#gaugevalue)

### gauge.update(n)

  * `n`: _Integer_ Gauge value to update with.

Updates the gauge with the provided value.

### gauge.value

Returns the current gauge value.

### Histogram

The statistical distribution of values in a stream of data.

This implementation uses weighted sampling and exponentially decaying reservoir described [here](https://github.com/dropwizard/metrics/pull/421).

**Public API**

  * [histogram.snapshot()](#histogramsnapshot)
  * [histogram.update(n)](#histogramupdaten)
  * [histogram.updateCount()](#histogramupdatecount)

### histogram.snapshot()

Returns the snapshot of the histogram at the present time. Snapshot is necessary because the Histogram implementation uses weighted sampling and exponentially decaying reservoir in order to give percentile and other statistical estimates while maintaining a fixed sample size and being responsive to changes. These estimates are time-dependent on when the histogram is updated and the time the histogram snapshot is taken. For more on snapshots see the pull request discussed [here](https://github.com/dropwizard/metrics/pull/421). For more on the statistics involved see [Metrics Metrics Everywhere (Slides)](http://codahale.com/codeconf-2011-04-09-metrics-metrics-everywhere.pdf) and [Metrics Metrics Everywhere (Video)](https://www.youtube.com/watch?v=czes-oa0yik).

The returned snapshot has the following available:

  * `snapshot.max()` - Returns the maximum value.
  * `snapshot.mean()` - Returns the mean value.
  * `snapshot.median()` - Returns the median value.
  * `snapshot.min()` - Returns the minimum value.
  * `snapshot.percentile75()` - Returns the 75th percentile value.
  * `snapshot.percentile95()` - Returns the 95th percentile value.
  * `snapshot.percentile98()` - Returns the 98th percentile value.
  * `snapshot.percentile99()` - Returns the 99th percentile value.
  * `snapshot.percentile999()` - Returns the 99.9th percentile value.
  * `snapshot.quantile(q)` - Returns the `q`th percentile value (`q` should be between 0.0 and 1.0).
  * `snapshot.size()` - Returns the number of values in the snapshot.
  * `snapshot.standardDeviation()` - Return the standard deviation.

### histogram.update(n)

  * `n`: _Integer_ Value to update the histogram with.

Updates the histogram with the provided value.

### histogram.updateCount()

Returns the count of total updates to the histogram.

### Meter

Measures the rate at which events occur.

**Public API**

  * [meter.fifteenMinuteRate()](#meterfifteenminuterate)
  * [meter.fiveMinuteRate()](#meterfiveminuterate)
  * [meter.meanRate()](#metermeanrate)
  * [meter.oneMinuteRate()](#meteroneminuterate)
  * [meter.update(n)](#meterupdaten)
  * [meter.updateCount()](#meterupdatecount)

### meter.fifteenMinuteRate()

Returns the fifteen minute rate in updates per second.

### meter.fiveMinuteRate()

Returns the five minute rate in updates per second.

### meter.meanRate()

Returns the mean rate since meter creation in updates per second.

### meter.oneMinuteRate()

Returns the one minute rate in updates per second.

### meter.update(n)

  * `n`: _Integer_ Value to update the meter with.

Updates the meter `n` times.

### meter.updateCount()

Returns the current count of meter updates.

### Timer

A combination of a histogram of the duration of an event and a meter of the rate of its occurence.

**Public API**

  * [timer.fifteenMinuteRate()](#timerfifteenminuterate)
  * [timer.fiveMinuteRate()](#timerfiveminuterate)
  * [timer.meanRate()](#timermeanrate)
  * [timer.oneMinuteRate()](#timeroneminuterate)
  * [timer.snapshot()](#timersnapshot)
  * [timer.update(n)](#timerupdaten)
  * [timer.updateCount()](#timerupdatecount)

### timer.fifteenMinuteRate()

Returns the fifteen minute rate in updates per second.

### timer.fiveMinuteRate()

Returns the five minute rate in updates per second.

### timer.meanRate()

Returns the mean rate since timer creation in updates per second.

### timer.oneMinuteRate()

Returns the one minute rate in updates per second.

### timer.snapshot()

Returns the snapshot of the histogram corresponding to the timer at the present time. See [histogram.snapshot()](#histogramsnapshot).

### timer.update(n)

  * `n`: _Integer_ Value to update the timer with.

Updates the timer with the provided value.

### timer.updateCount()

Returns the current count of timer updates.

## Sources

  * [Ten Billion a Day, One-Hundred Milliseconds Per - Monitoring Real-Time Bidding At AdRoll](http://www.infoq.com/presentations/erlang-bidding-system)
  * [measured](https://github.com/felixge/node-measured)
  * [Metrics Metrics Everywhere (Slides)](http://codahale.com/codeconf-2011-04-09-metrics-metrics-everywhere.pdf)
  * [Metrics Metrics Everywhere (Video)](https://www.youtube.com/watch?v=czes-oa0yik)
