
/**
 * Module dependencies.
 */

var Emitter = require('emitter');

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
 * Queue `fn` for execution.
 *
 * @param {Function} fn
 * @param {Function} [cb]
 * @api public
 */

Queue.prototype.push = function(fn, cb){
  this.jobs.push([fn, cb]);
  setTimeout(this.run.bind(this), 0);
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
  var timeout = this.timeout;
  var self = this;
  var done;

  this.pending++;
  var fn = job[0];
  var cb = job[1];

  if (timeout) {
    var id = setTimeout(function(){
      done = true;
      var err = new Error('Timeout of ' + timeout + 'ms exceeded');
      err.timeout = timeout;
      cb && cb(err);
    }, timeout);
  }

  fn(function(err, res){
    if (done) return;
    if (timeout) clearTimeout(id);
    cb && cb(err, res);
    self.pending--;
    self.run();
  });
};
