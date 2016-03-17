'use strict';

/*jshint camelcase: false , quotmark: false */

/**
 * @ngdoc function
 * @name blueprintApp.controller:ModalDataGridInstanceCtrl
 * @description
 * # ModalDataGridInstanceCtrl
 * Controller of the modal data grid windows
 */
angular.module('blueprintApp').controller('ModalDataGridInstanceCtrl', function ($scope, $sce, $uibModalInstance, modalDataGrid) {
	$scope.modalDataGrid = modalDataGrid;
	if(modalDataGrid.limit===undefined) {
		modalDataGrid.limit = 50;
	}
	
	$scope.okModal = function () {
		//$modalInstance.close(someResult);
		$uibModalInstance.close();
	};
	
	$scope.cancelModal = function () {
		$uibModalInstance.dismiss('cancel');
	};
	
	$scope.cellFormatter = function(text) {
		var sanText = document.createTextNode(text);
		var result = text;
		if(typeof text === 'string' && (text.indexOf('http://')==0 || text.indexOf('https://')==0)) {
			result = $sce.trustAsHtml('<a href="'+text+'" target="_blank">'+text+'</a>');
		}
		return result;
		// 
		// return (typeof text === 'string' && text.indexOf('http://')==0 || text.indexOf('https://')==0) ? $sce.trustAsUrl(text) : text;
	}
});
