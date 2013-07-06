;(function(){

/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module.exports) {
    module.exports = {};
    module.client = module.component = true;
    module.call(this, module.exports, require.relative(resolved), module);
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("component-bind/index.js", function(exports, require, module){

/**
 * Slice reference.
 */

var slice = [].slice;

/**
 * Bind `obj` to `fn`.
 *
 * @param {Object} obj
 * @param {Function|String} fn or string
 * @return {Function}
 * @api public
 */

module.exports = function(obj, fn){
  if ('string' == typeof fn) fn = obj[fn];
  if ('function' != typeof fn) throw new Error('bind() requires a function');
  var args = [].slice.call(arguments, 2);
  return function(){
    return fn.apply(obj, args.concat(slice.call(arguments)));
  }
};

});
require.register("visionmedia-debug/index.js", function(exports, require, module){
if ('undefined' == typeof window) {
  module.exports = require('./lib/debug');
} else {
  module.exports = require('./debug');
}

});
require.register("visionmedia-debug/debug.js", function(exports, require, module){

/**
 * Expose `debug()` as the module.
 */

module.exports = debug;

/**
 * Create a debugger with the given `name`.
 *
 * @param {String} name
 * @return {Type}
 * @api public
 */

function debug(name) {
  if (!debug.enabled(name)) return function(){};

  return function(fmt){
    fmt = coerce(fmt);

    var curr = new Date;
    var ms = curr - (debug[name] || curr);
    debug[name] = curr;

    fmt = name
      + ' '
      + fmt
      + ' +' + debug.humanize(ms);

    // This hackery is required for IE8
    // where `console.log` doesn't have 'apply'
    window.console
      && console.log
      && Function.prototype.apply.call(console.log, console, arguments);
  }
}

/**
 * The currently active debug mode names.
 */

debug.names = [];
debug.skips = [];

/**
 * Enables a debug mode by name. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} name
 * @api public
 */

debug.enable = function(name) {
  try {
    localStorage.debug = name;
  } catch(e){}

  var split = (name || '').split(/[\s,]+/)
    , len = split.length;

  for (var i = 0; i < len; i++) {
    name = split[i].replace('*', '.*?');
    if (name[0] === '-') {
      debug.skips.push(new RegExp('^' + name.substr(1) + '$'));
    }
    else {
      debug.names.push(new RegExp('^' + name + '$'));
    }
  }
};

/**
 * Disable debug output.
 *
 * @api public
 */

debug.disable = function(){
  debug.enable('');
};

/**
 * Humanize the given `ms`.
 *
 * @param {Number} m
 * @return {String}
 * @api private
 */

debug.humanize = function(ms) {
  var sec = 1000
    , min = 60 * 1000
    , hour = 60 * min;

  if (ms >= hour) return (ms / hour).toFixed(1) + 'h';
  if (ms >= min) return (ms / min).toFixed(1) + 'm';
  if (ms >= sec) return (ms / sec | 0) + 's';
  return ms + 'ms';
};

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

debug.enabled = function(name) {
  for (var i = 0, len = debug.skips.length; i < len; i++) {
    if (debug.skips[i].test(name)) {
      return false;
    }
  }
  for (var i = 0, len = debug.names.length; i < len; i++) {
    if (debug.names[i].test(name)) {
      return true;
    }
  }
  return false;
};

/**
 * Coerce `val`.
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

// persist

if (window.localStorage) debug.enable(localStorage.debug);

});
require.register("engine.io-reconnect/lib/index.js", function(exports, require, module){
/**
 * Module dependencies.
 */

var debug('debug')('engine.io-reconnect');

// Get bind component for node and browser.
var bind;
try {
  bind = require('bind');
} catch(e){
  bind = require('bind-component');
}

/**
 * Module exports.
 */

module.exports = Reconnect;

/**
 * `Reconnect` constructor.
 *
 * @param {Socket} engine instance
 * @param {Object} options
 * @api public
 */

function Reconnect(io, opts) {
  if (!(this instanceof Reconnect)) return new Reconnect(io, opts);

  opts = opts || {};
  this.io = io;
  this.attempt = 0;
  this.timeoutTimer = null;
  this.reconnectTimer = null;
  this.attempts(opts.attempts || Infinity);
  this.delay(opts.delay || 1000);
  this.delayMax(opts.delayMax || 5000);
  this.timeout(null == opts.timeout ? 10000 : opts.timeout);
  this.reconnection(null == opts.reconnection ? true : opts.reconnection);

  // we need to overwrite socket close method
  this._close = this.io.close;

  // bind events
  this.bind();

  // lets return the socket object
  return this.io;
}

/**
 * Bind `socket` events.
 *
 * @api private
 */

Reconnect.prototype.bind = function () {

  debug('binding reconnect events and methods');

  // avoid unnecessary binds
  if (this.io.reconnect) return this;

  // overwriting socket close method
  this.io.close = bind(this, 'close');

  // adding reconnect methods to socket
  this.io.reconnect = bind(this, 'reconnect');
  this.io.reconnection = bind(this, 'reconnection');
  this.io.reconnectionDelay = bind(this, 'delay');
  this.io.reconnectionDelayMax = bind(this, 'delayMax');
  this.io.reconnectionTimeout = bind(this, 'timeout');
  this.io.reconnectionAttempts = bind(this, 'attempts');

  // caching event functions
  this.onopen = bind(this, 'onopen');
  this.onclose = bind(this, 'onclose');
  this.onerror = bind(this, 'onerror');

  // doing the actuall bind
  this.io.on('close', this.onclose);
  this.io.on('open', this.onopen);
  this.io.on('error', this.onerror);
};

/**
 * Attempt to re-open `socket` connection.
 *
 * @return {Reconnect} self
 * @api private
 */

Reconnect.prototype.open = function () {
  this.io.open();
  if (false !== this._timeout && !this.timeoutTimer) {
    debug('connect attempt will timeout after %d', this._timeout);
    this.timeoutTimer = setTimeout(bind(this, function () {
      debug('connect attempt timed out after %d', this._timeout);
      this.close();
      this.clear();
      this.io.emit('reconnect_timeout', timeout);
    }), this._timeout);
  }
  return this;
};

/**
 * Called upon engine open event.
 *
 * @api private
 */

Reconnect.prototype.onopen = function () {
  if (this.reconnecting) {
    debug('reconnect success');
    this.onreconnect();
  }
  return this;
};

/**
 * Close the current socket.
 *
 * @api private
 */

Reconnect.prototype.close = function () {
  this.skip = true;
  // lets return the original close output
  return this._close.call(this.io);
};

/**
 * Called upon engine close.
 *
 * @api private
 */

Reconnect.prototype.onclose = function () {
  if (!this.skip && this._reconnection) {
    this.reconnect();
  }
  return this;
};

/**
 * Called upon connection error.
 *
 * @api private
 */

Reconnect.prototype.onerror = function (error) {
  if (this.reconnecting) {
    debug('reconnect attempt error');
    this.reconnect();
    this.io.emit('connect_error', error);
  }
  return this;
};

/**
 * Clean timers.
 *
 * @api private
 */

Reconnect.prototype.clear = function () {
  clearTimeout(this.reconnectTimer);
  clearTimeout(this.timeoutTimer);
  this.reconnectTimer = null;
  this.timeoutTimer = null;
  return this;
};

/**
 * Sets the `reconnection` config.
 *
 * @param {Boolean} true/false if it should automatically reconnect
 * @return {Reconnect} self or value
 * @api public
 */

Reconnect.prototype.reconnection = function (v) {
  if (!arguments.length) return this._reconnection;
  this._reconnection = !!v;
  return this;
};

/**
 * Sets the reconnection attempts config.
 *
 * @param {Number} max reconnection attempts before giving up
 * @return {Reconnect} self or value
 * @api public
 */

Reconnect.prototype.attempts = function (v) {
  if (!arguments.length) return this._attempts;
  this._attempts = v;
  return this;
};

/**
 * Sets the delay between reconnections.
 *
 * @param {Number} delay
 * @return {Reconnect} self or value
 * @api public
 */

Reconnect.prototype.delay = function (v) {
  if (!arguments.length) return this._delay;
  this._delay = v;
  return this;
};

/**
 * Sets the maximum delay between reconnections.
 *
 * @param {Number} delay
 * @return {Reconnect} self or value
 * @api public
 */

Reconnect.prototype.delayMax = function (v) {
  if (!arguments.length) return this._delayMax;
  this._delayMax = v;
  return this;
};

/**
 * Sets the connection timeout. `false` to disable
 *
 * @return {Reconnect} self or value
 * @api public
 */

Reconnect.prototype.timeout = function (v) {
  if (!arguments.length) return this._timeout;
  this._timeout = v;
  return this;
};

/**
 * Attempt a reconnection.
 *
 * @api private
 */

Reconnect.prototype.reconnect = function () {
  this.attempt++;
  if (this.attempt > this._attempts) {
    this.reconnecting = false;
    this.io.emit('reconnect_failed');
  } else {
    var delay = this.attempt * this.delay();
    delay = Math.min(delay, this.delayMax());
    debug('will wait %dms before reconnect attempt', delay);
    this.reconnecting = true;
    this.reconnectTimer = setTimeout(bind(this, function(){
      debug('attemptign reconnect');
      clearTimeout(this.reconnectTimer);
      this.open();
    }), delay);
  }
  return this;
};

/**
 * Called upon successful reconnect.
 *
 * @api private
 */

Reconnect.prototype.onreconnect = function () {
  var attempt = this.attempt;
  this.attempt = 0;
  this.reconnecting = false;
  this.clear();
  this.io.emit('reconnect', attempt);
  return this;
};

});
require.register("engine.io-reconnect/index.js", function(exports, require, module){
module.exports = require('./lib');
});
require.alias("component-bind/index.js", "engine.io-reconnect/deps/bind/index.js");
require.alias("component-bind/index.js", "bind/index.js");

require.alias("visionmedia-debug/index.js", "engine.io-reconnect/deps/debug/index.js");
require.alias("visionmedia-debug/debug.js", "engine.io-reconnect/deps/debug/debug.js");
require.alias("visionmedia-debug/index.js", "debug/index.js");

require.alias("engine.io-reconnect/index.js", "engine.io-reconnect/index.js");

if (typeof exports == "object") {
  module.exports = require("engine.io-reconnect");
} else if (typeof define == "function" && define.amd) {
  define(function(){ return require("engine.io-reconnect"); });
} else {
  this["eioReconnect"] = require("engine.io-reconnect");
}})();