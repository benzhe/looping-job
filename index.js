'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Loop = function () {
    function Loop(job, config) {
        _classCallCheck(this, Loop);

        this.mainFunc = job;
        this.config = {};
        this.config.stopAtError = config.stopAtError;
        this.config.singleJobTimeout = config.singleJobTimeout || 60 * 1000;
        this.config.singleJobDelay = config.singleJobDelay || 0;
        this.config.runImmediately = config.runImmediately || false;
        return this;
    }

    _createClass(Loop, [{
        key: "run",
        value: function run(scope) {
            this.scope = scope ? scope : this;
            this._iterator = 0;
            this.mainFunc && this._start();
            return this;
        }
    }, {
        key: "restart",
        value: function restart() {
            this._iterator = 0;
            this.mainFunc && this._start();
            return this;
        }
    }, {
        key: "stop",
        value: function stop() {
            this.disabled = true;
        }
    }, {
        key: "pause",
        value: function pause() {
            this.disabled = true;
        }
    }, {
        key: "resume",
        value: function resume() {
            if (!this.disabled) return;
            this.disabled = false;
            this._next(null);
        }
    }, {
        key: "catch",
        value: function _catch(errorFunc) {
            this.errorFunc = errorFunc;
            return this;
        }
    }, {
        key: "tick",
        value: function tick(tickFunc) {
            this.tickFunc = tickFunc;
            return this;
        }

        // running this loop

    }, {
        key: "_start",
        value: function _start() {
            this._beginTimestamp = Date.now();
            this._next(null);
        }
    }, {
        key: "_next",
        value: function _next(err, data) {
            var context = this.context || this;
            if (this.isExcuted) return;
            if (err) {
                context._throw(err);
            }
            if (this.timer !== null) clearTimeout(this.timer);
            if (err && context.config.stopAtError) return;
            if (context.disabled === true) return;
            if (context.tickFunc && !context.tickFunc(context._iterator)) return;

            var newJob = {};
            newJob.index = context._iterator++;
            newJob.main = context._next.bind(newJob);
            newJob.context = context;
            if (context.config && context.config.runImmediately && context._iterator === 1) {
                context.mainFunc.bind(context.scope)(newJob.main, data);
            } else {
                setTimeout(function () {
                    newJob.timer = context._setSingleJobTimer(newJob);
                    if (context.scope) context.mainFunc(newJob.main, data);else context.mainFunc.bind(context.scope)(newJob.main, data);
                }, context.config.singleJobDelay);
            }
        }
    }, {
        key: "_throw",
        value: function _throw(err) {
            if (!this.config.stopAtError) this._log("Error catched, but will continue.");else if (this.errorFunc) this.errorFunc(err);else throw err;
        }
    }, {
        key: "_log",
        value: function _log(info) {
            // console.log(info);
        }
    }, {
        key: "_setSingleJobTimer",
        value: function _setSingleJobTimer(job) {
            var _this = this;

            return setTimeout(function () {
                job.isExcuted = true;
                _this._throw("Job " + job.index + " Timeout");
                // create a new loop
                _this._next(null);
            }, this.config.singleJobTimeout);
        }
    }]);

    return Loop;
}();

module.exports = Loop;
