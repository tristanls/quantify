/*

counter.js - Counter test

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

var Counter = require('../entries/counter.js');
var Quantify = require('../index.js');

var test = module.exports = {};

test['returns the same counter object when given the same name'] = function (test) {
    test.expect(2);
    var metrics = new Quantify();
    var counter = metrics.counter("foo", "unit");
    var counter2 = metrics.counter("foo", "unit");

    test.ok(counter instanceof Counter);
    test.strictEqual(counter, counter2);

    test.done();
};

test['throws exception when creating counter without a name'] = function (test) {
    test.expect(1);
    var metrics = new Quantify();
    test.throws(function () {
        metrics.counter();
    }, Error);
    test.done();
};

test['creates a counter with initial value of 0'] = function (test) {
    test.expect(1);
    var metrics = new Quantify();
    var counter = metrics.counter("foo", "unit");

    test.equal(counter.value, 0);
    test.done();
};

test['update() updates the counter'] = function (test) {
    test.expect(1);
    var metrics = new Quantify();
    var counter = metrics.counter("foo", "unit");
    counter.update(7);
    counter.update(-3);

    test.equal(counter.value, 4);
    test.done();
};
