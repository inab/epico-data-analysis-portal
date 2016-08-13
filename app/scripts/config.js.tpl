'use strict';

angular.module('EPICOApp.config', [])
	.constant('portalConfig',{
		epicoAPI: '<%- epicoAPI %>',
		epicoDomain: '<%- epicoDomain %>',
		useLocalExportServer: '<%- useLocalExportServer %>',
		dataRelease: '<%- dataRelease %>',
		dataDesc: "<%- dataDesc %>",
		projectName: '<%- projectName %>',
		swVersion: '<%- swVersion %>'
	});
