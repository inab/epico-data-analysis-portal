'use strict';

angular.module('blueprintApp.elasticsearch',[])
    .factory('es', function (esFactory) {
  
      return esFactory({
        host: 'limtox.cnio.es:9201',
        // ...
    });
});