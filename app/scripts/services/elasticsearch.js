'use strict';

angular.module('blueprintApp.elasticsearch',[])
    .factory('es', function (esFactory) {
  
      return esFactory({
        host: 'blueprint-dev.bioinfo.cnio.es/es/',
        // ...
    });
});
