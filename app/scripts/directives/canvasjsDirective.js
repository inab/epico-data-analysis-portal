(function () {
	'use strict';
/* jshint camelcase: false , quotmark: false */

	angular.module('blueprintApp.canvasjs',[])
		.factory('canvasjs',[function() {
			// Got rid of internal, static, CanvasJS library
			return window.CanvasJS;
		}])
		.directive('canvasjs', ['canvasjs',function(CanvasJS) {
			// Element is jqLite wrapped
			function link(scope,element,attrs) {
				if(scope.data!==undefined) {
					scope.options.data = scope.data;
				} else if(scope.options.data!==undefined) {
					scope.data = scope.options.data;
				}
				
				scope.chart = new CanvasJS.Chart(element[0],scope.options);
				
				scope.$watch('options.data',function(oldoptions,newoptions) {
					if(newoptions!==oldoptions) {
						scope.chart = new CanvasJS.Chart(element[0],scope.options);
					}
					scope.chart.render();
				});
				
				element.on('$destroy',function() {
					scope.chart = null;
				});
				
				scope.chart.render();
			}
			
			return {
				restrict: 'EA',
				scope: {
					options: "=",
					data: "=?",
				},
				link: link,
			};
		}]);

}());
