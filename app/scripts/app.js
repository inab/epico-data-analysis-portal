'use strict';
/**
 * @ngdoc overview
 * @name blueprintApp
 * @description
 * # blueprintApp
 *
 * Main module of the application.
 */
// setup dependency injection
angular.module('blueprintApp.d3',[]);
angular.module('blueprintApp.elasticsearch',[]);
angular.module('blueprintApp.controllers', []);

angular.module('blueprintApp', [
    'blueprintApp.d3',
    'blueprintApp.elasticsearch',
    'blueprintApp.controllers',
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'ui.bootstrap',
    'elasticsearch'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });


