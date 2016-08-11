'use strict';

/*jshint camelcase: false , quotmark: false */

/**
 * @ngdoc function
 * @name EPICOApp.controller:ModalInstanceCtrl
 * @description
 * # ModalInstanceCtrl
 * Controller of the modal windows
 */
angular.module('EPICOApp').controller('ModalInstanceCtrl', function ($scope, $uibModalInstance, modalState, modalMessage) {
	$scope.modalState = modalState;
	$scope.modalMessage = modalMessage;
	
	$scope.okModal = function () {
		//$modalInstance.close(someResult);
		$uibModalInstance.close();
	};
	
	$scope.cancelModal = function () {
		$uibModalInstance.dismiss('cancel');
	};
});
