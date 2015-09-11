'use strict';

/*jshint camelcase: false , quotmark: false */

/**
 * @ngdoc function
 * @name blueprintApp.controller:ModalInstanceCtrl
 * @description
 * # ModalInstanceCtrl
 * Controller of the modal windows
 */
angular.module('blueprintApp').controller('ModalInstanceCtrl', function ($scope, $modalInstance, modalState, modalMessage) {
	$scope.modalState = modalState;
	$scope.modalMessage = modalMessage;
	
	$scope.okModal = function () {
		//$modalInstance.close(someResult);
		$modalInstance.close();
	};
	
	$scope.cancelModal = function () {
		$modalInstance.dismiss('cancel');
	};
});
