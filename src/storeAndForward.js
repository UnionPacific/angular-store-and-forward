'use strict';

/**
 * @ngdoc overview
 * @name ue.store-and-forward
 *
 * @description
 * An HTTP fallback solution that saves your failed HTTP requests and persists
 * them over page refreshes to be resubmitted next time a successful request is
 * detected.
 */

angular.module('ue.store-and-forward', [])
/**
 * @ngdoc service
 * @name ue.store-and-forward.factory:storeAndForwardRequestInterceptor
 * @function
 *
 * @description
 *
 * `storeAndForwardRequestInterceptor` is used to add/remove http requests
 * to storage.  No configuration on the interceptor is required.
 *
 * Don't forget to add the interceptor:
 *
 * <pre>
 *   angular.module('testmodule', ['ue.store-and-forward'])
 *    .config(function($httpProvider) {
 *      $httpProvider.interceptors.push('storeAndForwardRequestInterceptor');
 *    });
 * </pre>
 */
.factory('storeAndForwardRequestInterceptor', function($q, $injector) {
  var storeAndForward;
  return {
    'response': function(response) {
      storeAndForward = storeAndForward || $injector.get('storeAndForward');
      storeAndForward.flush();
      return response;
    },
    'responseError': function(rejection) {
      storeAndForward = storeAndForward || $injector.get('storeAndForward');
      storeAndForward.add(rejection);
      return $q.reject(rejection);
    }
  };
})

/**
 * @ngdoc service
 * @name ue.store-and-forward.storeAndForwardProvider
 * @function
 *
 * @description
 *
 * `storeAndForwardProvider` is the provider for the to configure
 * which requests are captured when they fail.
 *
 * Configuration is available on the provider
 *
 * <pre>
 *   angular.module('testmodule', ['ue.store-and-forward'])
 *    .config(function(storeAndForwardProvider) {
 *      storeAndForwardProvider.setFailCodes([0, 503]); // etc.
 *    });
 * </pre>
 */
