function type (arg) {
  return Object.prototype.toString.call(arg).slice(8, -1).toLowerCase();
}

function isBrowserMutationObserver () {
  return typeof window !== 'undefined' && typeof MutationObserver !== 'undefined';
}

function Promise (callback) {
  var _this = this;
  this.PromiseStatus = 'pending';
  this.PromiseValue;
  this.onResolvedCallbacks = [];
  this.onRejectedCallbacks = [];
  this.element;
  this.isSupportMutationObserver = isBrowserMutationObserver();

  if (this.isSupportMutationObserver) {
    this.element = document.createElement('span');
  }

  this.handleCallback = function (cb) {
    if (this.isSupportMutationObserver) {
      var observer = new MutationObserver(function () {
        if (type(cb) === 'function') {
          cb();
          observer.disconnect();
        }
      });
      var config = {
        attributes: true
      };
      observer.observe(this.element, config);
      this.element.setAttribute('class', '');
    } else if (typeof window=== 'undefined' && typeof process !== 'undefined') {
      process.nextTick(cb);
    } else {
      setTimeout(cb);
    }
  }

  function resolve (value) {
    var cb = function () {
      if (_this.PromiseStatus === 'pending') {
        _this.PromiseStatus = 'fulfilled';
        _this.PromiseValue = value;
        _this.onResolvedCallbacks.forEach(function (fn) {
          fn(value);
        });
      }
    }
    _this.handleCallback(cb);
  }

  function reject (reason) {
    var cb = function () {
      if (_this.PromiseStatus === 'pending') {
        _this.PromiseStatus = 'rejected';
        _this.PromiseValue = reason;
        _this.onRejectedCallbacks.forEach(function (fn) {
          fn(reason);
        });
      }
    }
    _this.handleCallback(cb);
  }

  try {
    callback(resolve, reject);
  } catch (reason) {
    reject(reason);
  }
}

var resolutionProcedure = function (promise, x, resolve, reject) {
  // If promise and x refer to the same object, reject promise with a TypeError as the reason;
  if (promise === x) {
    reject(new TypeError(x));
  } else if (x instanceof Promise) {
    if (x.PromiseStatus === 'pending') {
      x.then(function (value) {
        resolutionProcedure(promise, value, resolve, reject);
      }, reject);
    } else {
      x.then(resolve, reject);
    }
  } else if (type(x) === 'object' || type(x) === 'function') {
    var then;
    var isResolution = false;
    try {
      then = x.then;
      if (type(then) === 'function') {
        then.call(x, function (value) {
          if (!isResolution) {
            isResolution = true;
            resolutionProcedure(promise, value, resolve, reject);
          }
        }, function (reason) {
          if (!isResolution) {
            isResolution = true;
            reject(reason);
          }
        });
      } else {
        resolve(x);
      }
    } catch (reason) {
      if (!isResolution) {
        isResolution = true;
        reject(reason);
      }
    }
  } else {
    resolve(x);
  }

}

Promise.prototype.then = function (onFulfilled, onRejected) {
  var promise2;
  var _this = this;
  onFulfilled = type(onFulfilled) === 'function' ? onFulfilled : function (value) { return value; };
  onRejected = type(onRejected) === 'function' ? onRejected : function (reason) { throw reason; };
  if (this.PromiseStatus === 'fulfilled') {
    promise2 = new Promise(function (resolve, reject) {
      var cb = function () {
        try {
          var x = onFulfilled(_this.PromiseValue);
          // If either onFulfilled or onRejected returns a value x, run the Promise Resolution Procedure [[Resolve]](promise2, x).
          resolutionProcedure(promise2, x, resolve, reject);
        } catch (reason) {
          reject(reason);
        }
      };
      _this.handleCallback(cb);
    });
  }

  if (this.PromiseStatus === 'rejected') {
    promise2 = new Promise(function (resolve, reject) {
      var cb = function () {
        try {
          var x = onRejected(_this.PromiseValue);
          // If either onFulfilled or onRejected returns a value x, run the Promise Resolution Procedure [[Resolve]](promise2, x).
          resolutionProcedure(promise2, x, resolve, reject);
        } catch (reason) {
          reject(reason);
        }
      };
      _this.handleCallback(cb);
    });
  }

  if (this.PromiseStatus === 'pending') {
    promise2 = new  Promise(function (resolve, reject) {
      _this.onResolvedCallbacks.push(function (value) {
        try {
          var x = onFulfilled(value);
          // If either onFulfilled or onRejected returns a value x, run the Promise Resolution Procedure [[Resolve]](promise2, x).
          resolutionProcedure(promise2, x, resolve, reject);
        } catch (reason) {
          reject(reason);
        }
      });
      _this.onRejectedCallbacks.push(function (reason) {
        try {
          var x = onRejected(reason);
          // If either onFulfilled or onRejected returns a value x, run the Promise Resolution Procedure [[Resolve]](promise2, x).
          resolutionProcedure(promise2, x, resolve, reject);
        } catch (reason) {
          reject(reason);
        }
      })
    });
  }
  return promise2;
}

Promise.prototype.catch = function(onRejected) {
  return this.then(undefined, onRejected)
}

Promise.deferred = function() {
  var dfd = {}
  dfd.promise = new Promise(function(resolve, reject) {
    dfd.resolve = resolve
    dfd.reject = reject
  })
  return dfd
}

Promise.resolve = function (value) {
  return new Promise(function (resolve, reject) {
    resolve(value);
  });
}

Promise.reject = function (value) {
  return new Promise(function (resolve, reject) {
    reject(value);
  });
}

export default Promise;
