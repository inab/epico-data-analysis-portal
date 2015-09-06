(function () {
	'use strict';
/* jshint camelcase: false , quotmark: false */

	angular.module('blueprintApp.canvasjs',[])
		.factory('canvasjsObj',[function() {
			// Got rid of internal, static, CanvasJS library
			return window.CanvasJS;
		}])
		.directive('canvasjs', ['canvasjsObj',function(CanvasJS) {
			// Element is jqLite wrapped
			function link(scope,element,attrs) {
				if(scope.config.data===undefined) {
					scope.config.data = [];
				}
				scope.chart = new CanvasJS.Chart(element[0],scope.config);
				
				// on window resize, re-render
				angular.element(window).bind('resize',function() {
					console.log("ReRendering");
					scope.chart.render();
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
						scope.chart = new CanvasJS.Chart(element[0],scope.config);
					}
					scope.chart.render();
				});
				
				scope.$watchCollection('config.data',function(newdata) {
					console.log("DATA CHANGED");
					console.log(newdata);
					console.log(scope.config);
					scope.chart.render();
				});
				
				element.on('$destroy',function() {
					scope.chart = null;
				});
				
				console.log("NEW CHART");
				console.log(scope.config);
				scope.chart.render();
			}
			
			return {
				restrict: 'EAC',
				template: '<div></div>',
				replace: true,
				scope: {
					config: "=",
					disableDataWatch: '='
				},
				link: link,
			};
		}]);

}());
