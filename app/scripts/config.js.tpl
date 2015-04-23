'use strict';

angular.module('blueprintApp.config', [])
	.constant('portalConfig',{
		esPath: '<%- esPath %>'
	});
