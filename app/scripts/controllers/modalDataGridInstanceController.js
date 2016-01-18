'use strict';

/*jshint camelcase: false , quotmark: false */

/**
 * @ngdoc function
 * @name blueprintApp.controller:ModalDataGridInstanceCtrl
 * @description
 * # ModalDataGridInstanceCtrl
 * Controller of the modal data grid windows
 */
angular.module('blueprintApp').controller('ModalDataGridInstanceCtrl', function ($scope, $uibModalInstance, modalDataGrid) {
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
});
