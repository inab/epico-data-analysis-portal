'use strict';

angular.module('blueprintApp.elasticsearch',['blueprintApp.config'])
    .factory('es', function (esFactory,portalConfig) {

	var REQUEST_TIMEOUT = 300000;

      return esFactory({
        host: portalConfig.esHost,
        requestTimeout: REQUEST_TIMEOUT
        // ...
    });
});
