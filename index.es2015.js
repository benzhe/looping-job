'use strict';

class Loop {
    constructor(job, config) {
        this.mainFunc = job;
        this.config = {};
        this.config.stopAtError = config.stopAtError;
        this.config.singleJobTimeout = config.singleJobTimeout || 60 * 1000;
        this.config.singleJobDelay = config.singleJobDelay || 0;
        this.config.runImmediately = config.runImmediately || false;
        return this;
    }

    run(scope) {
        this.scope = scope ? scope : this;
        this._iterator = 0;
        this.mainFunc && this._start();
        return this;
    }

    restart() {
        this._iterator = 0;
        this.mainFunc && this._start();
        return this;
    }

    stop() {
        this.disabled = true;
    }

    pause() {
        this.disabled = true;
    }

    resume() {
        if (!this.disabled) return;
        this.disabled = false;
        this._next(null);
    }

    catch(errorFunc) {
        this.errorFunc = errorFunc;
        return this;
    }

    tick(tickFunc) {
        this.tickFunc = tickFunc;
        return this;
    }

    // running this loop
    _start() {
        this._beginTimestamp = Date.now();
        this._next(null);
    }

    _next(err, data) {
        let context = this.context || this;
        if (this.isExcuted) return;
        if (err) {
            context._throw(err);
        }
        if (this.timer !== null) clearTimeout(this.timer);
        if (err && context.config.stopAtError) return;
        if (context.disabled === true) return;
        if (context.tickFunc && !context.tickFunc(context._iterator)) return;

        let newJob = {};
        newJob.index = context._iterator++;
        newJob.main = context._next.bind(newJob);
        newJob.context = context;
        if(context.config && context.config.runImmediately && context._iterator === 1) {
            context.mainFunc.bind(context.scope)(newJob.main, data);
        }
        else {
            setTimeout(function() {
                newJob.timer = context._setSingleJobTimer(newJob);
                if (context.scope) context.mainFunc(newJob.main, data);
                else context.mainFunc.bind(context.scope)(newJob.main, data);
            }, context.config.singleJobDelay);
        }
    }

    _throw(err) {
        if (!this.config.stopAtError) this._log("Error catched, but will continue.");
        else if (this.errorFunc) this.errorFunc(err);
        else throw(err);
    }

    _log(info) {
        // console.log(info);
    }

    _setSingleJobTimer(job) {
        return setTimeout(() => {
            job.isExcuted = true;
            this._throw("Job " + job.index + " Timeout");
            // create a new loop
            this._next(null);
        }, this.config.singleJobTimeout)
    }

}

module.exports = Loop;
