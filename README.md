# angular-store-and-forward
Safely catch failing `$http` request and submit them at a later time while persisting callbacks and failed requests across page refreshes.

## Getting Started
This module requires Angular 1.0.x (has not been tested with 1.1+).

The module is not (**yet**) available in bower so to install the component, you'll need to either download the file manually or clone the project and move the file to its appropriate place.

Once the source file is in its place, add the module dependency to your app:

```
angular
    .module('app', ['ue.store-and-forward'])
    // and add the interceptor (until this module adds it itself)
    .config(function($httpProvider) {
        $httpProvider.interceptors.push('storeAndForwardRequestInterceptor');
    });
```

## API
This section will provide a high level overview.  More details and information can be found by looking into the source file itself as every section has ng-doc annotations (useful if you're already generating ng-docs with your project).

### storeAndForward
Primary factory used throughout the module.  Exposes the functions listed below.

#### storeAndForward.updateLocalStorage
Updates localStorage with the updated pending requests. Note: In most cases, this method will never need to be called manually (called by `httpInterceptor`)

#### storeAndForward.clear
Clears all rejected requests from the queue.  Useful to be called when a user is logged out/logged in or needs a fresh start.

#### storeAndForward.add
Adds a rejected request to the pending requests that are persisted to `localStorage`, assuming the request does not have a status code that has been set to ignore, it is a valid fail code that has been asked to capture, or if it has been specifically requested to save (via `config.offlineFallback = true`),
  or if the global setting to capture all failed requests has been turned on.

#### storeAndForward.flush
Flushes all pending requests from the queue.  Will be automatically called when the `storeAndForwardRequestInterceptor` gets a successful response back.  May need to be manually called if the app implements a specific way of detecting if a user is online.

### storeAndForwardProvider
Some useful configuration available during `config()` block of the app.

#### storeAndForwardProvider.setFailCodes
Some browsers throw different codes for a "failed" `$http` request.  Set the codes you're looking for here.

#### storeAndForwardProvider.setIncludeAllFailingRequests
A master boolean to force every failed request to be captured.  Includes 404s, 500s, etc.

#### storeAndForwardProvider.setLocalStorageKey 
A key that the localStorage items will be namespaced under.

#### storeAndForwardProvider.setFailCodeExceptions 
An array of error codes that the service should ignore.  Allows you to ignore things like 5xx server errors or 4xx bad requests.

## Roadmap
* Remove requirement of developer to manually add `$httpInterceptor`
* Add sample project/code
* Deploy via bower

## Contributing
You download the source for this project via .zip or by cloning the project.  Once cloned and dependencies are installed (`npm i`), tests can be ran with `grunt test`.

In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using Grunt.