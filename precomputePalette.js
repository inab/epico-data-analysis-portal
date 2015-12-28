/*
 * Program to programmatically (re)generate a palette for data portal, so it is not done in runtime
 */
if(process.argv.length >= 4) {
	var bower = require('bower');
	bower.commands.update.line([]).on('end', function(data) {
		var jsonfile = require('jsonfile');
		var jalette = require('./bower_components/jalette/src/jalette.js');

		var numColors = parseInt(process.argv[2]);
		var destFile = process.argv[3];
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

		var palette = InitialPalette.map(function(rgbColor) {
			return jalette.Lab.fromRgb(jalette.Rgb.fromHex(rgbColor));
		});
		if(palette.length < numColors) {
			for(var ipal=palette.length; ipal < numColors; ipal++) {
				var lab = jalette.generateColor(palette);
				palette.push(lab);
			}
		}


		var colorArray = palette.map(function(labColor) {
			return labColor.toRgb().toString();
		});

		jsonfile.writeFileSync(destFile,colorArray);
		process.exit(0);
	}).on('err',function(err) {
		console.error(err);
		process.exit(2);
	});
} else {
	console.error("Usage: "+process.argv[1]+" {numMaxColors} {outputJson}");
	process.exit(1);
}
