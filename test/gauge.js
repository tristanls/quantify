/*

gauge.js - Gauge test

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

var Gauge = require('../entries/gauge.js');
var Quantify = require('../index.js');

var test = module.exports = {};

test['returns the same gauge object when given the same name'] = function (test) {
    test.expect(2);
    var metrics = new Quantify();
    var gauge = metrics.gauge("foo", "unit");
    var gauge2 = metrics.gauge("foo", "unit");

    test.ok(gauge instanceof Gauge);
    test.strictEqual(gauge, gauge2);

    test.done();
};

test['throws exception when creating gauge without a name'] = function (test) {
    test.expect(1);
    var metrics = new Quantify();
    test.throws(function () {
        metrics.gauge();
    }, Error);
    test.done();
};

test['creates a gauge with initial value of 0'] = function (test) {
    test.expect(1);
    var metrics = new Quantify();
    var gauge = metrics.gauge("foo", "unit");

    test.equal(gauge.value, 0);
    test.done();
};

test['update() updates the gauge'] = function (test) {
    test.expect(1);
    var metrics = new Quantify();
    var gauge = metrics.gauge("foo", "unit");
    gauge.update(7);

    test.equal(gauge.value, 7);
    test.done();
};
