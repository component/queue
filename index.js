
/**
 * Module dependencies.
 */

var Emitter;
var bind;

try {
  Emitter = require('emitter');
  bind = require('bind');
} catch (err) {
  Emitter = require('component-emitter');
  bind = require('component-bind');
}

/**
 * Expose `Queue`.
 */

module.exports = Queue;

/**
 * Initialize a `Queue` with the given options:
 *
 *  - `concurrency` [1]
 *  - `timeout` [0]
 *
 * @param {Object} options
 * @api public
 */

function Queue(options) {
  options = options || {};
  this.timeout = options.timeout || 0;
  this.concurrency = options.concurrency || 1;
  this.pending = 0;
  this.jobs = [];
}

/**
 * Mixin emitter.
 */

Emitter(Queue.prototype);

/**
 * Return queue length.
 *
 * @return {Number}
 * @api public
 */

Queue.prototype.length = function(){
  return this.pending + this.jobs.length;
};

/**
 * Queue `fn` for execution.
 *
 * @param {Function} fn
 * @param {Function} [cb]
 * @api public
 */

Queue.prototype.push = function(fn, cb){
  this.jobs.push([fn, cb]);
  setTimeout(bind(this, this.run), 0);
};

/**
 * Run jobs at the specified concurrency.
 *
 * @api private
 */

Queue.prototype.run = function(){
  while (this.pending < this.concurrency) {
    var job = this.jobs.shift();
    if (!job) break;
    this.exec(job);
  }
};

/**
 * Execute `job`.
 *
 * @param {Array} job
 * @api private
 */

Queue.prototype.exec = function(job){
  var self = this;
  var ms = this.timeout;

  var fn = job[0];
  var cb = job[1];
  if (ms) fn = timeout(fn, ms);

  this.pending++;
  fn(function(err, res){
    cb && cb(err, res);
    self.pending--;
    self.run();
  });
};

/**
 * Decorate `fn` with a timeout of `ms`.
 *
 * @param {Function} fn
 * @param {Function} ms
 * @return {Function}
 * @api private
 */

function timeout(fn, ms) {
  return function(cb){
    var done;

    var id = setTimeout(function(){
      done = true;
      var err = new Error('Timeout of ' + ms + 'ms exceeded');
      err.timeout = timeout;
      cb(err);
    }, ms);

    fn(function(err, res){
      if (done) return;
      clearTimeout(id);
      cb(err, res);
    });
  }
}
