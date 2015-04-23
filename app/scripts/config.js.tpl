'use strict';

angular.module('blueprintApp.config', [])
	.constant('portalConfig',{
		esHost: '<%- esHost %>'
	});
