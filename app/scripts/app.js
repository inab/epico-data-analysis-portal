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
//angular.module('blueprintApp.dagre-d3',[]);
//angular.module('blueprintApp.canvasjs',[]);
angular.module('blueprintApp.elasticsearch',[]);
angular.module('blueprintApp.controllers', []);

angular.module('blueprintApp', [
    'blueprintApp.d3',
//    'blueprintApp.dagre-d3',
//    'blueprintApp.canvasjs',
    'blueprintApp.elasticsearch',
    'blueprintApp.controllers',
    'treeControl',
    'highcharts-ng',
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'ui.bootstrap',
    'elasticsearch',
//    'smart-table',
    'ngCsv'
  ])
  .config(function ($routeProvider,$tooltipProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        reloadOnSearch: false
      })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl'
      })
      .when('/first-steps', {
        templateUrl: 'views/first-steps.html',
        controller: 'AboutCtrl'
      })
      .when('/doing-a-search', {
        templateUrl: 'views/doing-a-search.html',
        controller: 'AboutCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
	
	// This is to programmatically disable tooltips
	$tooltipProvider.setTriggers({
		'never': 'mouseleave' // <- This ensures the tooltip will go away on mouseleave
	});
  });



