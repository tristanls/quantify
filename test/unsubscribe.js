/*

unsubscribe.js - unsubscribe() test

The MIT License (MIT)

Copyright (c) 2014 Tristan Slominski

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

var test = module.exports = {};

test['removes method with subscription name and returns true'] = function (test) {
    test.expect(3);
    var metrics = new Quantify();

    var subscriptionName = metrics.subscribe();
    test.ok(metrics[subscriptionName]);
    var result = metrics.unsubscribe(subscriptionName);
    test.ok(!metrics[subscriptionName]);
    test.strictEqual(result, true);
    test.done();
};

test['removes listeners for subscription name and returns true'] = function (test) {
    test.expect(3);
    var metrics = new Quantify();

    var subscriptionName = metrics.subscribe();
    metrics.on(subscriptionName, function () {});
    metrics.on(subscriptionName, function () {});
    test.equal(metrics.listeners(subscriptionName).length, 2);
    var result = metrics.unsubscribe(subscriptionName);
    test.equal(metrics.listeners(subscriptionName).length, 0);
    test.strictEqual(result, true);
    test.done();
};

test['returns false if subscription name is not valid'] = function (test) {
    test.expect(1);
    var metrics = new Quantify();

    var result = metrics.unsubscribe("foo");
    test.strictEqual(result, false);
    test.done();
};