.provider('storeAndForward', function() {

  // Private variables
  var failCode = [0],
    includeAllFailingRequests = false,
    localStorageKey = 'storeAndForward.pending',
    failCodeExceptions = [];




  /**
   * @ngdoc service
   * @name ue.store-and-forward.storeAndForward
   * @function
   *
   * @description
   *
   * `storeAndForward` is the service to queue failed requests and manage
   * the `localStorage` persistance.
   * Configuration is available on the provider
   *
   */
  function storeAndForward($http, $log) {
    var pendingRequests = [];
    var initialFromLocalStorage = localStorage.getItem(localStorageKey);
    if ( !! initialFromLocalStorage) {
      pendingRequests = pendingRequests.concat(JSON.parse(initialFromLocalStorage));
    }

    this.failCode = failCode;
    this.includeAllFailingRequests = includeAllFailingRequests;
    this.failCodeExceptions = failCodeExceptions;

    /**
    * @ngdoc function
    * @name ue.store-and-forward.storeAndForward#updateLocalStorage
    * @methodOf ue.store-and-forward.storeAndForward
    * @function
    *
    * @description
    * Updates localStorage with the updated pending requests.
    *
    * Note: In most cases, this method will never need to be called manually (called by `httpInterceptor`).
    */
    this.updateLocalStorage = function() {
      localStorage.removeItem(localStorageKey);
      localStorage.setItem(localStorageKey, JSON.stringify(pendingRequests));
    };

    /**
    * @ngdoc function
    * @name ue.store-and-forward.storeAndForward#clear
    * @methodOf ue.store-and-forward.storeAndForward
    * @function
    *
    * @description
    * Clears all rejected requests from the queue.  Useful to be called when a user is logged out/logged in
    * or needs a fresh start.
    *
    */
    this.clear = function() {
      this.pendingRequests.splice(0, this.pendingRequests.length);
      localStorage.removeItem(localStorageKey);
    };

    /**
    * @ngdoc function
    * @name ue.store-and-forward.storeAndForward#add
    * @methodOf ue.store-and-forward.storeAndForward
    * @function
    *
    * @description
    * Adds a rejected request to the pending requests that are persisted to `localStorage`,
    * assuming the request does not have a status code that has been set to ignore, it is a valid
    * fail code that has been asked to capture, or if it has been specifically requested to save (via `config.offlineFallback = true`),
    * or if the global setting to capture all failed requests has been turned on.
    *
    * Note: In most cases, this method will never need to be called manually (called by `httpInterceptor`).
    *
    * @param {rejection=} rejection The previous request that has been rejected.
    */
    this.add = function(rejection) {
      var notAnExceptionFailCode = this.failCodeExceptions.indexOf(rejection.status) < 0;
      var isAValidFailCode = this.failCode.indexOf(rejection.status) > -1 && notAnExceptionFailCode;
      var requestNeedsFallback = !! rejection.config.offlineFallback;
      var masterIncludeAllFailingRequests = !! this.includeAllFailingRequests;
      if (requestNeedsFallback||isAValidFailCode || (notAnExceptionFailCode && masterIncludeAllFailingRequests)) {
        pendingRequests.push(rejection.config);
        this.updateLocalStorage();
      }
    };

    /**
    * @ngdoc function
    * @name ue.store-and-forward.storeAndForward#flush
    * @methodOf ue.store-and-forward.storeAndForward
    * @function
    *
    * @description
    * Flushes all pending requests from the queue.  Will be automatically called when
    * the `storeAndForwardRequestInterceptor` gets a successful response back.  May need to be
    * manually called if the app implements a specific way of detecting if a user is online.
    *
    */
    this.flush = function() {
      var _flushReqest = function(_config) {
        var config = _config;
        delete config.transformRequest;
        delete config.transformResponse;
        $http(config).then(function(data, status, headers, _config) {
          if (config.offlineSuccess) {
            var el = angular.element(document.querySelector('[ng-app]'));
            if (!el) {
              el = angular.element(document.querySelector('[ng-controller]'));
            }
            if (!el) {
              el = angular.element(document.querySelector('[ng-view]'));
            }
            if(!el) {
              $log.warn('Unable to find any elements of [ng-view], [ng-app], or [ng-controller].  Unable to inject success function.');
            } else {
              el.injector().get(config.offlineSuccess.split('.')[0])[config.offlineSuccess.split('.')[1]](data, status, headers, _config);
            }
          }
        });
      };
      if(this.pendingRequests.length > 0) {
        localStorage.removeItem(localStorageKey);
        this.pendingRequests.map(_flushReqest);
        this.clear();
      }
    };
    this.pendingRequests = pendingRequests;
    this.localStorageKey = localStorageKey;
    return this;
  }

   /**
   * @ngdoc function
   * @name ue.store-and-forward.storeAndForwardProvider#setFailCodes
   * @methodOf ue.store-and-forward.storeAndForwardProvider
   * @function
   *
   * @description
   * sets the valid fail codes that the service will capture and store locally
   * if a request fails with that code.
   *
   * @param {failCodes|Array} failCodes An array of fail codes that should will be used to
   * determine if a failed request should be persisted or not.
   *
   * <pre>
   *   angular.module('testmodule', ['ue.store-and-forward'])
   *    .config(function(storeAndForwardProvider) {
   *      storeAndForwardProvider.setFailCodes([0, 503]);
   *    });
   * </pre>
   */
  this.setFailCodes = function(failCodes) {
    failCode = failCodes;
  };

   /**
   * @ngdoc function
   * @name ue.store-and-forward.storeAndForwardProvider#setIncludeAllFailingRequests
   * @methodOf ue.store-and-forward.storeAndForwardProvider
   * @function
   *
   * @description
   * Sets the functionality to override all other settings and include all failing requests.
   *
   * @param {includeAllFailingRequests|Boolean} includeAllFailingRequests A master boolean to force
   * every failed request to be captured.  Includes 404s, 500s, etc.
   *
   * <pre>
   *   angular.module('testmodule', ['ue.store-and-forward'])
   *    .config(function(storeAndForwardProvider) {
   *      storeAndForwardProvider.includeAllFailingRequests(true);
   *    });
   * </pre>
   */
  this.setIncludeAllFailingRequests = function(bool) {
    includeAllFailingRequests = bool;
  };

  /**
   * @ngdoc function
   * @name ue.store-and-forward.storeAndForwardProvider#setLocalStorageKey
   * @methodOf ue.store-and-forward.storeAndForwardProvider
   * @function
   *
   * @description
   * Sets the namespace for the localstorage variables
   *
   * @param {key|String} key A key that the localStorage items will be namespaced under.
   * It is recommended to use this to avoid namespace collisions.
   *
   * <pre>
   *   angular.module('testmodule', ['ue.store-and-forward'])
   *    .config(function(storeAndForwardProvider) {
   *      storeAndForwardProvider.setLocalStorageKey('testmodule');
   *    });
   * </pre>
   */
  this.setLocalStorageKey = function(key) {
    localStorageKey = key;
  };

  /**
   * @ngdoc function
   * @name ue.store-and-forward.storeAndForwardProvider#setFailCodeExceptions
   * @methodOf ue.store-and-forward.storeAndForwardProvider
   * @function
   *
   * @description
   * sets the invalid fail codes that the service should ignore.
   *
   * @param {exceptions|Array} exceptions An array of error codes that the service should ignore.
   *
   * <pre>
   *   angular.module('testmodule', ['ue.store-and-forward'])
   *    .config(function(storeAndForwardProvider) {
   *      // this says, ignore all 404 failures and status code 1 failures.
   *      storeAndForwardProvider.setFailCodeExceptions([404,1]);
   *    });
   * </pre>
   */
  this.setFailCodeExceptions = function(exceptions) {
    failCodeExceptions = exceptions;
  };

  // Method for instantiating
  this.$get = function($http, $log) {
    /*jshint -W055 */
    return new storeAndForward($http, $log);
  };
})

.config(function(storeAndForwardProvider) {
  storeAndForwardProvider.setFailCodes([0]);
  storeAndForwardProvider.setFailCodeExceptions([404]);
});
