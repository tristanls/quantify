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

```javascript
var Quantify = require('quantify');

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

counter.update(1); // increment
counter.update(-1); // decrement

gauge.update(17); // set

histogram.update(1227); // update
histogram.update(7122); // update

meter.update(); // mark
meter.update(10); // 10 "simultaneous" marks

var stopwatch = timer.start(); // start a timer
stopwatch.stop(); // stop a timer
timer.update(178); // explicitly update the timer with given value

console.dir(metrics.getMetrics()); // get metrics synchronously

var subscriptionName = metrics.subscribe({label: "mySubscription"});
metrics.on(subscriptionName, function (data) {
    // console logger
    console.log(data.label);
    console.log(data.counters.foo.value); // 0
    console.log(data.gauges.foo.value); // 17
    console.log(data.histograms.foo.max); // maximum
    console.log(data.histograms.foo.mean); // mean
    console.log(data.histograms.foo.median); // median
    console.log(data.histograms.foo.min); // minimum
    console.log(data.histograms.foo.percentile75); // 75th percentile
    console.log(data.histograms.foo.percentile95); // 95th percentile
    console.log(data.histograms.foo.percentile98); // 98th percentile
    console.log(data.histograms.foo.percentile99); // 99th percentile
    console.log(data.histograms.foo.percentile999); // 99.9th percentile
    console.log(data.histograms.foo.size); // size
    console.log(data.histograms.foo.standardDeviation); // standard deviation
    console.log(data.meters.foo.count); // count
    console.log(data.meters.foo.meanRate); // mean rate since creation
    console.log(data.meters.foo.oneMinuteRate); // one minute rate
    console.log(data.meters.foo.fiveMinuteRate); // five minute rate
    console.log(data.meters.foo.fifteenMinuteRate); // fifteen minute rate
    console.log(data.timers.foo.count); // count
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
    console.log(data.timers.foo.size); // sample size
    console.log(data.timers.foo.standardDeviation); // standard deviation
});
metrics.on(subscriptionName, function (data) {
    // HTTP logger
    var options = {
      hostname: 'mydomain.com',
      port: 80,
      path: '/metrics',
      method: 'POST'
    };
    var req = http.request(options, function(res) {
        console.log(res.statusCode);
    });
    req.write("label:" + data.label + '\n');
    // for counter and gauge FIELDS = ['value']
    req.write("counter.foo:" + data.counters.foo.value + "|c\n");
    req.write("gauge.foo:" + data.gauges.foo.value + "|g\n");
    metrics.histogram.FIELDS.forEach(function (field) {
        req.write("histogram.foo." + field + ":" + data.histograms.foo[field] + "|g\n");
    });
    metrics.meter.FIELDS.forEach(function (field) {
        req.write("meter.foo." + field + ":" + data.meters.foo[field] + "|g\n");
    });
    metrics.timer.FIELDS.forEach(function (field) {
        req.write("timer.foo." + field + ":" + data.timers.foo[field] + "|g\n");
    });
    req.end();
});

// invoke a specific subscription every minute
setInterval(function () { metrics[subscriptionName](); }, 1000 * 60);
```

