'use strict';

/* jshint camelcase: false , quotmark: false */
/* globals jalette: false */

/*
 * We want to use an initial palette for Jalette
 * so it does not take so much to get a new color
 * This initial palette was borrowed from d3 category20
 */
var InitialPalette = [
	'#1f77b4',
	'#aec7e8',
	'#ff7f0e',
	'#ffbb78',
	'#2ca02c',
	'#98df8a',
	'#d62728',
	'#ff9896',
	'#9467bd',
	'#c5b0d5',
	'#8c564b',
	'#c49c94',
	'#e377c2',
	'#f7b6d2',
	'#7f7f7f',
	'#c7c7c7',
	'#bcbd22',
	'#dbdb8d',
	'#17becf',
	'#9edae5',
];

/**
 * Creates a ColorPalette object
 * @param	{Array}	initialPalette	An array with the initial palette colours, in RGB format
 * @return	{ColorPalette}	A programmatic colour palette
 */
function ColorPalette(initialPalette) {
	this.reset(initialPalette);
}

/**
 * Resets the high color mark to an initial state
 */
ColorPalette.prototype.resetHighColorMark = function() {
	this.highColorMark = -1;
};


/**
 * Resets the programmatic palette to an initial state
 * @param	{Array}	initialPalette	An array with the initial palette colours, in RGB format
 */
ColorPalette.prototype.reset = function(initialPalette) {
	this.resetHighColorMark();
	this.palette = undefined;
	
	if(Array.isArray(initialPalette)) {
		initialPalette = angular.copy(initialPalette);
	} else {
		initialPalette = InitialPalette;
	}
	
	this.initialPalette = initialPalette;
};

/**
 * Resets the programmatic palette, setting up the initial one
 * @param	{Array}	initialPalette	An array with the initial palette colours, in RGB format
 */
ColorPalette.prototype.setInitialPalette = function(initialPalette) {
	if(Array.isArray(initialPalette)) {
		// A new palette implies starting from scratch
		this.reset(initialPalette);
	}
};

/**
 * This method pre-computes up to numColors, it they were not already pre-computed
 * @param	{Number}	numColors	The number of colours to pre-compute
 */
ColorPalette.prototype.calculateColors = function(numColors) {
	if(this.palette === undefined) {
		this.palette = this.initialPalette.map(function(rgbColor) {
			return jalette.Lab.fromRgb(jalette.from(rgbColor));
		});
	}
	
	if(this.palette.length < numColors) {
		for(var ipal=this.palette.length; ipal < numColors; ipal++) {
			var lab = jalette.generateColor(this.palette);
			this.palette.push(lab);
			this.initialPalette.push(lab.toRgb().toString());
		}
	}
};

/**
 * It returns an array of numColors colours, all of them different and divergent
 * @param	{Number}	numColors	The number of colours to return
 * @return	{Array}	An array with the first numColors colours from the programmatic palette, in RGB format
 */
ColorPalette.prototype.getColorArray = function(numColors) {
	var colorArray = [];
	
	if(numColors > 0) {
		// First, assure the colors are in place
		this.calculateColors(numColors);
		
		// Now, return the array, translated to RGB strings
		colorArray = this.initialPalette.slice(0,numColors);
		
		// Setting the highmark
		if(this.highColorMark < (numColors-1)) {
			this.highColorMark = numColors-1;
		}
	}
	
	return colorArray;
};

/**
 * It returns the iColor-th colour from the programmatic palette
 * @param	{Number}	iColor	The index of the colour to return
 * @return	{String}	The colour, in RGB format
 */
ColorPalette.prototype.getColor = function(iColor) {
	// First, assure the colors are in place
	this.calculateColors(iColor+1);
	
	// Setting the highmark
	if(this.highColorMark < iColor) {
		this.highColorMark = iColor;
	}
	
	// Now, return the color, translated to RGB string
	return this.initialPalette[iColor];
};

/**
 * It returns the next unused colour from the programmatic palette
 * @return	{String}	The colour, in RGB format
 */
ColorPalette.prototype.getNextColor = function() {
	return this.getColor(this.highColorMark+1);
};

/**
 * It returns the next unused numColors colours from the programmatic palette
 * @param	{Number}	numColors	The next numColors to get
 * @return	{Array}	An array with the next numColors colours from the programmatic palette, in RGB format
 */
ColorPalette.prototype.getNextColors = function(numColors) {
	var colorArray = [];
	
	if(numColors > 0) {
		// First, assure the colors are in place
		var newHighColorMark = this.highColorMark + numColors;
		this.calculateColors(newHighColorMark + 1);


		// Now, return the array, translated to RGB strings
		colorArray = this.initialPalette.slice(this.highColorMark+1,newHighColorMark+1);
		
		// Setting the highmark
		this.highColorMark = newHighColorMark;
	}
	
	return colorArray;
};

angular.
module('blueprintApp').
factory('ColorPalette', function ($http) {
	
	var service = {
		async: function() {
			var promise = $http
				.get('scripts/precomputedPallete.json')
				.then(function(response) {
					InitialPalette = response.data;
					
					return service;
				});
				
			return promise;
		},
		newInstance: function(initialPalette) {
			return new ColorPalette(initialPalette);
		},
	};
	
	return service;
});
