'use strict';

angular.module('blueprintApp.config', [])
	.constant('portalConfig',{
		esHost: '<%- esHost %>',
		dataRelease: '<%- dataRelease %>',
		dataDesc: "<%- dataDesc %>",
		swVersion: '<%- swVersion %>'
	});
