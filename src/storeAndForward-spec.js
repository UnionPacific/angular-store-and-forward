'use strict';

describe('Service: storeAndForward', function() {
  describe('Provider interface to configure behavior', function() {
    var provider;
    beforeEach(function() {
      angular.module('testmodule', ['ue.store-and-forward'])
        .config(function(storeAndForwardProvider) {
          provider = storeAndForwardProvider;
        });

      module('testmodule', 'ue.store-and-forward');
      inject(function() {});
    });

    it('can set the fail code', function() {
      expect(provider.setFailCodes).not.toBe(undefined);
    });

    it('can add to exception codes', function() {
      expect(provider.setFailCodeExceptions).not.toBe(undefined);
    });

    it('can set local storage key', function() {
      expect(provider.setLocalStorageKey).not.toBe(undefined);
    });

    it('can set var to include all failing requests', function() {
      expect(provider.setIncludeAllFailingRequests).not.toBe(undefined);
    });
  });

  describe('offline storage handling (default behavior)', function() {
    var httpBackend;
    var http;
    var storeAndForward;
    beforeEach(function() {
      angular.module('testmodule', ['ue.store-and-forward'])
        .config(function($httpProvider) {
          $httpProvider.interceptors.push('storeAndForwardRequestInterceptor');
        });

      module('testmodule', 'ue.store-and-forward');
      inject(function($httpBackend, $http, _storeAndForward_) {
        httpBackend = $httpBackend;
        http = $http;
        storeAndForward = _storeAndForward_;
      });
    });

    afterEach(function() {
      localStorage.clear();
      httpBackend.verifyNoOutstandingExpectation();
      httpBackend.verifyNoOutstandingRequest();
    });

    it('can clear failed requests', function() {
      httpBackend.whenGET('/missing').respond(404, []);
      http({method: 'GET', offlineFallback: true, url: '/missing'});
      httpBackend.flush();
      expect(storeAndForward.pendingRequests.length).toBe(1);
      storeAndForward.clear();
      expect(storeAndForward.pendingRequests.length).toBe(0);
    });

    it('automatically retries failed requests when a request goes through', function() {
      httpBackend.whenGET('/exists').respond(201, [1,2,3]);
      httpBackend.expectGET('/missing').respond(0, []);
      http.get('/missing');
      httpBackend.flush();
      expect(storeAndForward.pendingRequests.length).toBe(1);
      httpBackend.expectGET('/missing').respond(201, []);
      http.get('/exists');
      httpBackend.flush();
      expect(storeAndForward.pendingRequests.length).toBe(0);
    });

    it('adds a 404 failure if explicitly asked', function() {
      httpBackend.whenGET('/missing').respond(404, []);
      http({method: 'GET', offlineFallback: true, url: '/missing'});
      httpBackend.flush();
      expect(storeAndForward.pendingRequests.length).toBe(1);
    });

    it('does not add failed 404 calls to the failed requests', function() {
      httpBackend.whenGET('/missing').respond(404, []);
      http.get('/missing');
      httpBackend.flush();
      expect(storeAndForward.pendingRequests.length).toBe(0);
    });

    it('adds a failed (status code 0) request to failed requests', function() {
      httpBackend.whenGET('/something').respond(0, []);
      http.get('/something');
      httpBackend.flush();
      expect(storeAndForward.pendingRequests.length).toBe(1);
      expect(storeAndForward.pendingRequests[0].url).toBe('/something');
    });
  });

  describe('offline storage handling (custom behavior)', function() {
    var httpBackend;
    var http;
    var storeAndForward;
    beforeEach(function() {
      angular.module('testmodule', ['ue.store-and-forward'])
        .config(function($httpProvider, storeAndForwardProvider) {
          $httpProvider.interceptors.push('storeAndForwardRequestInterceptor');
          storeAndForwardProvider.setFailCodes([999]);
        });

      module('testmodule', 'ue.store-and-forward');
      inject(function($httpBackend, $http, _storeAndForward_) {
        httpBackend = $httpBackend;
        http = $http;
        storeAndForward = _storeAndForward_;
      });
    });

    afterEach(function() {
      localStorage.clear();
    });

    it('does add failed 999 calls to the failed requests', function() {
      httpBackend.whenGET('/missing').respond(999, []);
      http.get('/missing');
      httpBackend.flush();
      expect(storeAndForward.pendingRequests.length).toBe(1);
    });

    it('does add not failed 0 calls to the failed requests (unless they specify it)', function() {
      httpBackend.whenGET('/missing').respond(0, []);
      http.get('/missing');
      httpBackend.flush();
      expect(storeAndForward.pendingRequests.length).toBe(0);
    });

    it('does not add failed 404 calls to the failed requests if they set their own', function() {
      httpBackend.whenGET('/missing').respond(404, []);
      http.get('/missing');
      httpBackend.flush();
      expect(storeAndForward.pendingRequests.length).toBe(0);
    });
  });
});
