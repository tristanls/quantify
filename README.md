# quantify

_Stability: 1 - [Experimental](https://github.com/tristanls/stability-index#stability-1---experimental)_

[![NPM version](https://badge.fury.io/js/quantify.png)](http://npmjs.org/package/quantify)

Yet another Node.js metrics module.

This one was created and inspired by the [measured](https://github.com/felixge/node-measured) module. Much as the creator of that one, I wanted to better understand the underlying algorithms, as well as provide for a different interface for interacting with metrics informed by the _metric_, _entry_, _reporter_, _subscription_ ideas of [@bltroutwine](https://twitter.com/bltroutwine) from [Ten Billion a Day, One-Hundred Milliseconds Per - Monitoring Real-Time Bidding At AdRoll](http://www.infoq.com/presentations/erlang-bidding-system) presentation.

The _subscription_ concept is elaborated in the [quantify.subscribe(config)](#quantifysubscribeconfig) section.

## Usage

```javascript
var metrics = require('quantify');

// create a counter
var counter = metrics.counter("foo");
// create a gauge
var gauge = metrics.gauge("foo");

counter.update(1); // increment
counter.update(-1); // decrement

gauge.update(17); // set

var subscriptionName = metrics.subscribe({label: "mySubscription"});
metrics.on(subscriptionName, function (data) {
    // console logger
    console.log(data.label);
    console.log(data.counters.foo.value); // 0
    console.log(data.gauges.foo.value); // 17
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
    req.write("foo:" + data.counters.foo.value + "|c\n");
    req.write("foo:" + data.gauges.foo.value + "|g\n");
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

### Quantify

**Public API***

  * [new Quantify(name)](#new-quantifyname)
  * [quantify.counter(name)](#quantifycountername)
  * [quantify.gauge(name)](#quantifygaugename)
  * [quantify.subscribe(config)](#quantifysubscribeconfig)
  * [quantify.unsubscribe(subscriptionName)](#quantifyunsubscribesubscriptionname)

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

### quantify.subscribe(config)

  * `config`: _Object
    * `filters`: _Object_ _(Default: undefined)_
      * `counters`: _RegExp_ _(Default: undefined)_ If specified, subscription will only return counters with names that match the RegExp.
      * `gauges`: _RegExp_ _(Default: undefined)_ If specified, subscription will only return gauges with names that match the RegExp.
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

Lastly, the reason Quantify emits events instead of returning a value from a method call is so that multiple handlers can subscribe to the event:

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

### quantify.unsubscribe(subscriptionName)

  * `subscriptionName`: _String_ Name of subscription to unsubscribe.
  * Return: _Boolean_ `false` if subcription does not exist, `true` if successfully unsubscribed.


## Sources

  * [Ten Billion a Day, One-Hundred Milliseconds Per - Monitoring Real-Time Bidding At AdRoll](http://www.infoq.com/presentations/erlang-bidding-system)
  * [measured](https://github.com/felixge/node-measured)

### Counter

**Public API***

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

**Public API**

  * [gauge.update(n)](#gaugeupdaten)
  * [gauge.value](#gaugevalue)

### gauge.update(n)

  * `n`: _Integer_ Gauge value to update with.

Updates the gauge with the provided value.

### gauge.value

Returns the current gauge value.
