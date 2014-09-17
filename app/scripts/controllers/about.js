'use strict';

/**
 * @ngdoc function
 * @name blueprintApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the blueprintApp
 */
angular.module('blueprintApp')
  .controller('AboutCtrl', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  });
