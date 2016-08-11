(function () {
	'use strict';
/* jshint camelcase: false , quotmark: false */

	angular.module('EPICOApp.chartjs',[])
		.factory('chartjsObj',[function() {
			// Got rid of internal, static, CanvasJS library
			return {Char: window.Chart};
		}])
		.directive('chartjs', ['chartjsObj',function(ChartJS) {
			// Element is jqLite wrapped
			function link(scope,element/*,attrs*/) {
				if(scope.config.data===undefined) {
					scope.config.data = [];
				}
				scope.chart = new ChartJS.Chart(element[0].getContext("2d"),scope.config);
				
				// on window resize, re-render
				angular.element(window).bind('resize',function() {
					console.log("ReRendering");
					scope.chart.update();
				});

				scope.$watchCollection('config',function(newconfig) {
					console.log("CONFIG CHANGED");
					console.log(newconfig);
					console.log(scope.config);
					if(scope.chart===undefined) {
						scope.config = newconfig;
						if(scope.config.data===undefined) {
							scope.config.data = [];
						}
						scope.chart = new ChartJS.Chart(element[0].getContext("2d"),scope.config);
					}
					scope.chart.update();
				});
				
				if(scope.disableDataWatch) {
					scope.$watchCollection('config.data',function(newdata) {
						console.log("DATA CHANGED");
						console.log(newdata);
						console.log(scope.config);
						scope.chart.update();
					});
				} else {
					scope.$watch('config.data', function(newdata) {
						console.log("DATA CHANGED");
						console.log(newdata);
						console.log(scope.config);
						scope.chart.update();
					}, true);
				}
				
				element.on('$destroy',function() {
					scope.chart.destroy();
					scope.chart = null;
				});
				
				console.log("NEW CHART");
				console.log(scope.config);
				scope.chart.update();
			}
			
			return {
				restrict: 'EAC',
				template: '<canvas></canvas>',
				replace: true,
				scope: {
					config: "=",
					disableDataWatch: '='
				},
				link: link,
			};
		}]);

}());
