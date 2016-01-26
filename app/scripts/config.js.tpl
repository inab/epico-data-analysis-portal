'use strict';

angular.module('blueprintApp.config', [])
	.constant('portalConfig',{
		esHost: '<%- esHost %>',
		useLocalExportServer: '<%- useLocalExportServer %>',
		dataRelease: '<%- dataRelease %>',
		dataDesc: "<%- dataDesc %>",
		projectName: '<%- projectName %>',
		swVersion: '<%- swVersion %>'
	});