## Test

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
  * [quantify.counter(name)](#quantifycountername)
  * [quantify.gauge(name)](#quantifygaugename)
  * [quantify.getMetrics(filters)](#quantifygetmetricsfilters)
  * [quantify.histogram(name)](#quantifyhistogramname)
  * [quantify.meter(name)](#quantifymetername)
  * [quantify.subscribe(config)](#quantifysubscribeconfig)
  * [quantify.timer(name)](#quantifytimername)
  * [quantify.unsubscribe(subscriptionName)](#quantifyunsubscribesubscriptionname)
  * [Event '&lt;subscriptionName&gt;'](#event-subscriptionname)

### Quantify.COUNTER_FIELDS

  * ['value']

Counter only has `value` field.

### Quantify.GAUGE_FIELDS

  * ['value']

Gauge only has `value` field.

### Quantify.HISTOGRAM_FIELDS

  * ['max', 'mean', 'median', 'min', 'percentile75', 'percentile95', 'percentile98', 'percentile99', 'percentile999', 'standardDeviation', 'size']

All histogram fields.

### Quantify.HISTOGRAM_MEASURE_FIELDS

  * ['max', 'mean', 'median', 'min', 'percentile75', 'percentile95', 'percentile98', 'percentile99', 'percentile999', 'standardDeviation']

`HISTOGRAM_MEASURE_FIELDS` are the `HISTOGRAM_FIELDS` that share the measure unit. The measure unit is the unit associated with the value given to `histogram.update(<value>)`.

### Quantify.METER_FIELDS

  * ['count', 'meanRate', 'oneMinuteRate','fiveMinuteRate', 'fifteenMinuteRate']

All meter fields.

### Quantify.METER_RATE_FIELDS

  * ['meanRate', 'oneMinuteRate', 'fiveMinuteRate', 'fifteenMinuteRate']

`METER_RATE_FIELDS` are the `METER_FIELDS` that are per second rates.

### Quantify.TIMER_FIELDS

  * ['count', 'meanRate', 'oneMinuteRate', 'fiveMinuteRate', 'fifteenMinuteRate', 'max', 'mean', 'median', 'min', 'percentile75', 'percentile95', 'percentile98', 'percentile99', 'percentile999', 'standardDeviation', 'size']

All timer fields.

### Quantify.TIMER_MEASURE_FIELDS

  * ['max', 'mean', 'median', 'min', 'percentile75', 'percentile95', 'percentile98', 'percentile99', 'percentile999', 'standardDeviation']

`TIMER_MEASURE_FIELDS` are the `TIMER_FIELDS` that share the measure unit. The measure unit is the unit associated with the value given to `timer.update(<value>)`.

### Quantify.TIMER_RATE_FIELDS

  * ['meanRate', 'oneMinuteRate', 'fiveMinuteRate', 'fifteenMinuteRate'];

`TIMER_RATE_FIELDS` are the `TIMER_FIELDS` that are per second rates.

### new Quantify(name)

  * `name`: _String_ Quantify instance name.

### quantify.counter(name)

  * `name`: _String_ Counter name.
  * Return: _Counter_ Instance of a Counter entry.

Get or create a counter with provided name.

```javascript
var Quantify = require('quantify');
var metrics = new Quantify();
var counter = metrics.counter("foo");
counter.update(1); // increment
counter.update(1); // increment
counter.update(-1); // decrement
```

### quantify.gauge(name)

  * `name`: _String_ Gauge name.
  * Return: _Gauge_ Instance of a Gauge entry.

Get or create a gauge with provided name.

```javascript
var Quantify = require('quantify');
var metrics = new Quantify();
var gauge = metrics.gauge("foo");
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

### quantify.histogram(name)

  * `name`: _String_ Histogram name.
  * Return: _Histogram_ Instance of a Histogram entry.

Get or create a histogram with provided name.

```javascript
var Quantify = require('quantify');
var metrics = new Quantify();
var histogram = metrics.histogram("foo");
histogram.update(17);
histogram.update(10);
histogram.update(122);
```

### quantify.meter(name)

  * `name`: _String_ Meter name.
  * Return: _Meter_ Instance of a Meter entry.

Get or create a meter with provided name.

```javascript
var Quantify = require('quantify');
var metrics = new Quantify();
var meter = metrics.meter("foo");
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

var fooCounter = metrics.counter("foo");
var barCounter = metrics.counter("bar");

var everyMinute = metrics.subscribe({filters: {counters: /foo/}});
var everyFiveMinutes = metrics.subscribe({filters: {counters: /bar/}});

metrics.on(everyMinute, function (data) {
    console.log(data.counters.foo.value); // 0
    console.log(data.counters.bar); // undefined
});
metrics.on(everyFiveMinutes, function (data) {
    console.log(data.counters.foo); // undefined
    console.log(data.counters.bar.value); // 0
});

setInterval(function () { metrics[everyMinute](); }, 1000 * 60);
setInterval(function () { metrics[everyFiveMinutes](); }, 1000 * 60 * 5);
```

Lastly, Quantify enables mutliple handlers to subscribe to the emitted subscription event:

```javascript
var metrics = new Quantify();

var fooCounter = metrics.counter("foo");

var everyMinute = metrics.subscribe();

metrics.on(everyMinute, function (data) {
    // this is some sort of console reporter
    console.log(data.counters.foo.value); // 0
    console.log(data.counters.bar); // undefined
});
metrics.on(everyMinute, function (data) {
    // this is some sort of HTTP reporter
    var req = http.request(options, function (res) {
        // do something with response
    });
    req.end("foo:" + data.counters.foo.value);
});

setInterval(function () { metrics[everyMinute](); }, 1000 * 60);
```

### quantify.timer(name)

  * `name`: _String_ Timer name.
  * Return: _Timer_ Instance of a Timer entry.

Get or create a timer with provided name.

```javascript
var Quantify = require('quantify');
var metrics = new Quantify();
var timer = metrics.timer("foo");
timer.update(177); // explicitly record a time interval
var stopwatch = timer.start(); // start measuring a time interval
setTimeout(function () {
    stopwatch.stop(); // stop measuring a time interval and record it
}, 100);
```

If you use `stopwatch` functionality, the interval is calculated in milliseconds.

### quantify.unsubscribe(subscriptionName)

  * `subscriptionName`: _String_ Name of subscription to unsubscribe.
  * Return: _Boolean_ `false` if subcription does not exist, `true` if successfully unsubscribed.

### Event `<subscriptionName>`

  * `function (data) {}`
    * `data`: _Object_ Object containing counters, gauges, histograms, and meters corresponding to the given `<subscriptionName>`.
      * `latency`: _Number_ Number of milliseconds it took to prepare this subscription.
      * `counters`: _Object_ Object containing counters by name. Each counter having the property: `value`.
      * `gauges`: _Object_ Object containing gauges by name. Each gauge having the property: `value`.
      * `histograms`: _Object_ Object containing histograms by name. Each histogram having the properties: `max`, `mean`, `median`, `min`, `percentile75`, `percentile95`, `percentile98`, `percentile99`, `percentile999`, `size`, `standardDeviation`.
      * `meters`: _Object_ Object containing meters by name. Each meter having the properties: `count`, `fifteenMinuteRate`, `fiveMinuteRate`, `meanRate`, `oneMinuteRate`.

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

  * [histogram.count()](#histogramcount)
  * [histogram.snapshot()](#histogramsnapshot)
  * [histogram.update(n)](#histogramupdaten)

### histogram.count()

Returns the count of total updates to the histogram.

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

### Meter

Measures the rate at which events occur.

**Public API**

  * [meter.count](#metercount)
  * [meter.fifteenMinuteRate()](#meterfifteenminuterate)
  * [meter.fiveMinuteRate()](#meterfiveminuterate)
  * [meter.meanRate()](#metermeanrate)
  * [meter.oneMinuteRate()](#meteroneminuterate)
  * [meter.update(n)](#meterupdaten)

### meter.count

Returns the current count of meter updates.

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

### Timer

A combination of a histogram of the duration of an event and a meter of the rate of its occurence.

**Public API**

  * [timer.count()](#timercount)
  * [timer.fifteenMinuteRate()](#timerfifteenminuterate)
  * [timer.fiveMinuteRate()](#timerfiveminuterate)
  * [timer.meanRate()](#timermeanrate)
  * [timer.oneMinuteRate()](#timeroneminuterate)
  * [timer.snapshot()](#timersnapshot)
  * [timer.update(n)](#timerupdaten)

### timer.count()

Returns the current count of timer updates.

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

## Sources

  * [Ten Billion a Day, One-Hundred Milliseconds Per - Monitoring Real-Time Bidding At AdRoll](http://www.infoq.com/presentations/erlang-bidding-system)
  * [measured](https://github.com/felixge/node-measured)
  * [Metrics Metrics Everywhere (Slides)](http://codahale.com/codeconf-2011-04-09-metrics-metrics-everywhere.pdf)
  * [Metrics Metrics Everywhere (Video)](https://www.youtube.com/watch?v=czes-oa0yik)
