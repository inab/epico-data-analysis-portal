'use strict';

angular.module('blueprintApp.elasticsearch',['blueprintApp.config'])
    .factory('es', function (esFactory,portalConfig) {
  
      return esFactory({
        host: portalConfig.esHost,
        path: portalConfig.esPath,
        // ...
    });
});
