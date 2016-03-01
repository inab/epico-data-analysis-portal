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
	
	// This is to provide a graphical feedback on Highcharts y axes breaks
	/**
	 * Extend the Axis.getLinePath method in order to visualize breaks with two parallel
	 * slanted lines. For each break, the slanted lines are inserted into the line path.
	 */
	try {
		Highcharts.wrap(Highcharts.Axis.prototype, 'getLinePath', function (proceed, lineWidth) {
			var axis = this,
			path = proceed.call(this, lineWidth),
			x = path[1],
			y = path[2];
			
			Highcharts.each(this.breakArray || [], function (brk) {
				if (axis.horiz) {
					x = axis.toPixels(brk.from);
					path.splice(3, 0,
						'L', x - 4, y, // stop
						'M', x - 9, y + 5, 'L', x + 1, y - 5, // left slanted line
						'M', x - 1, y + 5, 'L', x + 9, y - 5, // higher slanted line
						'M', x + 4, y
					);
				} else {
					y = axis.toPixels(brk.from);
					path.splice(3, 0,
						'L', x, y - 4, // stop
						'M', x + 5, y - 9, 'L', x - 5, y + 1, // lower slanted line
						'M', x + 5, y - 1, 'L', x - 5, y + 9, // higher slanted line
						'M', x, y + 4
					);
				}
			});
			return path;
		});
	} catch(err) {
		console.log('Highcharts not available. Reason:');
		console.log(err);
	}
  });



