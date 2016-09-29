'use strict';

/*jshint camelcase: false , quotmark: false */

angular.
module('EPICOApp').
factory('ChartService',['$q','$window','portalConfig','ConstantsService','ColorPalette','d3','SimpleStatistics',function($q,$window,portalConfig,ConstantsService,ColorPalette,d3,ss) {
	
	var METHYL_GRAPH = 'methyl';
	var METHYL_HYPER_GRAPH = METHYL_GRAPH+'_hyper';
	var METHYL_HYPO_GRAPH = METHYL_GRAPH+'_hypo';
	var EXP_G_GRAPH = 'exp_g';
	var EXP_T_GRAPH = 'exp_t';
	var CSEQ_BROAD_GRAPH = 'cseq_broad';
	var CSEQ_NARROW_GRAPH = 'cseq_narrow';
	var DNASE_GRAPH = 'dnase';
	
	var LIBRARY_NVD3 = 'nvd3';
	var LIBRARY_CANVASJS = 'canvasjs';
	var LIBRARY_CHARTJS = 'chartjs';
	var LIBRARY_HIGHCHARTS = 'highcharts';
	var LIBRARY_PLOTLY = 'plotly';
	
	var GRAPH_TYPE_STEP_NVD3 = 'step-'+LIBRARY_NVD3;
	var GRAPH_TYPE_STEP_CANVASJS = 'step-'+LIBRARY_CANVASJS;
	var GRAPH_TYPE_STEP_CHARTJS = 'step-'+LIBRARY_CHARTJS;
	var GRAPH_TYPE_BOXPLOT_HIGHCHARTS = 'boxplot-'+LIBRARY_HIGHCHARTS;
	var GRAPH_TYPE_BOXPLOT_PLOTLY = 'boxplot-'+LIBRARY_PLOTLY;
	var GRAPH_TYPE_STEP_HIGHCHARTS = 'step-'+LIBRARY_HIGHCHARTS;
	var GRAPH_TYPE_SPLINE_HIGHCHARTS = 'spline-'+LIBRARY_HIGHCHARTS;
	var GRAPH_TYPE_AREARANGE_HIGHCHARTS = 'arearange-'+LIBRARY_HIGHCHARTS;
	var GRAPH_TYPE_AREASPLINERANGE_HIGHCHARTS = 'areasplinerange-'+LIBRARY_HIGHCHARTS;
	
	var GRAPHS = [
		{
			name: METHYL_GRAPH,
			noData: 'methylated regions',
			title: 'Methylated regions',
			ceiling: 1.0,
			floor: 0.0,
			breaks: [{
				from: 0.25,
				to: 0.75,
				breakSize: 0.025
			}],
			yAxisLabel: 'Methylation level',
			views: [
				{
					type: [GRAPH_TYPE_AREASPLINERANGE_HIGHCHARTS,GRAPH_TYPE_SPLINE_HIGHCHARTS],
					subtitle: 'mean series',
					//subtitle: 'mean series + min / max'
				},
				//{
				//	type: [GRAPH_TYPE_AREARANGE_HIGHCHARTS,GRAPH_TYPE_STEP_HIGHCHARTS],
				//	subtitle: 'mean series + min / max'
				//},
				//{
				//	type: GRAPH_TYPE_STEP_HIGHCHARTS,
				//	subtitle: 'mean series'
				//},
				//{
				//	type: GRAPH_TYPE_AREARANGE_HIGHCHARTS,
				//	subtitle: 'min / max'
				//}
			],
		},
		{
			name: METHYL_HYPER_GRAPH,
			noData: 'hyper-methylated regions',
			title: 'Hyper-methylated regions',
			ceiling: 1.0,
			floor: 0.75,
			yAxisLabel: 'Methylation level',
			views: [
				{
					type: [GRAPH_TYPE_AREASPLINERANGE_HIGHCHARTS,GRAPH_TYPE_SPLINE_HIGHCHARTS],
					subtitle: 'mean series',
					//subtitle: 'mean series + min / max'
				},
				//{
				//	type: GRAPH_TYPE_STEP_HIGHCHARTS,
				//	subtitle: 'mean series'
				//},
				//{
				//	type: GRAPH_TYPE_AREARANGE_HIGHCHARTS,
				//	subtitle: 'min / max'
				//}
			],
			isInitiallyHidden: true,
		},
		{
			name: METHYL_HYPO_GRAPH,
			noData: 'hypo-methylated regions',
			title: 'Hypo-methylated regions',
			ceiling: 0.25,
			floor: 0.0,
			yAxisLabel: 'Methylation level',
			views: [
				{
					type: [GRAPH_TYPE_AREASPLINERANGE_HIGHCHARTS,GRAPH_TYPE_SPLINE_HIGHCHARTS],
					subtitle: 'mean series',
					//subtitle: 'mean series + min / max'
				},
				//{
				//	type: GRAPH_TYPE_STEP_HIGHCHARTS,
				//	subtitle: 'mean series'
				//},
				//{
				//	type: GRAPH_TYPE_AREARANGE_HIGHCHARTS,
				//	subtitle: 'min / max'
				//}
			],
			type: GRAPH_TYPE_STEP_HIGHCHARTS,
			isInitiallyHidden: true,
		},
		{
			name: EXP_G_GRAPH,
			noData: 'gene expression data',
			title: 'Gene Expression',
			floor: 0.0,
			yAxisLabel: 'FPKM',
			views: [
				{
					type: GRAPH_TYPE_BOXPLOT_PLOTLY,
					subtitle: 'mean series',
				},
				{
					type: GRAPH_TYPE_BOXPLOT_HIGHCHARTS,
					subtitle: 'mean series',
					viewPostTitle: ' (old)',
					isInitiallyHidden: true,
				},
			],
		},
		{
			name: EXP_T_GRAPH,
			noData: 'transcript expression data',
			title: 'Transcript Expression',
			floor: 0.0,
			yAxisLabel: 'FPKM',
			views: [
				{
					type: GRAPH_TYPE_BOXPLOT_PLOTLY,
					subtitle: 'mean series',
				},
				{
					type: GRAPH_TYPE_BOXPLOT_HIGHCHARTS,
					subtitle: 'mean series',
					viewPostTitle: ' (old)',
					isInitiallyHidden: true,
				},
			],
		},
		{
			name: DNASE_GRAPH,
			noData: 'regulatory regions',
			title: 'Regulatory regions (DNaseI)',
			yAxisLabel: 'z-score',
			views: [
				{
					type: [GRAPH_TYPE_AREASPLINERANGE_HIGHCHARTS,GRAPH_TYPE_SPLINE_HIGHCHARTS],
					subtitle: 'mean series',
					//subtitle: 'mean series + min / max'
				},
				//{
				//	type: GRAPH_TYPE_STEP_HIGHCHARTS,
				//	subtitle: 'mean series'
				//},
				//{
				//	type: GRAPH_TYPE_AREARANGE_HIGHCHARTS,
				//	subtitle: 'min / max'
				//}
			],
		},
	];
	
	var HISTONE_GRAPHS = [
		{
			name: CSEQ_NARROW_GRAPH,
			noData: 'narrow histone peaks',
			title: 'Narrow Histone Peaks',
			floor: 0.0,
			yAxisLabel: '-Log10(q-value)',
			views: [
				{
					type: [GRAPH_TYPE_AREASPLINERANGE_HIGHCHARTS,GRAPH_TYPE_SPLINE_HIGHCHARTS],
					subtitle: 'mean series',
					//subtitle: 'mean series + min / max'
				},
				//{
				//	type: GRAPH_TYPE_STEP_HIGHCHARTS,
				//	subtitle: 'mean series'
				//},
				//{
				//	type: GRAPH_TYPE_AREARANGE_HIGHCHARTS,
				//	subtitle: 'min / max'
				//}
			],
		},
		{
			name: CSEQ_BROAD_GRAPH,
			noData: 'broad histone peaks',
			title: 'Broad Histone Peaks',
			floor: 0.0,
			yAxisLabel: '-Log10(q-value)',
			views: [
				{
					type: [GRAPH_TYPE_AREASPLINERANGE_HIGHCHARTS,GRAPH_TYPE_SPLINE_HIGHCHARTS],
					subtitle: 'mean series',
					//subtitle: 'mean series + min / max'
				},
				//{
				//	type: GRAPH_TYPE_STEP_HIGHCHARTS,
				//	subtitle: 'mean series'
				//},
				//{
				//	type: GRAPH_TYPE_AREARANGE_HIGHCHARTS,
				//	subtitle: 'min / max'
				//}
			],
		},
	];
	
	var DLAT_SERIES = ConstantsService.DLAT_CONCEPT;
	var DLAT_HYPO_SERIES = DLAT_SERIES+'_hypo';
	var DLAT_HYPER_SERIES = DLAT_SERIES+'_hyper';
	var EXPG_SERIES = ConstantsService.EXPG_CONCEPT;
	var EXPT_SERIES = ConstantsService.EXPT_CONCEPT;
	var EXP_ANY_SERIES = ConstantsService.EXP_CONCEPT_M;
	var PDNA_BROAD_SERIES = ConstantsService.PDNA_CONCEPT + '_broad';
	var PDNA_NARROW_SERIES = ConstantsService.PDNA_CONCEPT + '_narrow';
	var RREG_SERIES = ConstantsService.RREG_CONCEPT;
	
	var AVG_SERIES = [
		{
			seriesId: DLAT_HYPO_SERIES,
			name: 'Mean hypo-methylated regions',
			chartId: [ METHYL_GRAPH, METHYL_HYPO_GRAPH ]
		},
		{
			seriesId: DLAT_HYPER_SERIES,
			name: 'Mean hyper-methylated regions',
			chartId: [ METHYL_GRAPH, METHYL_HYPER_GRAPH ]
		},
		{
			seriesId: EXPG_SERIES,
			name: 'Mean gene expression',
			chartId: EXP_G_GRAPH
		},
		{
			seriesId: EXPT_SERIES,
			name: 'Mean transcript expression',
			chartId: EXP_T_GRAPH
		},
		{
			seriesId: RREG_SERIES,
			name: 'Mean chromatin accessibility',
			chartId: DNASE_GRAPH
		},
	];
	
	var AVG_CS_SERIES = [
		{
			seriesId: PDNA_BROAD_SERIES,
			name: 'Mean broad histone peaks',
			chartId: CSEQ_BROAD_GRAPH
		},
		{
			seriesId: PDNA_NARROW_SERIES,
			name: 'Mean narrow histone peaks',
			chartId: CSEQ_NARROW_GRAPH
		},
	];
	
	var experimentLabels = [
		{
			label: 'Bisulfite-Seq (covered %)',
			conceptType: ConstantsService.LAB_WGBS_CONCEPT,
			experiment_type: ConstantsService.EXPERIMENT_TYPE_DNA_METHYLATION,
			feature: 'bisulfiteSeqHash',
			doPercentFixup: true
		},
		{
			label: 'DNase-Seq (covered %)',
			conceptType: ConstantsService.LAB_CHRO_CONCEPT,
			experiment_type: ConstantsService.EXPERIMENT_TYPE_CHROMATIN_ACCESSIBILITY,
			feature: 'dnaseSeqHash',
			doPercentFixup: true
		},
		{
			label: 'Gene Exp (RNA-Seq)',
			conceptType: ConstantsService.LAB_MRNA_CONCEPT,
			experiment_type: ConstantsService.EXPERIMENT_TYPE_MRNA_SEQ,
			feature: 'rnaSeqGHash'
		},
		{
			label: 'Transcript Exp (RNA-Seq)',
			conceptType: ConstantsService.LAB_MRNA_CONCEPT,
			experiment_type: ConstantsService.EXPERIMENT_TYPE_MRNA_SEQ,
			feature: 'rnaSeqTHash'
		}
	];
	
	var PLOTBAND_FEATURE = 'plotband';
	var BORDERED_PLOTBAND_FEATURE = 'bordered-plotband';
	var PLOTLINE_FEATURE = 'plotline';
	
	var DRAWABLE_REGION_FEATURES_V0 = {};
	DRAWABLE_REGION_FEATURES_V0[ConstantsService.REGION_FEATURE_GENE] = {
		color: '#ffffcc',
		type: BORDERED_PLOTBAND_FEATURE,
		showLabel: true,
		showAtBorders: true,
	};
	DRAWABLE_REGION_FEATURES_V0[ConstantsService.REGION_FEATURE_START_CODON] = {
		color: '#008000',
		type: PLOTLINE_FEATURE,
		showLabel: true,
	};
	DRAWABLE_REGION_FEATURES_V0[ConstantsService.REGION_FEATURE_STOP_CODON] = {
		color: '#800000',
		type: PLOTLINE_FEATURE,
		showLabel: true,
	};
	
	var DRAWABLE_REGION_FEATURES_V1 = {};
	DRAWABLE_REGION_FEATURES_V1[ConstantsService.REGION_FEATURE_GENE] = {
		color: 'rgba(255,0,204,0.5)',
	};
	DRAWABLE_REGION_FEATURES_V1[ConstantsService.REGION_FEATURE_TRANSCRIPT] = {
		//color: 'rgba(204,204,0,0.5)',
		color: 'rgba(255, 204, 51,0.5)',
	};
	DRAWABLE_REGION_FEATURES_V1[ConstantsService.REGION_FEATURE_START_CODON] = {
		//color: 'rgba(0,128,0,1)',
		color: 'rgba(102, 204, 53,1)',
	};
	DRAWABLE_REGION_FEATURES_V1[ConstantsService.REGION_FEATURE_STOP_CODON] = {
		//color: 'rgba(128,0,0,1)',
		color: 'rgba(153, 0, 0,1)',
	};
	DRAWABLE_REGION_FEATURES_V1[ConstantsService.REGION_FEATURE_EXON] = {
		//color: 'rgba(255,153,0,0.5)',
		color: 'rgba(204, 51, 0, 0.7)',
	};
	DRAWABLE_REGION_FEATURES_V1[ConstantsService.REGION_FEATURE_CDS] = {
		//color: 'rgba(0,255,255,0.5)',
		color: 'rgba(255, 153, 0,0.5)',
	};
	DRAWABLE_REGION_FEATURES_V1[ConstantsService.REGION_FEATURE_UTR] = {
		//color: 'rgba(0,0,255,0.3)',
		color: 'rgba(102, 153, 204,0.5)',
	};
	
	
	var LABELLED_REGION_FEATURES = [ConstantsService.REGION_FEATURE_GENE , ConstantsService.REGION_FEATURE_TRANSCRIPT];
	
	var ChromosomesHash = {
		'1': {n:1,c:"chr",f:"images/GRCh38_chromosome_1.svg"},
		'2': {n:2,c:"chr",f:"images/GRCh38_chromosome_2.svg"},
		'3': {n:3,c:"chr",f:"images/GRCh38_chromosome_3.svg"},
		'4': {n:4,c:"chr",f:"images/GRCh38_chromosome_4.svg"},
		'5': {n:5,c:"chr",f:"images/GRCh38_chromosome_5.svg"},
		'6': {n:6,c:"chr",f:"images/GRCh38_chromosome_6.svg"},
		'7': {n:7,c:"chr",f:"images/GRCh38_chromosome_7.svg"},
		'8': {n:8,c:"chr",f:"images/GRCh38_chromosome_8.svg"},
		'9': {n:9,c:"chr",f:"images/GRCh38_chromosome_9.svg"},
		'10': {n:10,c:"chr",f:"images/GRCh38_chromosome_10.svg"},
		'11': {n:11,c:"chr",f:"images/GRCh38_chromosome_11.svg"},
		'12': {n:12,c:"chr",f:"images/GRCh38_chromosome_12.svg"},
		'13': {n:13,c:"chr",f:"images/GRCh38_chromosome_13.svg"},
		'14': {n:14,c:"chr",f:"images/GRCh38_chromosome_14.svg"},
		'15': {n:15,c:"chr",f:"images/GRCh38_chromosome_15.svg"},
		'16': {n:16,c:"chr",f:"images/GRCh38_chromosome_16.svg"},
		'17': {n:17,c:"chr",f:"images/GRCh38_chromosome_17.svg"},
		'18': {n:18,c:"chr",f:"images/GRCh38_chromosome_18.svg"},
		'19': {n:19,c:"chr",f:"images/GRCh38_chromosome_19.svg"},
		'20': {n:20,c:"chr",f:"images/GRCh38_chromosome_20.svg"},
		'21': {n:21,c:"chr",f:"images/GRCh38_chromosome_21.svg"},
		'22': {n:22,c:"chr",f:"images/GRCh38_chromosome_22.svg"},
		'X': {n:"X",c:"chr",f:"images/GRCh38_chromosome_X.svg"},
		'Y': {n:"Y",c:"chr",f:"images/GRCh38_chromosome_Y.svg"},
		'MT': {n:"MT",c:"chr",f:"images/GRCh38_chromosome_MT.svg"}
	};
	var UnknownChromosome = { n: "(unknown)", f: "images/chr.svg" };
	
	// Preparing the default color range
	var Palette = ColorPalette.newInstance();
	
	// This is to load newer palette definitions
	ColorPalette.async().then(function(ColorPalette) {
		Palette = ColorPalette.newInstance();
	});
	
	var VIEW_GENERAL = 'General';
	var VIEW_BY_TISSUE = 'Tissues';
	var VIEW_DISEASES = 'Diseases';
	
	var HighchartsCommonExportingOptions = {
		scale: 1,
		sourceWidth: Math.round(2*2.57*297), // This is needed due a bug with floating coordinates in export server
		sourceHeight: Math.round(2*2.57*209.9), // This is needed due a bug with floating coordinates in export server
		chartOptions: {
			legend: {
				enabled: true,
				//itemDistance: 1,
				//symbolWidth: 4,
				itemStyle: {
				//	fontSize: '1.5mm',
					fontWeight: 'normal'
				}
			},
			// To render a watermark
			//chart: {
			//	events: {
			//		load: function() {
			//			this.renderer.image('http://highsoft.com/images/media/Highsoft-Solutions-143px.png', 80, 40, 143, 57);
			//		}
			//	}
			//}
		}
	};
	
	if(typeof(portalConfig.useLocalExportServer) === 'string' && portalConfig.useLocalExportServer!=='false') {
		if(portalConfig.useLocalExportServer==='true') {
			// Derive from the server
			HighchartsCommonExportingOptions.url = $window.location.protocol + '//' + $window.location.host + '/export-server/index.php';
		} else {
			// Blindly use the server
			HighchartsCommonExportingOptions.url = portalConfig.useLocalExportServer;
		}
	}
	
	function getXG(d) {
		return d.x;
	}
	
	function getYG(d) {
		return d.y;
	}
	
	function chooseLabelFromSymbols(symbols) {
		// Getting a understandable label
		var featureSymbol = symbols[0];
		var descSymbol;
		
		var gotIt = symbols.some(function(symbol) {
			switch(symbol.domain) {
				case "description":
					descSymbol = symbol;
					break;
				case "HGNC":
					featureSymbol = symbol;
					return true;
			}
			return false;
		});
		
		if(!gotIt && descSymbol!==undefined) {
			featureSymbol = descSymbol;
		}
		
		// Default case for the label
		return featureSymbol.value[0];
	}
	
	function genPlotlyBoxPlotSeries(/*optional*/origValues) {
		// jshint validthis:true
		if(origValues===undefined || origValues===null) {
			origValues = this.filteredSeriesValues;
		}
		// jshint validthis:false
		
		// Very simple model: x contains the values, y contains the 
		var x = [];
		var y = [];
		
		origValues.forEach(function(augData) {
			var data = augData.sDataS;
			var label = data[3];
			
			x.push(label);
			y.push(data[2]);
		});
		
		return { x: x, y: y };
	}
	
	// This function was designed as a method from chart (i.e. it does not work alone)
	function plotlyBoxPlotAggregator(doGenerate,stillLoading,filterFunc) {
		// jshint validthis:true
		var chart = this;
		// jshint validthis:false
		
		var isEmpty = true;
		stillLoading = !!stillLoading;
		chart.allData.forEach(function(series) {
			var reDigest = series.filteredSeriesValues === null || series.filteredSeriesValues === undefined || !stillLoading || !('term_type' in series);
			
			if(series.filteredSeriesValues === null || series.filteredSeriesValues === undefined) {
				if(filterFunc) {
					series.filteredSeriesValues = series.seriesValues.filter(filterFunc);
				} else {
					series.filteredSeriesValues = series.seriesValues;
				}
				
				// Invalidate digested values
				series.seriesDigestedValues = null;
			}
			
			// isEmpty detector
			if(series.filteredSeriesValues.length > 0) {
				isEmpty = false;
			}
			
			if(reDigest && (doGenerate || !series.seriesDigestedValues)) {
				series.seriesDigestedValues = series.seriesGenerator();
				
				// As the series generator knows nothing about 
				var labelCache = {};
				series.seriesDigestedValues.x = series.seriesDigestedValues.x.map(function(label) {
					if(label in labelCache) {
						label = labelCache[label];
					} else {
						if(label in chart.regionFeature) {
							label = labelCache[label] = chart.regionFeature[label].label + " \n("+label+')';
						} else {
							labelCache[label] = label;
						}
					}
					
					return label;
				});
				series.series.x = series.seriesDigestedValues.x;
				series.series.y = series.seriesDigestedValues.y;
			}
			//console.log("DEBUG "+g.name);
			//console.log(series.seriesValues);
			//series.seriesValues = undefined;
			var visibilityState;
			var showInLegend;
			if(series.linkedTo !== undefined) {
				visibilityState = series.linkedTo.series.visible;
				showInLegend = false;
			} else {
				if('term_type' in series) {
					visibilityState = !stillLoading && !series.term_type.termHidden;
				} else {
					visibilityState = stillLoading || !chart.meanSeriesHidden;
				}
				showInLegend = visibilityState;
			}
			
			switch(chart.library) {
				case LIBRARY_HIGHCHARTS:
					series.series.visible = visibilityState;
					series.series.showInLegend = showInLegend;
					break;
				case LIBRARY_PLOTLY:
					series.series.visible = visibilityState;
					series.series.showlegend = showInLegend;
					break;
				case LIBRARY_NVD3:
					if(visibilityState) {
						series.series[series.seriesDest] = [];
					} else {
						series.series[series.seriesDest] = series.seriesDigestedValues;
					}
					break;
			}
		});
		
		// It is assigned only once
		chart.isEmpty = isEmpty;
		chart.isLoading = stillLoading;
		console.log('Chartie',chart);
	}
	
	// This function was designed as a method from series (i.e. it does not work alone)
	function genBoxPlotSeries(/*optional*/origValues) {
		// jshint validthis:true
		if(origValues===undefined || origValues===null) {
			origValues = this.filteredSeriesValues;
		}
		// jshint validthis:false
		
		// First, process data
		var samps = {};
		var sampsPos = [];
		
		origValues.forEach(function(augData) {
			var data = augData.sDataS;
			var label = data[3];
			var samp;
			if(label in samps) {
				samp = samps[label];
			} else {
				samp = {
					series: [],
					start: data[0],
					label: label,
				};
				samps[label] = samp;
				sampsPos.push(samp);
			}
			// Saving the data
			samp.series.push(data[2]);
		});
		
		// And last, process each one
		var boxplots = sampsPos.map(function(samp) {
			var lastPos = samp.series.length-1;
			var Q1;
			var Q2;
			var Q3;
			var Wl;
			var Wh;
			//var outliers = [];
			
			var sseries = samp.series;
			
			if(lastPos>1) {
				sseries.sort(function(a,b) { return a-b; });
				
				//var Q2pos = (lastPos >> 1);
				//var lastQ1pos = Q2pos;
				//var firstQ3pos = Q2pos;
				//if((lastPos & 1)===0) {	// fast remainder by 2
				//	Q2 = samp.series[Q2pos];
				//} else {
				//	Q2 = (samp.series[Q2pos] + samp.series[Q2pos+1]) / 2.0;
				//	
				//	// Calibrating it for next step
				//	firstQ3pos++;
				//}
				//
				//var Q1pos = lastQ1pos>>1;
				//var Q3pos = firstQ3pos + Q1pos;
				//if((lastQ1pos & 1)===0) {	// fast remainder by 2
				//	Q1 = samp.series[Q1pos];
				//	Q3 = samp.series[Q3pos];
				//} else if((lastPos & 3)===0) {	// fast remainder by 4
				//	Q1 = (samp.series[Q1pos] + 3.0*samp.series[Q1pos+1]) / 4.0;
				//	Q3 = (3.0*samp.series[Q3pos] + samp.series[Q3pos+1]) / 4.0;
				//} else {
				//	Q1 = (3.0*samp.series[Q1pos] + samp.series[Q1pos+1]) / 4.0;
				//	Q3 = (samp.series[Q3pos] + 3.0*samp.series[Q3pos+1]) / 4.0;
				//}
				
				Q1 = ss.quantileSorted(sseries,0.25);
				Q2 = ss.quantileSorted(sseries,0.5);
				Q3 = ss.quantileSorted(sseries,0.75);
				// The "wishkers"
				var IQR = Q3 - Q1;
				Wl = Q1 - 1.5 * IQR;
				Wh = Q3 + 1.5 * IQR;
				// Setting the wishkers properly
				if(Wl<samp.series[0]) {
					Wl = samp.series[0];
				}
				if(Wh>samp.series[lastPos]) {
					Wh = samp.series[lastPos];
				}
				
				// And last, the outliers
				//samp.series.forEach(function(d) {
				//	if(d<Wl || d>Wh) {
				//		outliers.push(d);
				//	}
				//});
			} else if(lastPos===1) {
				Q1 = sseries[0];
				Q3 = sseries[1];
				Q2 = (Q1+Q3) / 2.0;
				if(Q1>Q3) {
					var Qtmp = Q3;
					Q3 = Q1;
					Q1 = Qtmp;
				}
				Wl = Q1;
				Wh = Q3;
			} else {
				Wl = Wh = Q1 = Q2 = Q3 = sseries[0];
			}
			
			//return {
			//	label: samp.label,
			//	values: {
			//		Q1: Q1,
			//		Q2: Q2,
			//		Q3: Q3,
			//		whisker_low: Wl,
			//		whisker_high: Wh,
			//		outliers: outliers
			//	}
			//};
			
			// Outliers are available, but they must be injected in a different chart
			//return {label:samp.label, start:samp.start, data:[Wl,Q1,Q2,Q3,Wh]};
			return {label:samp.label, start:samp.start, data:{low: Wl,q1: Q1,median: Q2,q3: Q3,high: Wh, number: samp.series.length, outliers: sseries}};
		});
		
		//console.log("Orig values");
		//console.log(origValues);
		//console.log("Boxplots data");
		//console.log(boxplots);
		return boxplots;
	}
	
	// This function was designed as a method from chart (i.e. it does not work alone)
	function highchartsBoxPlotAggregator(doGenerate,stillLoading,filterFunc) {
		// jshint validthis:true
		var chart = this;
		// jshint validthis:false
		
		// Invalidating the boxplot categories
		chart.allData.some(function(series) {
			if(series.filteredSeriesValues === null || series.filteredSeriesValues === undefined) {
				chart.boxPlotCategories = null;
				return true;
			}
			return false;
		});
		
		if(doGenerate || !chart.boxPlotCategories) {
			console.log(chart);
			
			var allEnsIds = [];
			var allEnsIdsHash = {};
			chart.allData.forEach(function(series) {
				if(series.filteredSeriesValues === null || series.filteredSeriesValues === undefined) {
					if(filterFunc) {
						series.filteredSeriesValues = series.seriesValues.filter(filterFunc);
					} else {
						series.filteredSeriesValues = series.seriesValues;
					}
					
					// Invalidate pre-digested and digested values
					series.seriesPreDigestedValues = null;
					series.seriesDigestedValues = null;
				}
				
				if(doGenerate || !series.seriesPreDigestedValues) {
					series.seriesPreDigestedValues = series.seriesGenerator();
				}
				
				series.seriesPreDigestedValues.forEach(function(boxplot) {
					if(!(boxplot.label in allEnsIdsHash)) {
						var category = { label: boxplot.label, start: boxplot.start };
						allEnsIds.push(category);
						allEnsIdsHash[boxplot.label] = category;
					}
				});
			});
			
			// Sorting them
			allEnsIds.sort(function(a,b) {
				return a.start - b.start;
			});
			
			var categories = [];
			allEnsIds.forEach(function(ensIdObj,x) {
				var label = ensIdObj.label;
				
				if(label in chart.regionFeature) {
					label = chart.regionFeature[label].label + " \n("+label+')';
				}
				
				categories.push(label);
				ensIdObj.x = x;
			});
			
			// At last! Setting the categories!!
			chart.options.xAxis.categories = categories;
			
			chart.boxPlotCategories = allEnsIdsHash;
		}
		
		// Now, second pass!!
		var isEmpty = true;
		chart.allData.forEach(function(series) {
			var reDigest = !stillLoading || !('term_type' in series);
			
			// isEmpty detector
			if(series.filteredSeriesValues.length > 0) {
				isEmpty = false;
			}
			
			if(reDigest && (doGenerate || !series.seriesDigestedValues)) {
				var preparedValues = new Array(chart.options.xAxis.categories.length);
				
				series.seriesPreDigestedValues.forEach(function(boxplot) {
					preparedValues[chart.boxPlotCategories[boxplot.label].x] = boxplot.data;
					boxplot.data.x = chart.boxPlotCategories[boxplot.label].x;
				});
				series.seriesDigestedValues = preparedValues;
				//chart.options.series[iSeries].data = series.seriesDigestedValues;
				series.series[series.seriesDest] = series.seriesDigestedValues;
			}
			//console.log("DEBUG "+g.name);
			//console.log(series.seriesValues);
			//series.seriesValues = undefined;
			if(series.linkedTo === undefined) {
				var visibilityState;
				if('term_type' in series) {
					visibilityState = !stillLoading && !series.term_type.termHidden;
				} else {
					visibilityState = stillLoading || !chart.meanSeriesHidden;
				}
				
				series.series.visible = visibilityState;
				series.series.showInLegend =  visibilityState;
			} else {
				// Linked series
				series.series.visible = series.linkedTo.series.visible;
				series.series.showInLegend =  false;
			}
		});
		
		// It is assigned only once
		chart.isEmpty = isEmpty;
		chart.isLoading = stillLoading;
	}
	
	// This function was designed as a method from chart (i.e. it does not work alone)
	function defaultSeriesAggregator(doGenerate,stillLoading,filterFunc) {
		// jshint validthis:true
		var chart = this;
		// jshint validthis:false
		
		var isEmpty = true;
		stillLoading = !!stillLoading;
		chart.allData.forEach(function(series) {
			var reDigest = series.filteredSeriesValues === null || series.filteredSeriesValues === undefined || !stillLoading || !('term_type' in series);
			if(series.filteredSeriesValues === null || series.filteredSeriesValues === undefined) {
				if(filterFunc) {
					series.filteredSeriesValues = series.seriesValues.filter(filterFunc);
				} else {
					series.filteredSeriesValues = series.seriesValues;
				}
				
				// Invalidate digested values
				series.seriesDigestedValues = null;
			}
			
			// isEmpty detector
			if(series.filteredSeriesValues.length > 0) {
				isEmpty = false;
			}
			
			if(reDigest && (doGenerate || !series.seriesDigestedValues)) {
				series.seriesDigestedValues = series.seriesGenerator();
				series.series[series.seriesDest] = series.seriesDigestedValues;
			}
			//console.log("DEBUG "+g.name);
			//console.log(series.seriesValues);
			//series.seriesValues = undefined;
			var visibilityState;
			var showInLegend;
			if(series.linkedTo !== undefined) {
				visibilityState = series.linkedTo.series.visible;
				showInLegend = false;
			} else {
				if('term_type' in series) {
					visibilityState = !stillLoading && !series.term_type.termHidden;
				} else {
					visibilityState = stillLoading || !chart.meanSeriesHidden;
				}
				showInLegend = visibilityState;
			}
			
			switch(chart.library) {
				case LIBRARY_HIGHCHARTS:
					series.series.visible = visibilityState;
					series.series.showInLegend = showInLegend;
					break;
				case LIBRARY_PLOTLY:
					series.series.visible = visibilityState;
					series.series.showlegend = showInLegend;
					break;
				case LIBRARY_NVD3:
					if(visibilityState) {
						series.series[series.seriesDest] = [];
					} else {
						series.series[series.seriesDest] = series.seriesDigestedValues;
					}
					break;
			}
		});
		
		// It is assigned only once
		chart.isEmpty = isEmpty;
		chart.isLoading = stillLoading;
	}
	
	function dataSeriesComparator(a,b) {
		return a[0] - b[0];
	}
	
	// This function was designed as a method from series (i.e. it does not work alone)
	function genMeanSeries(/*optional*/origValues) {
		// jshint validthis:true
		if(origValues===undefined || origValues===null) {
			origValues = this.filteredSeriesValues;
		}
		// jshint validthis:false
		
		var meanValues = [];
		
		// Pre-processing the original values
		var values = [];
		origValues.forEach(function(augData) {
			var data = augData.sDataS;
			var diff = data[1] - data[0];
			var sDataS = [data[0],data[2],diff];
			values.push(sDataS);
			if(diff!==0) {
				var sDataE = [data[1],data[2],-1];
				values.push(sDataE);
			}
		});
		values.sort(dataSeriesComparator);
		
		var numPos = 0;
		var sumPosVal = 0.0;
		var numNeg = 0;
		var sumNegVal = 0.0;
		
		var prevPos = 0;
		
		values.forEach(function(point) {
			if(prevPos!==point[0]) {
				if(numPos!==0) {
					var mean = sumPosVal  / numPos;
					meanValues.push({x: prevPos,y: mean});
					
					// Now, time to remove, which keeps order
					if(numNeg > 0) {
						if(numNeg === numPos) {
							meanValues.push({x: prevPos,y:null});
							numPos = 0;
							sumPosVal = 0.0;
						} else {
							numPos -= numNeg;
							sumPosVal -= sumNegVal;
						}
						numNeg = 0;
						sumNegVal = 0.0;
					}
				}
				prevPos = point[0];
			}
			
			if(point[2] !== -1) {
				// Add a point
				numPos++;
				sumPosVal += point[1];
			}
			if(point[2] === -1 || point[2] === 0) {
				// Schedule point removal
				numNeg++;
				sumNegVal += point[1];
			}
		});
		// Corner case
		if(numPos!==0) {
			var mean = sumPosVal  / numPos;
			meanValues.push({x: prevPos,y: mean});
		}
		
		return meanValues;
	}
	
	// This function was designed as a method from series (i.e. it does not work alone)
	function genMeanSeriesHighcharts() {
		// jshint validthis:true
		return genMeanSeries.call(this).map(function(meanValue) {
			return [meanValue.x,meanValue.y];
		});
		// jshint validthis:false
	}
	
	function dataSeriesValueComparator(segment1,segment2) {
		return segment1[2] - segment2[2];
	}
	
	// This function was designed as a method from series (i.e. it does not work alone)
	function genAreaRangeSeries(/*optional*/origValues) {
		// jshint validthis:true
		if(origValues===undefined || origValues===null) {
			origValues = this.filteredSeriesValues;
		}
		// jshint validthis:false
		
		var minMaxValues = [];
		
		// Pre-processing the original values
		var values = [];
		origValues.forEach(function(augData) {
			var data = augData.sDataS;
			var diff = data[1] - data[0];
			var sDataS = [data[0],data,diff];
			values.push(sDataS);
			if(diff!==0) {
				var sDataE = [data[1],data,-1];
				values.push(sDataE);
			}
		});
		values.sort(dataSeriesComparator);
		
		var currSegments = [];
		var toRemove = [];

		var prevPos = 0;
		var toBeSorted = false;
		values.forEach(function(point) {
			if(prevPos!==point[0]) {
				if(currSegments.length > 0) {
					if(toBeSorted) {
						currSegments.sort(dataSeriesValueComparator);
						toBeSorted = false;
					}
					
					minMaxValues.push({x: prevPos , min: currSegments[0][2] , max: currSegments[currSegments.length-1][2]});
					
					// Now, time to remove, which keeps order
					if(toRemove.length > 0) {
						if(toRemove.length === currSegments.length) {
							currSegments = [];
							// Dealing with the corner case of a hole
							minMaxValues.push({x: prevPos , min: null , max: null});
						} else {
							toRemove.forEach(function(point) {
								currSegments.splice(currSegments.indexOf(point),1);
							});
						}
						toRemove = [];
					}
				}
				prevPos = point[0];
			}
			
			if(point[2] !== -1) {
				// Add a point. Label it as to be sorted (if needed)
				toBeSorted = true;
				currSegments.push(point[1]);
				if(currSegments.length > 1) {
					toBeSorted = true;
				}
			}
			if(point[2] === -1 || point[2] === 0) {
				// Schedule point removal
				toRemove.push(point[1]);
			}
		});
		
		// Last iteration
		if(currSegments.length > 0) {
			if(toBeSorted) {
				currSegments.sort(dataSeriesValueComparator);
				toBeSorted = false;
			}
			
			minMaxValues.push({x: prevPos , min: currSegments[0][2] , max: currSegments[currSegments.length-1][2]});
		}
		
		return minMaxValues;
	}
	
	// This function was designed as a method from series (i.e. it does not work alone)
	function genAreaRangeSeriesHighcharts() {
		// jshint validthis:true
		return genAreaRangeSeries.call(this).map(function(rangeValue) {
			return [rangeValue.x,rangeValue.min,rangeValue.max];
		});
		// jshint validthis:false
	}
	
	function origSeriesComparator(a,b) {
		var retval = a[0] - b[0];
		
		if(retval===0) {
			retval = a[1] - b[1];
		}
		
		return retval;
	}
	
	// This function was designed as a method from series (i.e. it does not work alone)
	function genSegmentSeries(/*optional*/origValues) {
		// jshint validthis:true
		if(origValues===undefined || origValues===null) {
			origValues = this.filteredSeriesValues;
		}
		// jshint validthis:false
		
		var retValues = [];
		
		// Pre-processing the original values
		if(origValues.length > 0) {
			var sortedOrigValues = origValues.map(function(augData) {
				return augData.sDataS;
			});
			sortedOrigValues.sort(origSeriesComparator);
			
			sortedOrigValues.forEach(function(data) {
				retValues.push({x:data[0], y:data[2]},{x:data[1], y:data[2]},{x:data[1], y:null});
			});
			
			// Removing last, spureous null
			retValues.pop();
		}
		
		return retValues;
	}
	
	// This parameter changes the reserved space for the feature series
	var FeatureSeriesFraction = 6;
	
	// FeatureDrawer class
	function FeatureDrawer(minVal,maxVal) {
		// These are needed for scaled shapes
		this.minVal = minVal;
		this.maxVal = maxVal;
		
		this.featureSeriesHash = {};
		this.featureSeries = [];
		this.category = [];
		
		this.extendedFeatureSeriesHash = {};
		this.extendedFeatureSeries = [];
		this.extendedCategory = [];
		
		this.yAxis = {
			title: {
				text: 'Transcripts',
				offset: 15,
			},
			type: 'category',
			gridLineWidth: 0,
			labels: {
				step: 1,
			//	style: {
			//		fontWeight: 'normal'
			//	}
			},
			min: 0,
			//max: -1,
			maxPadding: FeatureSeriesFraction,
			minPadding: 0,
			startOnTick: false,
			endOnTick: false,
			//showLastLabel: false,
			//tickInterval: 1,
			opposite: true,
		};
	}
	
	FeatureDrawer.prototype.addFeatureType = function(featureType) {
		var series = {
			id: featureType,
			name: featureType,
			type: 'polygon',
			animation: false,
			enableMouseTracking: false,
			showInLegend: true,
			yAxis: 1,
			// Disabling turboThreshold, as Highcharts does not
			// allow pure nulls on series longer than the threshold
			turboThreshold: 0,
			data: []
		};
		if(featureType in DRAWABLE_REGION_FEATURES_V1) {
			series.color = DRAWABLE_REGION_FEATURES_V1[featureType].color;
		}
		this.featureSeries.push(series);
		this.featureSeriesHash[featureType] = series;
		
		var extendedSeries = angular.copy(series);
		extendedSeries.id += '-ex';
		this.extendedFeatureSeries.push(extendedSeries);
		this.extendedFeatureSeriesHash[featureType] = extendedSeries;
	};
	
	FeatureDrawer.prototype.addCategory = function(category,isMain) {
		this.extendedCategory.push(category);
		if(isMain) {
			this.category.push(category);
		}
		this.currentCategoryMain = !!isMain;
	};
	
	FeatureDrawer.prototype.abstractDraw = function(feature,featureSeries,yBase) {
		var coord = feature.coordinates[0];
		// Needed to separate one polygon from another
		if(featureSeries.length > 0) {
			featureSeries.push([featureSeries[featureSeries.length-1][0],null]);
		}
		switch(feature.feature) {
			case ConstantsService.REGION_FEATURE_GENE:
				// Easiest shape: a thin rectangle
				featureSeries.push(
					[coord.chromosome_start,-1/36+yBase],
					[coord.chromosome_start,1/36+yBase],
					[coord.chromosome_end,1/36+yBase],
					[coord.chromosome_end,-1/36+yBase]
				);
				break;
			case ConstantsService.REGION_FEATURE_TRANSCRIPT:
				// Easiest shape: a thin rectangle
				featureSeries.push(
					[coord.chromosome_start,-1/12+yBase],
					[coord.chromosome_start,1/12+yBase],
					[coord.chromosome_end,1/12+yBase],
					[coord.chromosome_end,-1/12+yBase]
				);
				break;
			case ConstantsService.REGION_FEATURE_EXON:
				// Easiest shape: a thin rectangle
				if(coord.chromosome_strand===1 || coord.chromosome_strand===null) {
					featureSeries.push(
						[coord.chromosome_start,-1/4+yBase],
						[coord.chromosome_start,1/4+yBase]
					);
					if(coord.chromosome_strand===1) {
						var leftPos = Math.round((coord.chromosome_end + 2*coord.chromosome_start)/3);
						featureSeries.push(
							[leftPos,1/4+yBase],
							[coord.chromosome_end,yBase],
							[leftPos,-1/4+yBase]
						);
					}
				}
				if(coord.chromosome_strand===-1 || coord.chromosome_strand===null) {
					if(coord.chromosome_strand===-1) {
						var RightPos = Math.round((2*coord.chromosome_end + coord.chromosome_start)/3);
						featureSeries.push(
							[RightPos,-1/4+yBase],
							[coord.chromosome_start,yBase],
							[RightPos,1/4+yBase]
						);
					}
					featureSeries.push(
						[coord.chromosome_end,1/4+yBase],
						[coord.chromosome_end,-1/4+yBase]
					);
				}
				break;
			default:
				// Easiest shape: a thin rectangle
				featureSeries.push(
					[coord.chromosome_start,-1/4+yBase],
					[coord.chromosome_start,1/4+yBase],
					[coord.chromosome_end,1/4+yBase],
					[coord.chromosome_end,-1/4+yBase]
				);
				break;
		}
	};
	
	FeatureDrawer.prototype.draw = function(feature) {
		this.abstractDraw(feature,this.extendedFeatureSeriesHash[feature.feature].data,this.extendedCategory.length - 1);
		if(this.currentCategoryMain) {
			this.abstractDraw(feature,this.featureSeriesHash[feature.feature].data,this.category.length - 1);
		}
	};
	
	FeatureDrawer.prototype.close = function() {
		var i;
		// Removing empty feature series
		for(i=this.featureSeries.length-1;i>=0;i--) {
			if(this.featureSeries[i].data.length === 0) {
				this.featureSeries.splice(i,1);
			}
		}
		// Also here
		for(i=this.extendedFeatureSeries.length-1;i>=0;i--) {
			if(this.extendedFeatureSeries[i].data.length === 0) {
				this.extendedFeatureSeries.splice(i,1);
			}
		}
		
		var origCatLength;
		// Adjusting the space for the categories
		for(i=0, origCatLength = this.category.length; i<(FeatureSeriesFraction-1)*origCatLength; i++) {
			this.category.push('');
		}
		
		// Now, for the extended categories
		for(i=0, origCatLength = this.extendedCategory.length; i<(FeatureSeriesFraction-1)*origCatLength; i++) {
			this.extendedCategory.push('');
		}
		
		// Putting a new line on the last series name
		// due Highcharts limitations on legend rendering
		// (it is not possible to put two legends or to force a new row / column)
		if(this.featureSeries.length > 0) {
			this.featureSeries[this.featureSeries.length-1].name += new Array(60).join(' ');
		}
		// Also here
		if(this.extendedFeatureSeries.length > 0) {
			this.extendedFeatureSeries[this.extendedFeatureSeries.length-1].name += new Array(60).join(' ');
		}
		
		// Setting up
		this.showAllCategories(false);
	};
	
	FeatureDrawer.prototype.showAllCategories = function(doShowAll) {
		var dontShowAll = !doShowAll;
		doShowAll = !dontShowAll;
		
		var categories = doShowAll ? this.extendedCategory : this.category;
		
		this.yAxis.categories = categories;
		this.yAxis.max = categories.length - 1;
		this.yAxis.tickAmount = categories.length;
		
		this.featureSeries.forEach(function(series) {
			// Hiding empty features series in legend (easier than removing them)
			var showStat = (series.data.length !== 0) ? dontShowAll : false;
			
			series.visible = showStat;
			series.showInLegend = showStat;
		});
		
		this.extendedFeatureSeries.forEach(function(series) {
			// Hiding empty features series in legend (easier than removing them)
			var showStat = (series.data.length !== 0) ? doShowAll : false;
			
			series.visible = showStat;
			series.showInLegend = showStat;
		});
	};
	
	FeatureDrawer.prototype.getYAxis = function() {
		return this.yAxis;
	};
	
	FeatureDrawer.prototype.getSeries = function() {
		if(this.allFeatureSeries === undefined) {
			this.allFeatureSeries = this.featureSeries.concat(this.extendedFeatureSeries);
		}
		return this.allFeatureSeries;
	};
	
	FeatureDrawer.processGenomicLayout = function(regionLayout) {
		var fDraw;
		if(regionLayout !== undefined && Array.isArray(regionLayout[ConstantsService.REGION_FEATURE_GENE])) {
			fDraw = new FeatureDrawer();
			// Scaffolding the genomic features series
			ConstantsService.REGION_FEATURES.forEach(function(feature) {
				fDraw.addFeatureType(feature);
			});
			var genes = regionLayout[ConstantsService.REGION_FEATURE_GENE];
			
			// Do it in reverse order, so first genes are the last categories
			for(var iGene=genes.length-1;iGene>=0;iGene--) {
				var gene = genes[iGene];
				// Now, select best transcript
				if(ConstantsService.REGION_FEATURE_TRANSCRIPT in gene) {
					if(gene.mainTranscript!==undefined) {
						gene[ConstantsService.REGION_FEATURE_TRANSCRIPT].forEach(function(transcript) {
							// The main transcript is a better category than the gene
							fDraw.addCategory(transcript.label,gene.mainTranscript===transcript);
							
							fDraw.draw(transcript);
							
							// And now process all the associated UTRs and exons / CDS
							if(ConstantsService.REGION_FEATURE_UTR in transcript) {
								transcript[ConstantsService.REGION_FEATURE_UTR].forEach(function(UTR) {
									fDraw.draw(UTR);
								});
							}
							
							if(ConstantsService.REGION_FEATURE_EXON in transcript) {
								transcript[ConstantsService.REGION_FEATURE_EXON].forEach(function(exon) {
									fDraw.draw(exon);
									// Draw CDS (when available)
									if(ConstantsService.REGION_FEATURE_CDS in exon) {
										exon[ConstantsService.REGION_FEATURE_CDS].forEach(function(CDS) {
											fDraw.draw(CDS);
										});
									}
									
									// At last, process start and stop codons
									if(ConstantsService.REGION_FEATURE_START_CODON in exon) {
										exon[ConstantsService.REGION_FEATURE_START_CODON].forEach(function(start_codon) {
											fDraw.draw(start_codon);
										});
									}
									if(ConstantsService.REGION_FEATURE_STOP_CODON in exon) {
										exon[ConstantsService.REGION_FEATURE_STOP_CODON].forEach(function(stop_codon) {
											fDraw.draw(stop_codon);
										});
									}
								});
							}
						});
					} else {
						// Each gene is a category
						fDraw.addCategory(gene.label,true);
						// Last, push the shape of the gene if there is nothing to show
						fDraw.draw(gene);
					}
				}
					
			}
			
			fDraw.close();
		}
		
		return fDraw;
	};
	
	function getChartsView(rangeData,viewClass) {
		if(rangeData === undefined) {
			return undefined;
		}
		if(viewClass===undefined) {
			if(rangeData.viewClass === undefined) {
				return {};
			}
			viewClass = rangeData.viewClass;
		}
		
		return rangeData.ui.chartViews[viewClass];
	}
	
	function getCharts(rangeData,viewClass) {
		var chartViews = getChartsView(rangeData,viewClass);
		
		return chartViews.charts;
	}
	
	// Idea taken from https://github.com/pablojim/highcharts-ng/issues/243
	function synchronizedZoomHandler(event,originChart,rangeData) {
		var charts = getCharts(rangeData);
		if(event.xAxis) {
			charts.forEach(function(oChart) {
				if(originChart!==oChart && oChart.type !== GRAPH_TYPE_BOXPLOT_HIGHCHARTS && oChart.library === LIBRARY_HIGHCHARTS) {
					var chart = oChart.options.getHighcharts();
					chart.xAxis[0].setExtremes(event.xAxis[0].min,event.xAxis[0].max);
					if(!chart.resetZoomButton) {
						chart.showResetZoom();
					}
				}
			});
		} else {
			charts.forEach(function(oChart) {
				if(originChart!==oChart && oChart.type !== GRAPH_TYPE_BOXPLOT_HIGHCHARTS && oChart.library === LIBRARY_HIGHCHARTS) {
					var chart = oChart.options.getHighcharts();
					chart.xAxis[0].setExtremes(null,null);
					if(chart.resetZoomButton) {
						chart.resetZoomButton = chart.resetZoomButton.destroy();
					}
				}
			});
		}
	}
	
	// Filling the exported view array later
	var EXPORTED_VIEWS;
	var RedrawSelector;
	
	function setChartSubtitle(chart,rangeData,viewClass) {
		switch(chart.library) {
			case LIBRARY_HIGHCHARTS:
				if(chart.subtitle) {
					chart.options.subtitle = {
						text: chart.subtitle
					};
					if(rangeData.ui.filterDesc && RedrawSelector[viewClass].canFilter) {
						chart.options.subtitle.text += ' (filtered by '+rangeData.ui.filterDesc+')';
					}
				}
				break;
		}
	}
	
	function doChartLayout(rangeData,viewClass,postTitle) {
		if(rangeData.regionLayout === undefined || rangeData.regionLayout === null) {
			return;
		}
		
		var view;
		if(viewClass===undefined || !(viewClass in RedrawSelector)) {
			view = EXPORTED_VIEWS[0];
			viewClass = view.viewClass;
		} else {
			view = RedrawSelector[viewClass];
		}
		var charts = [];
		var chartsMap = {};
		getChartsView(rangeData,viewClass).charts = charts;
		rangeData.chartMaps[view.chartMapsFacet] = chartsMap;
		
		var range_start = rangeData.range.start;
		var range_end = rangeData.range.end;
		if(rangeData.flankingWindowSize!==undefined) {
			range_start -= rangeData.flankingWindowSize;
			range_end += rangeData.flankingWindowSize;
		}
		
		// So, we can prepare the charts
		var histoneInstance;
		
		var GraphPrepare = function(gData) {
			var title = gData.title;
			var legendTitle = view.legendTitle;
			var noData = gData.noData;
			var gName = gData.name;
			
			if(histoneInstance!==undefined) {
				title += ' ' + histoneInstance.histoneName;
				noData += ' ' + histoneInstance.histoneName;
				gName += ' ' + histoneInstance.histoneName;
			}
			if(postTitle!==undefined) {
				title += ' on ' + postTitle;
			}
			
			var chartViews = gData.views.map(function(gDataView,iG) {
				var chart;
				
				var listTitle = title;
				if(gDataView.viewPostTitle !== undefined) {
					listTitle += gDataView.viewPostTitle;
				} else if(iG > 0) {
					// This is to distinguish the different charts
					// new they do not have a view post title
					listTitle += ' (' + (iG+1) + ')';
				}
				
				var gDataViewType = Array.isArray(gDataView.type) ? gDataView.type[0] :  gDataView.type;
				var libraryChartType;
				switch(gDataViewType) {
					case GRAPH_TYPE_STEP_NVD3:
						chart = {
							options: {
								chart: {
									type: 'lineChart',
									x: getXG,
									y: getYG,
									useInteractiveGuideline: true,
									interpolate: 'step',
									noData: "Fetching "+noData+" from "+rangeData.rangeStr,
									showLegend: false,
									transitionDuration: 0,
									xAxis: {
										axisLabel: 'Coordinates (at '+rangeData.rangeStrEx+')'
									},
									yAxis: {
										axisLabel: gData.yAxisLabel,
										tickFormat: d3.format('.3g')
									}
								},
								title: {
									text: title
								},
							},
							data: [],
							seriesAggregator: defaultSeriesAggregator,
							library: LIBRARY_NVD3,
						};
						break;
					case GRAPH_TYPE_STEP_CHARTJS:
						// Unfinished
						chart = {
							options: {
								type: 'line',
								options: {
									responsive: true,
									scales: {
										xAxes: [
											{
												display: true
											}
										],
										yAxes: [
											{
												display: true
											}
										]
									}
								},
								title: {
									text: title,
								},
								toolTip: {
									shared: true,
								},
								animationEnabled: true,
								zoomEnabled: true,
								exportEnabled: true,
								data: {
									datasets: []
								}
							},
							seriesAggregator: defaultSeriesAggregator,
							library: LIBRARY_CHARTJS,
						};
						break;
					case GRAPH_TYPE_STEP_CANVASJS:
						chart = {
							options: {
								title: {
									text: title,
								},
								toolTip: {
									shared: true,
								},
								animationEnabled: true,
								zoomEnabled: true,
								exportEnabled: true,
								data: []
							},
							seriesAggregator: defaultSeriesAggregator,
							library: LIBRARY_CANVASJS,
						};
						break;
					case GRAPH_TYPE_BOXPLOT_PLOTLY:
						chart = {
							seriesAggregator: plotlyBoxPlotAggregator,
							plotlyOptions: {
								width: 1500,
								height: 1500
							},
							data: [],
							library: LIBRARY_PLOTLY,
						};
						libraryChartType = 'boxplot';
						break;
						
					case GRAPH_TYPE_BOXPLOT_HIGHCHARTS:
						chart = {
							seriesAggregator: highchartsBoxPlotAggregator,
							library: LIBRARY_HIGHCHARTS,
						};
						libraryChartType = 'boxplot';
						break;
						
					case GRAPH_TYPE_STEP_HIGHCHARTS:
						chart = {
							seriesAggregator: defaultSeriesAggregator,
							library: LIBRARY_HIGHCHARTS,
						};
						libraryChartType = 'line';
						break;
						
					case GRAPH_TYPE_SPLINE_HIGHCHARTS:
						chart = {
							seriesAggregator: defaultSeriesAggregator,
							library: LIBRARY_HIGHCHARTS,
						};
						libraryChartType = 'spline';
						break;
						
					case GRAPH_TYPE_AREARANGE_HIGHCHARTS:
						chart = {
							seriesAggregator: defaultSeriesAggregator,
							library: LIBRARY_HIGHCHARTS,
						};
						libraryChartType = 'arearange';
						break;
						
					case GRAPH_TYPE_AREASPLINERANGE_HIGHCHARTS:
						chart = {
							seriesAggregator: defaultSeriesAggregator,
							library: LIBRARY_HIGHCHARTS,
						};
						libraryChartType = 'areasplinerange';
						break;
				}
				
				// Common attributes
				chart.chartId = gName;
				if(iG > 0) {
					chart.chartId += '_'+iG;
				}
				chart.type = gDataViewType;
				chart.graphTypes = Array.isArray(gDataView.type) ? gDataView.type : [ gDataView.type ];
				
				chart.title = title;
				chart.listTitle = listTitle;
				chart.subtitle = (gDataView.subtitle!==undefined) ? gDataView.subtitle : null;
				chart.yAxisLabel = gData.yAxisLabel;
				
				chart.allData = [];
				chart.regionFeature = rangeData.regionFeature;
				chart.bpSideData = {
					seriesToIndex: {},
					meanSeries: null
				};
				// Is this graph initially hidden?
				if(gDataView.isInitiallyHidden !== undefined) {
					chart.isHidden = gDataView.isInitiallyHidden;
				} else if(gData.isInitiallyHidden !== undefined) {
					chart.isHidden = gData.isInitiallyHidden;
				}
				chart.meanSeriesHidden = !rangeData.ui.initiallyShowMeanSeries;
				// Initial state, before any data
				chart.isLoading = true;
				chart.isEmpty = true;
				chart.isZoomed = false;
				
				// And now, specific customizations for this library
				switch(chart.library) {
					case LIBRARY_PLOTLY:
						var axisTitleFont = {
							family: 'Lucida Grande, Lucida Sans Unicode, Arial, Helvetica, sans-serif',
							size: '12px'
						};
						chart.options = {
							autosize: true,
							title: chart.title,
							font: {
								family: axisTitleFont.family,
								size: '11px'
							},
							titlefont: {
								size: '18px'
							},
							showlegend: true,
							legend: {
								orientation: 'h',
								y: -0.2
							},
							xaxis: {
								titlefont: axisTitleFont,
								tickangle: 0,
							},
							yaxis: {
								title: chart.yAxisLabel,
								titlefont: axisTitleFont,
							},
							margin: { 
								t: 50,
							},
						};
						switch(gDataViewType) {
							case GRAPH_TYPE_BOXPLOT_PLOTLY:
								chart.options.boxmode = 'group';
								chart.options.boxgap = 0.1;
								chart.options.xaxis.title = 'Ensembl Ids (at '+rangeData.rangeStrEx+')';
								break;
							default:
								chart.options.xaxis = {
									title: 'Coordinates (at '+rangeData.rangeStrEx+')'
								};
								break;
						};

						break;
					case LIBRARY_HIGHCHARTS:
						// Common options
						chart.options = {
							options: {
								chart: {
									type: libraryChartType,
									alignTicks: false,
									backgroundColor: null,
									events: {
										// reflowing after load and redraw events led to blank drawings
										//addSeries: function() {
										//	var chart = this;
										//	//this.reflow();
										//	setTimeout(function() {
										//		chart.reflow();
										//	},0);
										//}
									},
									animation: false,
									zoomType: 'x',
									panning: true,
									panKey: 'shift',
									resetZoomButton: {
										position: {
											align: 'left',
											x: 10,
											y: 10,
										},
										relativeTo: 'chart',
									},
								},
								legend: {
									enabled: true,
									title: {
										text: 'Genomic Features & '+legendTitle,
									},
									itemStyle: {
									//	cursor: 'pointer',
										whiteSpace: 'pre',
									},
								},
								plotOptions: {
									series: {
										animation: false
									}
								},
								exporting: HighchartsCommonExportingOptions,
							},
							drilldown: {
								drillUpButton: {
								},
								series: []
							},
							loading: true,
							series: [],
							//func: function(chart) {
							//	// This is needed to reflow the chart
							//	// to its final width
							//	$timeout(function() {
							//		chart.reflow();
							//	},0);
							//},
							lang: {
								noData: noData,
							},
							title: {
								text: chart.title,
							},
						};
						
						switch(gDataViewType) {
							case GRAPH_TYPE_BOXPLOT_HIGHCHARTS:
								chart.options.options.chart.zoomType = 'y';
								chart.options.options.tooltip = {
									animation: false,
									pointFormat: '<span style="color:{point.color}">\u25CF</span> <b>{series.name}</b><br/>' + // docs
										'Number: {point.number}<br/>' +
										'Maximum: {point.high}<br/>' +
										'Upper quartile: {point.q3}<br/>' +
										'Median: {point.median}<br/>' +
										'Lower quartile: {point.q1}<br/>' +
										'Minimum: {point.low}<br/>',
									backgroundColor: '#FFFFFF'
								};
								chart.options.options.plotOptions.series.groupPadding = 0.05;
								chart.options.xAxis = {
									title: {
										text: 'Ensembl Ids (at '+rangeData.rangeStrEx+')'
									},
									labels: {
										//style: {
										//	whiteSpace: 'pre',
										//},
										formatter: function() {
											return (this.value+'').replace("\n","<br/>");
										},
									},
									categories: [],
								};
								break;
							default:
								chart.options.options.tooltip = {
									animation: false,
									shared: true,
									backgroundColor: '#FFFFFF',
								};
								chart.options.xAxis = {
									title: {
										text: 'Coordinates (at '+rangeData.rangeStrEx+')'
									},
									min: range_start,
									max: range_end,
									allowDecimals: false,
								};
								chart.options.options.chart.events.selection = function(event) {
									synchronizedZoomHandler(event,chart,rangeData);
								};
								break;
						}
						
						// Setting the subtitle (if it is appropriate)
						setChartSubtitle(chart,rangeData,viewClass);
						var yAxis = {
							title: {
								text: chart.yAxisLabel
							},
							startOnTick: false,
							endOnTick: false,
						};
						
						// Setting the floor and ceiling when available
						if(gData.floor!==undefined) {
							yAxis.floor = gData.floor;
						}
						
						if(gData.ceiling!==undefined) {
							yAxis.ceiling = gData.ceiling;
						}
						
						if(gData.breaks!==undefined) {
							yAxis.breaks = gData.breaks;
							//yAxis.lineColor = 'black';
							yAxis.lineWidth = 1;
						}
						
						chart.options.yAxis = [ yAxis ];
						
						// New style markup
						if(gDataViewType !== GRAPH_TYPE_BOXPLOT_HIGHCHARTS) {
							// Do axis generation only once!
							if(rangeData.fDraw===undefined) {
								rangeData.fDraw = FeatureDrawer.processGenomicLayout(rangeData.regionLayout);
							}
							
							// Add axis whenever it is defined
							if(rangeData.fDraw!==undefined) {
								chart.fDraw = angular.copy(rangeData.fDraw);
								// Without this, it is not possible to make room for the
								// polygon series
								delete yAxis.floor;
								
								// Rounding to the first decimal
								yAxis.minPadding = Math.round(10.0/FeatureSeriesFraction)/10.0;
								if(yAxis.breaks !== undefined) {
									// For breaks we need less padding
									// The number was hard coded (sigh)
									yAxis.minPadding /= 1.9;
								}
								chart.options.yAxis.push(chart.fDraw.getYAxis());
								Array.prototype.push.apply(chart.options.series,chart.fDraw.getSeries());
							}
						}
						
						break;
				}
				
				charts.push(chart);
				
				return chart;
			});
			
			chartsMap[gName] = chartViews;
		};
		
		GRAPHS.forEach(GraphPrepare);
		
		rangeData.localScope.histones.forEach(function(histone) {
			histoneInstance = histone;
			HISTONE_GRAPHS.forEach(GraphPrepare);
		});
		
	}
	
	function doViewChartLayout(rangeData,view,selectedViewData) {
		var additionalText;
		if('selectGroupMethod' in view) {
			additionalText = view.selectGroupMethod(rangeData,view.viewClass,selectedViewData);
		}
		doChartLayout(rangeData,view.viewClass,additionalText);
	}
	
	function doInitialChartsLayout(rangeData) {
		for(var iView=0;iView<EXPORTED_VIEWS.length;iView++) {
			doViewChartLayout(rangeData,EXPORTED_VIEWS[iView]);
		}
	}
	
	var APPRIS_FACET_ID = 'APPRIS_PRINCIPAL';
	var TRANSCRIPT_TYPE_FACET_ID = 'transcript_type';
	var TRANSCRIPT_PROTEIN_CODING = 'protein_coding';
	var TRANSCRIPT_STATUS_FACET_ID = 'transcript_status';
	var TRANSCRIPT_STATUS_KNOWN = 'KNOWN';
	
	function doRegionFeatureLayout(rangeData,results,localScope) {
		rangeData.regionLayout = {};
		var range = rangeData.range;
		var rangeStr = range.chr+":"+range.start+"-"+range.end;
		var rangeStrEx = rangeStr + '';
		var range_start = range.start;
		var range_end = range.end;
		if(rangeData.flankingWindowSize!==undefined) {
			rangeStrEx += " \u00B1 "+rangeData.flankingWindowSize+"bp";
			range_start -= rangeData.flankingWindowSize;
			range_end += rangeData.flankingWindowSize;
		}
		
		// Now, we have the region layout and features
		var regionFeature = {};
		var found = '';
		var isReactome = ConstantsService.isReactome(range.currentQuery.queryType);
		var curRegionType = '';
		var curRegionTypeNum;
		results.sort(function(a,b) {
			if(a.feature!==b.feature) {
				return a.feature.localeCompare(b.feature);
			} else if(a.coordinates[0].chromosome_start !== b.coordinates[0].chromosome_start) {
				return a.coordinates[0].chromosome_start - b.coordinates[0].chromosome_start;
			} else {
				return a.coordinates[0].chromosome_end - b.coordinates[0].chromosome_end;
			}
		});
		
		// First pass, gather all features
		var features = [];
		var featuresHash = {};
		results.forEach(function(featureRegion) {
			features.push(featureRegion);
			var dest = featureRegion.feature;
			if(!(dest in rangeData.regionLayout)) {
				rangeData.regionLayout[dest] = [];
			}
			
			// Saving for later processing
			rangeData.regionLayout[dest].push(featureRegion);
			featureRegion.coordinates.forEach(function(coordinates) {
				featuresHash[coordinates.feature_id] = featureRegion;
			});
			
			// Getting a understandable label
			featureRegion.label = chooseLabelFromSymbols(featureRegion.symbol);
			
			if(LABELLED_REGION_FEATURES.some(function(feat) { return dest === feat; })) {
				if(curRegionType !== dest) {
					if(found.length > 0) {
						found += '; ';
					}
					curRegionType = dest;
					curRegionTypeNum = 0;
					found += curRegionType+'s: ';
				}
				var uri = (dest in localScope.SEARCH_URIS) ? localScope.SEARCH_URIS[dest] : localScope.DEFAULT_SEARCH_URI;
				
				// Matching the feature_id to its region
				featureRegion.coordinates.forEach(function(coordinates) {
					regionFeature[coordinates.feature_id] = featureRegion;
					
					if(isReactome && coordinates.feature_id.indexOf(rangeData.range.label)===0) {
						// Setting it only once
						rangeData.heading = rangeData.range.label = featureRegion.label;
						isReactome = false;
					}
					
					// Preparing the label
					if(curRegionTypeNum > 0) {
						found += ', ';
					}
					curRegionTypeNum++;
					found += " <a href='"+uri+coordinates.feature_id+"' title='"+coordinates.feature_id+"' target='_blank'>"+featureRegion.label+"</a>";
				});
			}
		});
		if(found.length>0) {
			var newFound = "Region <a href='"+localScope.REGION_SEARCH_URI+rangeStr+"' target='_blank'>chr"+rangeStr+"</a>";
			if(rangeData.flankingWindowSize!==undefined) {
				newFound += " (&plusmn; "+rangeData.flankingWindowSize+"bp)";
			}
			found = newFound + " overlaps " + found;
			
		} else {
			found = 'No gene or transcript in this region';
		}
		
		// Second pass, build features hierarchy based on feature_cluster_id
		features.forEach(function(feature) {
			feature.feature_cluster_id.forEach(function(feature_cluster_id) {
				if(feature_cluster_id !== feature.feature_id && (feature_cluster_id in featuresHash)) {
					var parentFeature = featuresHash[feature_cluster_id];
					var feaArray;
					if(feature.feature in parentFeature) {
						feaArray = parentFeature[feature.feature];
					} else {
						feaArray = [];
						parentFeature[feature.feature] = feaArray;
					}
					
					feaArray.push(feature);
				}
			});
		});
		// Third pass, choose main transcript for each gene
		if(ConstantsService.REGION_FEATURE_GENE in rangeData.regionLayout) {
			var genes = rangeData.regionLayout[ConstantsService.REGION_FEATURE_GENE];
			genes.forEach(function(gene) {
				if(ConstantsService.REGION_FEATURE_TRANSCRIPT in gene) {
					var transcripts = gene[ConstantsService.REGION_FEATURE_TRANSCRIPT];
					var mainTranscript;
					var proteinCodingTranscript;
					var knownTranscript;
					if(transcripts.length === 1) {
						mainTranscript = transcripts[0];
					} else {
						var found = transcripts.some(function(transcript) {
							// Finding the APPRIS attribute
							return transcript.attribute.some(function(attribute) {
								var retval = false;
								
								switch(attribute.domain) {
									case APPRIS_FACET_ID:
										mainTranscript = transcript;
										retval = true;
										break;
									case TRANSCRIPT_TYPE_FACET_ID:
										if(proteinCodingTranscript === undefined && attribute.value[0] === TRANSCRIPT_PROTEIN_CODING) {
											proteinCodingTranscript = transcript;
										}
										break;
									case TRANSCRIPT_STATUS_FACET_ID:
										if(knownTranscript === undefined && attribute.value[0] === TRANSCRIPT_STATUS_KNOWN) {
											knownTranscript = transcript;
										}
										break;
								}
								
								return retval;
							});
						});
						
						// If principal transcript / isoform is not found, use alternate ones
						if(!found) {
							if(proteinCodingTranscript!==undefined) {
								// Choose first found protein coding transcript
								mainTranscript = proteinCodingTranscript;
							} else if(knownTranscript!==undefined) {
								// Choose first known transcript
								mainTranscript = knownTranscript;
							} else {
								// In the worst case, choose first transcript
								mainTranscript = transcripts[0];
							}
						}
						
					}
					gene.mainTranscript = mainTranscript;
				}
			});
		}

		
		rangeData.regionFeature = regionFeature;
		rangeData.rangeStr = rangeStr;
		rangeData.rangeStrEx = rangeStrEx;
		rangeData.found = found;
		
		// Initializing the layouts, now the common data is available
		doInitialChartsLayout(rangeData);
	}
	
	function switchLegend(chart) {
		switch(chart.library) {
			case LIBRARY_HIGHCHARTS:
				chart.options.options.legend.enabled = ! chart.options.options.legend.enabled;
				break;
			case LIBRARY_PLOTLY:
				chart.options.showlegend = ! chart.options.showlegend;
				break;
		}
	}
	
	function isLegendEnabled(chart) {
		switch(chart.library) {
			case LIBRARY_HIGHCHARTS:
				return !!chart.options.options.legend.enabled;
			case LIBRARY_PLOTLY:
				return !!chart.options.showlegend;
				break;
			default:
				return true;
		}
	}
	
	
	// Next functions corresponds to processGeneralChartData refactoring
	function getDataArrays(rangeData,view) {
		var dataArrays;
		switch(view) {
			case VIEW_GENERAL:
				dataArrays = [ rangeData.fetchedData.all ];
				break;
			case VIEW_DISEASES:
				// Enabled for multiple selection
				dataArrays = rangeData.ui.celltypesSelected.map(function(celltypeSelected) {
					return rangeData.fetchedData.byCellType.hash[celltypeSelected.o_uri];
				});
				break;
			case VIEW_BY_TISSUE:
				dataArrays = [ rangeData.fetchedData.byTissue.hash[rangeData.ui.tissueSelected.o_uri] ];
				break;
		}
		
		return dataArrays;
	}
	
	function getOrigins(rangeData,view) {
		var origins;
		switch(view) {
			case VIEW_GENERAL:
				origins = [ rangeData.processedData.all ];
				break;
			case VIEW_DISEASES:
				origins = rangeData.ui.celltypesSelected.map(function(celltypeSelected) {
					return rangeData.processedData.byCellType[celltypeSelected.o_uri];
				});
				break;
			case VIEW_BY_TISSUE:
				origins = [ rangeData.processedData.byTissue[rangeData.ui.tissueSelected.o_uri] ];
				break;
		}
		
		return origins;
	}
	
	function setIOrigin(rangeData,view,origin,iSelected) {
		switch(view) {
			case VIEW_GENERAL:
				rangeData.processedData.all = origin;
				break;
			case VIEW_DISEASES:
				rangeData.processedData.byCellType[rangeData.ui.celltypesSelected[iSelected].o_uri] = origin;
				break;
			case VIEW_BY_TISSUE:
				rangeData.processedData.byTissue[rangeData.ui.tissueSelected.o_uri] = origin;
				break;
		}
	}
	
	function getMeanSeriesIdFacet(view) {
		var meanSeriesIdFacet;
		
		switch(view) {
			case VIEW_GENERAL:
				meanSeriesIdFacet = 'meanCellTypeSeriesId';
				break;
			case VIEW_DISEASES:
				// We don't want mean series
				break;
			case VIEW_BY_TISSUE:
				meanSeriesIdFacet = 'meanCellTypeSeriesId';
				break;
		}
		
		return meanSeriesIdFacet;
	}
	
	function getSeriesIdFacet(view) {
		var seriesIdFacet;
		switch(view) {
			case VIEW_GENERAL:
				seriesIdFacet = 'cellTypeSeriesId';
				break;
			case VIEW_DISEASES:
				seriesIdFacet = 'diseaseSeriesId';
				break;
			case VIEW_BY_TISSUE:
				seriesIdFacet = 'cellTypeSeriesId';
				break;
		}
		
		return seriesIdFacet;
	}
	
	function getTermType(data,seriesNodesHash,view) {
		var term_type;
		
		switch(view) {
			case VIEW_GENERAL:
				term_type = seriesNodesHash[data.analysis.cell_type.o_uri];
				break;
			case VIEW_DISEASES:
				term_type = seriesNodesHash[data.analysis.lab_experiment.sample.specimen.donor_disease];
				break;
			case VIEW_BY_TISSUE:
				term_type = seriesNodesHash[data.analysis.cell_type.o_uri];
				break;
		}
		
		return term_type;
	}
	
	function getSeriesName(data,term_type,view) {
		var seriesName;
		
		switch(view) {
			case VIEW_GENERAL:
				seriesName = data.analysis.cell_type.name;
				break;
			case VIEW_DISEASES:
				seriesName = term_type.name;
				break;
			case VIEW_BY_TISSUE:
				seriesName = data.analysis.cell_type.name;
				break;
		}
		
		return seriesName;
	}
	
	function getSeriesColor(data,term_type,view) {
		var seriesColor;
		
		switch(view) {
			case VIEW_GENERAL:
				seriesColor = data.analysis.cell_type.color;
				break;
			case VIEW_DISEASES:
				seriesColor = term_type.color;
				break;
			case VIEW_BY_TISSUE:
				seriesColor = data.analysis.cell_type.color;
				break;
		}
		
		return seriesColor;
	}
	
	function getChartMaps(rangeData,viewClass) {
		if(viewClass===undefined) {
			viewClass = rangeData.viewClass;
		}
		
		return rangeData.chartMaps[RedrawSelector[viewClass].chartMapsFacet];
	}
	
	function getSeriesNodesHash(rangeData,viewClass) {
		var chartsView = getChartsView(rangeData,viewClass);
		
		return chartsView.termNodesHash;
	}
	
	function getSeriesNodes(rangeData,viewClass) {
		var chartsView = getChartsView(rangeData,viewClass);
		
		return chartsView.termNodes;
	}
	
	function getGroupBySeriesNodes(rangeData,viewClass) {
		if(viewClass===undefined) {
			viewClass = rangeData.viewClass;
		}
		
		return ('groupBySeriesNodesFacet' in RedrawSelector[viewClass]) ? rangeData[RedrawSelector[viewClass].groupBySeriesNodesFacet] : [];
	}
	
	function getLegendTitle(viewClass,rangeData) {
		if(viewClass===undefined) {
			if(rangeData === undefined || rangeData.viewClass === undefined) {
				return '';
			}
			viewClass = rangeData.viewClass;
		}
		
		return RedrawSelector[viewClass].legendTitle;
	}
	
	// This is almost identical to processGeneralChartData
	function abstractProcessChartData(rangeData,view) {
		var dataArrays = getDataArrays(rangeData,view);
		var origins = getOrigins(rangeData,view);
		
		var retval = origins.some(function(origin,iOrigin) { return origin<dataArrays[iOrigin].length; });
		if(retval) {
			var localScope = rangeData.localScope;
			var chartMaps = getChartMaps(rangeData,view);
			var seriesNodesHash = getSeriesNodesHash(rangeData,view);
			var meanSeriesIdFacet = getMeanSeriesIdFacet(view);
			var seriesIdFacet = getSeriesIdFacet(view);
			
			var addToSeriesValuesArray = function(seriesValuesArray,chart,data,seriesIdFacet,isMeanSeries) {
				var seriesValuesList;
				
				if(data[seriesIdFacet] in chart.bpSideData.seriesToIndex) {
					seriesValuesList = chart.bpSideData.seriesToIndex[data[seriesIdFacet]];
				} else {
					seriesValuesList = [];
					
					// We need this shared reference
					var term_type;
					
					var seriesName;
					var seriesColor;
					if(isMeanSeries) {
						chart.bpSideData.meanSeries = localScope.AVG_SERIES_COLORS[data[seriesIdFacet]];
						seriesName = chart.bpSideData.meanSeries.name;
						seriesColor = chart.bpSideData.meanSeries.color;
					} else {
						term_type = getTermType(data,seriesNodesHash,view);
						seriesName = getSeriesName(data,term_type,view);
						seriesColor = getSeriesColor(data,term_type,view);
					}
					
					var firstSeries;
					chart.graphTypes.forEach(function(graphType,iGraphType) {
						var seriesValues = [];
						var series;
						
						switch(graphType) {
							case GRAPH_TYPE_STEP_CHARTJS:
								series = {
									seriesGenerator: genMeanSeries,
									series: {
										label: seriesName,
										strokeColor: seriesColor,
									}
								};
								break;
							case GRAPH_TYPE_STEP_CANVASJS:
								series = {
									seriesGenerator: genMeanSeries,
									series: {
										type: "stepLine",
										name: seriesName,
										color: seriesColor,
									}
								};
								break;
							case GRAPH_TYPE_BOXPLOT_HIGHCHARTS:
								series = {
									seriesGenerator: genBoxPlotSeries,
									series: {
										type: 'boxplot',
									}
								};
								break;
							case GRAPH_TYPE_BOXPLOT_PLOTLY:
								series = {
									seriesGenerator: genPlotlyBoxPlotSeries,
									series: {
										type: 'box',
										boxpoints: 'all',
										boxmean: true,
										line: {
											width: 1,
										},
										jitter: 0.3,
									}
								};
								break;
							case GRAPH_TYPE_STEP_HIGHCHARTS:
								series = {
									seriesGenerator: genMeanSeriesHighcharts,
									series: {
										type: 'line',
										shadow: false,
										connectNulls: false,
										marker: {
											enabled: false
										},
										tooltip: {
											shared: true,
											shadow: false,
										},
										// Put turboThreshold=0 if you are pushing pure nulls,
										// as Highcharts does not allow nulls on series longer
										// than the threshold
										turboThreshold: 1000,
										step: 'left',
									}
								};
								break;
							case GRAPH_TYPE_SPLINE_HIGHCHARTS:
								series = {
									seriesGenerator: genMeanSeriesHighcharts,
									series: {
										type: 'spline',
										shadow: false,
										connectNulls: false,
										marker: {
											enabled: false
										},
										tooltip: {
											shared: true,
											shadow: false,
										},
										// Put turboThreshold=0 if you are pushing pure nulls,
										// as Highcharts does not allow nulls on series longer
										// than the threshold
										turboThreshold: 1000,
									}
								};
								break;
							case GRAPH_TYPE_AREARANGE_HIGHCHARTS:
								series = {
									seriesGenerator: genAreaRangeSeriesHighcharts,
									series: {
										type: 'arearange',
										fillOpacity: 0.3,
										lineWidth: 0,
										shadow: false,
										connectNulls: false,
										marker: {
											enabled: false
										},
										tooltip: {
											shared: true,
											shadow: false,
										},
										// Put turboThreshold=0 if you are pushing pure nulls,
										// as Highcharts does not allow nulls on series longer
										// than the threshold
										turboThreshold: 1000,
									}
								};
								break;
							case GRAPH_TYPE_AREASPLINERANGE_HIGHCHARTS:
								series = {
									seriesGenerator: genAreaRangeSeriesHighcharts,
									series: {
										type: 'areasplinerange',
										fillOpacity: 0.3,
										lineWidth: 0,
										shadow: false,
										connectNulls: false,
										marker: {
											enabled: false
										},
										tooltip: {
											shared: true,
											shadow: false,
										},
										// Put turboThreshold=0 if you are pushing pure nulls,
										// as Highcharts does not allow nulls on series longer
										// than the threshold
										turboThreshold: 1000,
									}
								};
								break;
							case GRAPH_TYPE_STEP_NVD3:
								series = {
									seriesGenerator: genMeanSeries,
									series: {
										key: seriesName,
										color: seriesColor,
									}
								};
								break;
						}
						
						// Saving the real series location
						series.filteredSeriesValue = null;
						series.seriesValues = seriesValues;
						switch(chart.library) {
							case LIBRARY_HIGHCHARTS:
								series.seriesDest = 'data';
								series.series.id = data[seriesIdFacet]+'-'+iGraphType;
								series.series.name = seriesName;
								series.series.color = seriesColor;
								
								chart.options.series.push(series.series);
								break;
							case LIBRARY_NVD3:
								series.seriesDest = 'values';
								
								chart.data.push(series.series);
								break;
							case LIBRARY_CHARTJS:
								series.seriesDest = 'data';
								
								chart.options.data.datasets.push(series.series);
								break;
							case LIBRARY_CANVASJS:
								series.seriesDest = 'dataPoints';
								
								chart.options.data.push(series.series);
								break;
							
							case LIBRARY_PLOTLY:
								series.seriesDest = 'y';
								series.series.id = data[seriesIdFacet]+'-'+iGraphType;
								series.series.name = seriesName;
								series.series.marker = {
									color: seriesColor,
								};
								
								chart.data.push(series.series);
								break;
						}
						
						if(iGraphType === 0) {
							// Saving for later linkage
							firstSeries = series;
						} else {
							// Main series linkage
							series.linkedTo = firstSeries;
						}
						if(term_type!==undefined) {
							series.term_type = term_type;
						}
						series.series[series.seriesDest] = [];
						chart.allData.push(series);
						seriesValuesList.push(seriesValues);
					});
					
					chart.bpSideData.seriesToIndex[data[seriesIdFacet]] = seriesValuesList;
				}
				// merging the array
				Array.prototype.push.apply(seriesValuesArray,seriesValuesList);
			};
			
			dataArrays.forEach(function(dataArray,iDataArray) {
				var origin = origins[iDataArray];
				var maxI = dataArray.length;
				if(origin < maxI) {
					for(var i=origin; i<maxI ; i++) {
						var data = dataArray[i];
						if(data.meanCellTypeSeriesId in localScope.SeriesToChart) {
							var chartIds = localScope.SeriesToChart[data.meanCellTypeSeriesId];
							
							// We do this for every chart where the series appears
							for(var iChart=0;iChart<chartIds.length;iChart++) {
								var chartId = chartIds[iChart];
								if(chartId in chartMaps) {
									var graphViews = chartMaps[chartId];
									
									graphViews.forEach(function(chart) {
										var seriesValuesArray = [];
										// Mean series
										if(meanSeriesIdFacet!==undefined) {
											addToSeriesValuesArray(seriesValuesArray,chart,data,meanSeriesIdFacet,true);
										}
										
										// Series
										addToSeriesValuesArray(seriesValuesArray,chart,data,seriesIdFacet);
										
										// Add to all of them
										seriesValuesArray.forEach(function(seriesValues) {
											// We need the metadata data for this data (data.sDataS)
											seriesValues.push(data);
										});
									});
								}
							}
						}
					}
					
					// Setting the new origin
					setIOrigin(rangeData,view,maxI,iDataArray);
				}
			});
		}
		
		return retval;
	}
	

	function doProcessSeries(localScope,chartOptions) {
		localScope.$broadcast('highchartsng.processSeries',chartOptions);
	}
	
	
	// This is almost identical to redrawGeneralCharts, but generalized
	function abstractRedrawCharts(charts /* optional */,doGenerate,stillLoading,viewClass,localScope) {
		var filterFunc;
		if('ui' in charts) {
			var rangeData = charts;
			
			// We have to call here this method, to be sure
			// we have fulfilled all the preconditions
			var newData = abstractProcessChartData(rangeData,viewClass);
			if(newData) {
				doGenerate = true;
			}
			
			if(viewClass===undefined) {
				viewClass = rangeData.viewClass;
			}
			charts = getCharts(rangeData,viewClass);
			if(RedrawSelector[viewClass].canFilter && rangeData.filterFunc) {
				filterFunc = rangeData.filterFunc;
			}
		} else if(!Array.isArray(charts)) {
			charts = [ charts ];
		}
		
		var timeoutFunc = function(charts,iChart) {
			if(iChart<charts.length) {
				var chart = charts[iChart];
				if(chart.isHidden && !chart.isLoading) {
					timeoutFunc(charts,iChart+1);
				} else {
					// Visual indicator, with different semantics of chart.isLoading
					chart.options.loading = true;
					var theFunc = function() {
						try {
							chart.seriesAggregator(doGenerate,stillLoading,filterFunc);
							chart.options.loading = stillLoading;
							doProcessSeries(localScope,chart.options);
						} catch(e) {
							console.log(e);
						}
						//chart.pendingRedraws = false;
						timeoutFunc(charts,iChart+1);
					};
					if(localScope!==undefined) {
						localScope.$applyAsync(theFunc);
					} else {
						setTimeout(theFunc,10);
					}
				}
			//} else if(localScope!==undefined) {
			//	// Revalidating the scope
			//	localScope.$applyAsync();
			}
		};
		timeoutFunc(charts,0);
	}
	
	function redrawCharts(charts,doGenerate,stillLoading,viewClass,localScope) {
		if('ui' in charts) {
			var rangeData = charts;
			
			viewClass = rangeData.viewClass;
			localScope = rangeData.localScope;
		}
		if(viewClass===undefined) {
			viewClass = VIEW_GENERAL;
		}
		if(viewClass in RedrawSelector) {
			// Normalizing doGenerate and stillLoading
			abstractRedrawCharts(charts,!!doGenerate,!!stillLoading,viewClass,localScope);
		}
	}
	
	function doChangeView(rangeData) {
		var chartsView = getChartsView(rangeData);
		
		if(!chartsView.firstView) {
			chartsView.firstView = true;
			redrawCharts(rangeData);
		}
	}
	
	function selectGeneral(rangeData,viewClass/*,dumbData*/) {
		var chartsView = getChartsView(rangeData,viewClass);
		chartsView.termNodes = rangeData.termNodes;
		chartsView.termNodesHash = rangeData.termNodesHash;
		
		return undefined;
	}
	
	function selectCellTypesForDiseases(rangeData,viewClass,celltypesSelected) {
		if(viewClass===undefined) {
			viewClass = VIEW_DISEASES;
		}
		
		var chartsView = getChartsView(rangeData,viewClass);
		
		if(celltypesSelected === undefined) {
			celltypesSelected = rangeData.ui.celltypesSelected;
		}
		
		var combinedName;
		if(celltypesSelected.length > 1) {
			var combinedTermNodes = [];
			var combinedTermNodesHash = {};
			celltypesSelected.forEach(function(celltypeSelected) {
				if(celltypeSelected.termNodes.length > 0) {
					if(combinedTermNodes.length===0) {
						Array.prototype.push.apply(combinedTermNodes,celltypeSelected.termNodes);
						angular.extend(combinedTermNodesHash,celltypeSelected.termNodesHash);
					} else {
						celltypeSelected.termNodes.forEach(function(termNode) {
							if(!(termNode.o_uri in combinedTermNodesHash)) {
								combinedTermNodes.push(termNode);
								combinedTermNodesHash[termNode.o_uri] = termNode;
							}
						});
					}
				}
			});
			chartsView.termNodes = combinedTermNodes;
			chartsView.termNodesHash = combinedTermNodesHash;
			combinedName = celltypesSelected.length + ' aggregated cell types';
		} else if(celltypesSelected.length === 1) {
			chartsView.termNodes = celltypesSelected[0].termNodes;
			chartsView.termNodesHash = celltypesSelected[0].termNodesHash;
			combinedName = celltypesSelected[0].name;
		} else {
			chartsView.termNodes = [];
			chartsView.termNodesHash = {};
			combinedName = '(empty)';
		}
		
		// Fixing redrawing issue
		celltypesSelected.forEach(function(celltypeSelected) {
			rangeData.processedData.byCellType[celltypeSelected.o_uri] = 0;
		});
		
		return combinedName;
	}
	
	function selectTissueForCellTypes(rangeData,viewClass,tissueSelected) {
		if(viewClass===undefined) {
			viewClass = VIEW_BY_TISSUE;
		}
		
		var chartsView = getChartsView(rangeData,viewClass);
		
		if(tissueSelected===undefined) {
			tissueSelected = rangeData.ui.tissueSelected;
		}
		
		chartsView.termNodes = tissueSelected.termNodes;
		chartsView.termNodesHash = tissueSelected.termNodesHash;
		// Fixing redrawing issue
		rangeData.processedData.byTissue[tissueSelected.o_uri] = 0;
		
		return tissueSelected.name;
	}
	
	// Filling the exported view array
	EXPORTED_VIEWS = [
		{
			viewClass: VIEW_GENERAL,
			viewDesc: 'General Charts',
			seriesNodesFacet: 'termNodes',
			seriesNodesHashFacet: 'termNodesHash',
			selectGroupMethod: selectGeneral,
			legendTitle: 'Cell Types',
			chartMapsFacet: 'general',
			canFilter: true,
		},
		{
			viewClass: VIEW_BY_TISSUE,
			viewDesc: 'By tissue Charts',
			seriesNodesFacet: 'tissueTermNodes',
			seriesNodesHashFacet: 'tissueTermNodesHash',
			groupBySeriesNodesFacet: 'tissueNodes',
			selectGroupMethod: selectTissueForCellTypes,
			legendTitle: 'Cell Types',
			chartMapsFacet: 'byTissue',
			canFilter: true,
		},
		{
			viewClass: VIEW_DISEASES,
			viewDesc: 'Diseases by cellular type Charts',
			seriesNodesFacet: 'cellTypeTermNodes',
			seriesNodesHashFacet: 'cellTypeTermNodesHash',
			groupBySeriesNodesFacet: 'termNodes',
			selectGroupMethod: selectCellTypesForDiseases,
			legendTitle: 'Diseases',
			chartMapsFacet: 'celltypeDisease',
			canFilter: false,
		},
	];
	
	// Filling the redraw selector
	RedrawSelector = {};
	EXPORTED_VIEWS.forEach(function(view) {
		RedrawSelector[view.viewClass] = view;
	});
	
	
	function switchSeriesNode(event,theSeriesNode,rangeData,viewClass) {
		var seriesNodes = getSeriesNodes(rangeData,viewClass);
		if(event.ctrlKey) {
			seriesNodes.forEach(function(seriesNode) {
				seriesNode.termHidden = true;
			});
			theSeriesNode.termHidden = false;
		} else {
			theSeriesNode.termHidden = !theSeriesNode.termHidden;
		}
		
		// We are not going to redraw in background (this should not happen)
		if(viewClass===undefined || viewClass === rangeData.viewClass) {
			redrawCharts(rangeData);
		}
	}
	
	function switchMeanSeries(chart,doRedraw,localScope) {
		chart.meanSeriesHidden = !chart.meanSeriesHidden;
		
		if(doRedraw) {
			redrawCharts(chart,undefined,undefined,undefined,localScope);
		}
	}
	
	function switchChart(event,chart,rangeData,viewClass) {
		var charts = getCharts(rangeData,viewClass);
		if(event.ctrlKey) {
			charts.forEach(function(chart) {
				chart.isHidden = true;
			});
			chart.isHidden = false;
			redrawCharts(chart,undefined,undefined,undefined,rangeData.localScope);
		} else if(event.shiftKey) {
			// We are not going to redraw in background (this should not happen)
			switchMeanSeries(chart,viewClass===undefined || viewClass === rangeData.viewClass,rangeData.localScope);
		} else if(chart.isHidden) {
			chart.isHidden = false;
			redrawCharts(chart,undefined,undefined,undefined,rangeData.localScope);
		} else {
			chart.isHidden = true;
		}
	}
	
	function showAllCharts(event,rangeData,viewClass) {
		var charts = getCharts(rangeData,viewClass);
		if(event.shiftKey) {
			charts.forEach(function(chart) {
				chart.meanSeriesHidden = false;
			});
			
			// We are not going to redraw in background (this should not happen)
			if(viewClass===undefined || viewClass === rangeData.viewClass) {
				redrawCharts(rangeData);
			}
		} else {
			charts.forEach(function(chart) {
				chart.isHidden = false;
			});
			redrawCharts(rangeData);
		}
	}

	function hideAllCharts(event,rangeData,viewClass) {
		var charts = getCharts(rangeData,viewClass);
		if(event.shiftKey) {
			charts.forEach(function(chart) {
				chart.meanSeriesHidden = true;
			});
			
			// We are not going to redraw in background (this should not happen)
			if(viewClass===undefined || viewClass === rangeData.viewClass) {
				redrawCharts(rangeData);
			}
		} else {
			charts.forEach(function(chart) {
				chart.isHidden = true;
			});
		}
	}
	
	function showAllSeries(rangeData,viewClass) {
		var seriesNodes = getSeriesNodes(rangeData,viewClass);
		seriesNodes.forEach(function(seriesNode) {
			seriesNode.termHidden = false;
		});
		
		redrawCharts(rangeData);
	}

	function hideAllSeries(rangeData,viewClass) {
		var seriesNodes = getSeriesNodes(rangeData,viewClass);
		seriesNodes.forEach(function(seriesNode) {
			seriesNode.termHidden = true;
		});
		
		redrawCharts(rangeData);
	}
	
	function doReflow(localScope) {
		localScope.$broadcast('highchartsng.reflow');
	}
	
	function getSeenSeriesCount(rangeData,viewClass) {
		var count = 0;
		
		var seriesNodes = getSeriesNodes(rangeData,viewClass);
		seriesNodes.forEach(function(seriesNode) {
			if(seriesNode.wasSeen) {
				count++;
			}
		});
		
		return count;
	}
	
	function getVisibleSeriesCount(rangeData,viewClass) {
		var count = 0;
		
		var seriesNodes = getSeriesNodes(rangeData,viewClass);
		seriesNodes.forEach(function(seriesNode) {
			if(seriesNode.wasSeen && !seriesNode.termHidden) {
				count++;
			}
		});
		
		return count;
	}
	
	function getChartsWithDataCount(rangeData,viewClass) {
		var count = 0;
		
		var charts = getCharts(rangeData,viewClass);
		charts.forEach(function(chart) {
			if(!chart.isEmpty) {
				count++;
			}
		});
		
		return count;
	}
	
	function getVisibleChartsCount(rangeData,viewClass) {
		var count = 0;
		
		var charts = getCharts(rangeData,viewClass);
		charts.forEach(function(chart) {
			if(!chart.isEmpty && !chart.isHidden) {
				count++;
			}
		});
		
		return count;
	}
	
	
	function assignMeanSeriesColorMap(localScope) {
		// And now, the colors for the AVG_SERIES
		var avgSeriesRGBColors = Palette.getNextColors(localScope.AVG_SERIES.length);
		var AVG_SERIES_COLORS = {};
		localScope.AVG_SERIES.forEach(function(meanSeriesDesc, i) {
			meanSeriesDesc.color = avgSeriesRGBColors[i];
			AVG_SERIES_COLORS[meanSeriesDesc.seriesId] = meanSeriesDesc;
		});
		
		localScope.AVG_SERIES_COLORS = AVG_SERIES_COLORS;
	}
	
	function assignTermsColorMap(termNodes) {
		// The colors for the diseases
		var termRGBColors = Palette.getNextColors(termNodes.length);
		termNodes.forEach(function(term, i) {
			term.color = termRGBColors[i];
		});
	}
	
	// To be deprecated
	function assignSeriesDataToChart(chart,data) {
		// Very important, so we are managing the same array
		switch(chart.library) {
			case LIBRARY_NVD3:
				chart.data = data;
				break;
			case LIBRARY_HIGHCHARTS:
				chart.options.series[0].data = data;
				break;
			case LIBRARY_PLOTLY:
				// TBI
				break;
		}
	}
	
	// To be deprecated
	function getChartSeriesData(chart) {
		var data;
		
		switch(chart.library) {
			case LIBRARY_NVD3:
				data = chart.data;
				break;
			case LIBRARY_HIGHCHARTS:
				data = chart.options.series[0].data;
				break;
			case LIBRARY_PLOTLY:
				// TBI
				break;
		}
		
		return data;
	}
	
	function initializeAvgSeries(localScope,histones) {
		// Now, map the histones and generate the labels
		localScope.experimentLabels = angular.copy(experimentLabels);
		var iHis = localScope.experimentLabels.length;
		
		// Fixed part is replicated here
		localScope.AVG_SERIES = angular.copy(AVG_SERIES);
		
		histones.forEach(function(histone) {
			histone.histoneIndex = iHis;
			
			// These are for the tree
			// It uses two slots
			localScope.experimentLabels.push({
				label: histone.histoneName+' (broad peaks)',
				conceptType: ConstantsService.LAB_CS_CONCEPT,
				experiment_type: histone.histoneName,
				feature: 'broad'
			});
			localScope.experimentLabels.push({
				label: histone.histoneName+' (peaks)',
				conceptType: ConstantsService.LAB_CS_CONCEPT,
				experiment_type: histone.histoneName,
				feature: 'notBroad'
			});
			iHis+=2;
			
			// These are for the charts
			// And variable part, which depends on the histones
			AVG_CS_SERIES.forEach(function(seriesDataOrig) {
				var seriesData = angular.copy(seriesDataOrig);
				seriesData.seriesId += ' ' + histone.histoneName;
				seriesData.name += ' (' + histone.histoneName + ')';
				seriesData.chartId += ' ' + histone.histoneName;
				
				localScope.AVG_SERIES.push(seriesData);
			});
		});
		
		// Saving the correspondences
		var SeriesToChart = {};
		localScope.AVG_SERIES.forEach(function(avgSeries) {
			SeriesToChart[avgSeries.seriesId] = Array.isArray(avgSeries.chartId) ? avgSeries.chartId : [ avgSeries.chartId ];
		});
		localScope.SeriesToChart = SeriesToChart;
	}
	
	function linkMeanSeriesToAnalysis(analysis,experiment) {
		var meanSeries;
		switch(analysis._type) {
			case ConstantsService.PDNA_CONCEPT_M:
				var isNarrow = analysis.analysis_id.indexOf('_broad_')===-1;
				if(isNarrow) {
					meanSeries = PDNA_NARROW_SERIES;
				} else {
					meanSeries = PDNA_BROAD_SERIES;
				}
				// Separate meanSeries for each histone
				if(experiment.histone !== undefined) {
					meanSeries += ' ' + experiment.histone.histoneName;
				}
				break;
			case ConstantsService.EXP_CONCEPT_M:
				meanSeries = EXP_ANY_SERIES;	// It is truly resolved later to EXPG_SERIES or EXPT_SERIES
				break;
			case ConstantsService.DLAT_CONCEPT_M:
				switch(analysis.mr_type) {
					case 'hyper':
						meanSeries = DLAT_HYPER_SERIES;
						break;
					case 'hypo':
						meanSeries = DLAT_HYPO_SERIES;
						break;
				}
				break;
			case ConstantsService.RREG_CONCEPT_M:
				meanSeries = RREG_SERIES;
				break;
		}
		//if(!meanSeries) {
		//	console.log("BUG "+analysis.analysis_id+' ('+analysis._type+')');
		//}
		analysis.meanSeries = meanSeries;
	}
	
	function initializeSubtotalsCharts($scope) {
		var subtotalsChartTemplate = {
			library: LIBRARY_HIGHCHARTS,
			options: {
				options: {
					chart: {
						
						backgroundColor: null,
						style: {
							fontSize: '1em',
						},
						animation: false,
					},
					legend: {
						enabled: true,
						itemStyle: {
							fontSize: '0.8em',
							fontWeight: 'normal',
						},
					},
					tooltip: {
						animation: false,
						style: {
							fontSize: '0.8em',
						},
					},
					plotOptions: {
						series: {
							animation: false,
						},
						pie: {
							dataLabels: {
								enabled: true,
								format: '{y}',
								distance: -20,
								style: {
									fontWeight: 'normal',
									color: 'white',
									textShadow: '0px 1px 2px black'
								}
							},
							showInLegend: true,
							//startAngle: -90,
							//endAngle: 90,
							//center: ['50%', '75%']
							//center: ['50%', '50%']
						}
					},
					exporting: HighchartsCommonExportingOptions,
				},
				title: {
					//text: 'Donors & Samples',
					align: 'center',
					//verticalAlign: 'top',
					style: {
						fontSize: '1.2em',
					},
					//y: 40
				},
				series: [
					{
						id: 'subtotals',
						type: 'pie',
						name: 'Stats',
						innerSize: '50%',
						data: [
							['Loading', 1]
						]
					}
				]
			}
		};
		
		var subtotals = angular.copy(subtotalsChartTemplate);
		subtotals.options.title.text = 'Donor types';
		subtotals.options.options.tooltip.pointFormat = '<span style="color:{point.color}">\u25CF</span> {point.y}';
		
		$scope.subtotals = subtotals;
		
		var analysisSubtotals = angular.copy(subtotalsChartTemplate);
		analysisSubtotals.options.title.text = 'Stored Analysis Products';
		analysisSubtotals.options.options.tooltip.headerFormat = '';
		analysisSubtotals.options.options.tooltip.pointFormat = '{point.desc}<br /><span style="color:{point.color}">\u25CF</span> {point.y}';
		
		$scope.analysisSubtotals = analysisSubtotals;
	}
	
	function storeRange(localScope,range) {
		// Preparing the charts!
		var termNodes = angular.copy(localScope.termNodes);
		var termNodesHash = {};
		termNodes.forEach(function(termNode) {
			termNode.termNodes = [];
			termNode.termNodesHash = {};
			termNodesHash[termNode.o_uri] = termNode;
		});
		
		var diseaseNodes = angular.copy(localScope.diseaseNodes);
		var diseaseNodesHash = {};
		// This one is used later
		var diseaseNodesHashAlt = {};
		diseaseNodes.forEach(function(diseaseNode) {
			diseaseNodesHash[diseaseNode.o_uri] = diseaseNode;
			diseaseNodesHashAlt[diseaseNode.o] = diseaseNode;
		});
		
		var tissueNodes = angular.copy(localScope.tissueNodes);
		var tissueNodesHash = {};
		tissueNodes.forEach(function(tissueNode) {
			tissueNode.termNodes = [];
			tissueNode.termNodesHash = {};
			tissueNodesHash[tissueNode.o_uri] = tissueNode;
		});
		
		var chartViews = {};
		EXPORTED_VIEWS.forEach(function(view) {
			chartViews[view.viewClass] = {
				termNodes: [],
				termNodesHash: {},
				charts: [],
				firstView: false,
			};
		});
		
		var rangeData = {
			localScope: localScope,
			state: ConstantsService.STATE_INITIAL,
			fetchState: ConstantsService.FETCH_STATE_INITIAL,
			// These two values are arbitrary
			numFetchEntries: 0,
			numFetchTotal: 100,
			fetching: false,
			heading: (range.label !== undefined) ? range.label : ('Region ' + range.chr + ':' + range.start + '-' + range.end),
			id: (range.feature_id !== undefined) ? range.feature_id : (range.chr + ':' + range.start + '-' + range.end),
			range: range,
			treedata: null,
			termNodes: termNodes,
			termNodesHash: termNodesHash,
			diseaseNodes: diseaseNodes,
			diseaseNodesHash: diseaseNodesHash,
			tissueNodes: tissueNodes,
			tissueNodesHash: tissueNodesHash,
			chartMaps: {},
			stats: {},
			fetchedData: {
				byCellType: {
					hash: {},
					orderedKeys: [],
				},
				byTissue: {
					hash: {},
					orderedKeys: [],
				},
				all: [],
			},
			processedData: {
				byCellType: {},
				byTissue: {},
				all: 0,
			},
			ui: {
				gChro: (range.chr in ChromosomesHash) ? ChromosomesHash[range.chr] : UnknownChromosome,
				treeDisplay: 'compact',
				treeDisplayState: ConstantsService.TREE_STATE_INITIAL,
				diseaseSelected: null,
				celltypesSelected: [],
				tissueSelected: tissueNodes[0],
				chartViews: chartViews,
			},
			// Initially, the default view
			viewClass: EXPORTED_VIEWS[0].viewClass,
		};
		
		// This is going to be used in several places
		var trimmedId = rangeData.id;
		var rPointId = trimmedId.lastIndexOf('.');
		if(rPointId !== -1) {
			trimmedId = trimmedId.substring(0,rPointId);
		}
		
		rangeData.trimmedId = trimmedId;
		
		// Only not taking into account flanking window size for explicit ranges
		if(range.currentQuery.flankingWindowSize !== undefined) {
			rangeData.flankingWindowSize = range.currentQuery.flankingWindowSize;
		}
		
		// Now, rescueing hints
		if(localScope.currentQueryHints !== null && localScope.currentQueryHints !== undefined && localScope.currentQueryHints.tabs!==undefined && Array.isArray(localScope.currentQueryHints.tabs)) {
			localScope.currentQueryHints.tabs.some(function(tab) {
				var retval = tab.id === rangeData.id || tab.id === rangeData.trimmedId;
				if(retval) {
					rangeData.viewHints = tab;
					
					// Curating some parameters
					if(tab.visibleCharts !== undefined && !Array.isArray(tab.visibleCharts)) {
						tab.visibleCharts = [tab.visibleCharts];
					}
					
					if(tab.visibleTerms !== undefined && !Array.isArray(tab.visibleTerms)) {
						tab.visibleTerms = [tab.visibleTerms];
					}
					
					if(tab.visibleMeanSeries !== undefined && !Array.isArray(tab.visibleMeanSeries)) {
						tab.visibleMeanSeries = [tab.visibleMeanSeries];
					}
					
					// Setting default viewClass
					if(tab.selectedView!==undefined && (tab.selectedView in RedrawSelector)) {
						rangeData.viewClass = tab.selectedView;
					}
					
					// Setting default filtered disease
					if(tab.filteredDisease !== undefined && (tab.filteredDisease in diseaseNodesHashAlt)) {
						rangeData.ui.diseaseSelected = diseaseNodesHashAlt[tab.filteredDisease];
					}
				}
				return retval;
			});
		}
		
		// Initial view must be labelled as firstView!
		getChartsView(rangeData).firstView = true;
		
		if(localScope.currentQueryHints !== null && localScope.currentQueryHints !== undefined && (rangeData.id === localScope.currentQueryHints.selectedTab || rangeData.trimmedId === localScope.currentQueryHints.selectedTab)) {
			localScope.currentTabId = localScope.graphData.length;
		}
		
		localScope.graphData.push(rangeData);
	}
	
	function selectGroup(rangeData,viewClass,selectedGroup) {
		if(viewClass===undefined) {
			viewClass = rangeData.viewClass;
		} else if(viewClass!==rangeData.viewClass) {
			// Translate it into a noop, as it is not the visible view
			return;
		}
		
		if('selectGroupMethod' in RedrawSelector[viewClass]) {
			doViewChartLayout(rangeData,RedrawSelector[viewClass],selectedGroup);
		}
		redrawCharts(rangeData,undefined,undefined,viewClass);
	}
	
	function recordAnalysisOnCellType(rangeData,analysis_id,entries_count) {
		if(analysis_id in rangeData.localScope.analysesHash) {
			var analysis = rangeData.localScope.analysesHash[analysis_id];
			var cellTypeId = analysis.cell_type.o_uri;
			if(cellTypeId in rangeData.termNodesHash) {
				var term = rangeData.termNodesHash[cellTypeId];
				term.wasSeen = true;
				term.analysisInRange.push(analysis);
				term.numDataEntries += entries_count;
				
				var meanCellTypeSeriesId = analysis.meanSeries;
				switch(meanCellTypeSeriesId) {
					case EXP_ANY_SERIES:
						meanCellTypeSeriesId = [ EXPG_SERIES, EXPT_SERIES ];
						break;
					default:
						meanCellTypeSeriesId = [ meanCellTypeSeriesId ];
				}
				meanCellTypeSeriesId.forEach(function(ser) {
					if(ser in rangeData.localScope.AVG_SERIES_COLORS) {
						var chartIds = rangeData.localScope.AVG_SERIES_COLORS[ser].chartId;
						if(Array.isArray(chartIds)) {
							chartIds.forEach(function(chartId) {
								term.analysisTypes[chartId] = null;
							});
						} else {
							term.analysisTypes[chartIds] = null;
						}
					}
				});
			}
		}
	}
	
	function storeFetchedData(rangeData,range_start,range_end,results) {
		var localScope = rangeData.localScope;
		results.forEach(function(segment) {
			var analysis_id = segment.analysis_id;
			// We are storing only what we can process / understand
			if(analysis_id in localScope.analysesHash) {
				var analysis = localScope.analysesHash[analysis_id];
				var meanCellTypeSeriesId = analysis.meanSeries;
				
				var diseaseSeriesId = analysis.lab_experiment.sample.specimen.donor_disease;
				// This is really only needed by series shared by several charts
				var cellTypeSeriesId = analysis.cell_type.o_uri+'_'+meanCellTypeSeriesId;
				
				var value;
				var payload;
				switch(meanCellTypeSeriesId) {
					case EXP_ANY_SERIES:
						switch(segment._type) {
							case ConstantsService.EXPG_CONCEPT:
								value = segment.FPKM;
								meanCellTypeSeriesId = EXPG_SERIES;
								payload = segment.gene_stable_id;
								break;
							case ConstantsService.EXPT_CONCEPT:
								value = segment.FPKM;
								meanCellTypeSeriesId = EXPT_SERIES;
								payload = segment.transcript_stable_id;
								break;
						}
						break;
					case DLAT_HYPER_SERIES:
						value = segment.meth_level;
						break;
					case DLAT_HYPO_SERIES:
						value = segment.meth_level;
						break;
					case RREG_SERIES:
						value = segment.z_score;
						break;
					default:
						if(meanCellTypeSeriesId.indexOf(PDNA_NARROW_SERIES)===0) {
							value = segment.log10_qvalue;
						} else if(meanCellTypeSeriesId.indexOf(PDNA_BROAD_SERIES)===0) {
							value = segment.log10_qvalue;
						}
						break;
				}
				
				// Clipping to the viewed region
				var chromosome_start = segment.chromosome_start;
				var chromosome_end = segment.chromosome_end;
				
				if(chromosome_start < range_start) {
					chromosome_start = range_start;
				}
				if(chromosome_end > range_end) {
					chromosome_end = range_end;
				}
				
				var sDataS = [chromosome_start,chromosome_end,value,payload,analysis_id];
				var data = {
					cellTypeSeriesId: cellTypeSeriesId,
					meanCellTypeSeriesId: meanCellTypeSeriesId,
					diseaseSeriesId: diseaseSeriesId,
					analysis: analysis,
					chromosome_start: segment.chromosome_start,
					chromosome_end: segment.chromosome_end,
					sDataS: sDataS
				};
				
				
				// By default, store all
				rangeData.fetchedData.all.push(data);
				
				// Signaling diseases
				var diseaseUri = analysis.lab_experiment.sample.specimen.donor_disease;
				var disease = rangeData.diseaseNodesHash[diseaseUri];
				disease.wasSeen = true;
				
				// By cell type
				var cellDataArray;
				var cellTypeUri = analysis.cell_type.o_uri;
				// Labelling what we have seen
				// We need this shared reference
				var cell_type = rangeData.termNodesHash[cellTypeUri];
				// and signal this cell_type
				cell_type.wasSeen = true;
				if(cellTypeUri in rangeData.fetchedData.byCellType.hash) {
					cellDataArray = rangeData.fetchedData.byCellType.hash[cellTypeUri];
				} else {
					cellDataArray = [];
					rangeData.fetchedData.byCellType.hash[cellTypeUri] = cellDataArray;
					rangeData.fetchedData.byCellType.orderedKeys.push(cellTypeUri);
					rangeData.processedData.byCellType[cellTypeUri] = 0;
				}
				// and signal this disease on the cell_type
				if(!(diseaseUri in cell_type.termNodesHash)) {
					cell_type.termNodes.push(disease);
					cell_type.termNodesHash[diseaseUri] = disease;
				}
				cellDataArray.push(data);
				
				// By tissue
				var tissueDataArray;
				var tissueUri = analysis.lab_experiment.sample.specimen.specimen_term;
				// Labelling what we have seen
				// We need this shared reference
				var tissue = rangeData.tissueNodesHash[tissueUri];
				// and signal this tissue
				tissue.wasSeen = true;
				if(tissueUri in rangeData.fetchedData.byTissue.hash) {
					tissueDataArray = rangeData.fetchedData.byTissue.hash[tissueUri];
				} else {
					tissueDataArray = [];
					rangeData.fetchedData.byTissue.hash[tissueUri] = tissueDataArray;
					rangeData.fetchedData.byTissue.orderedKeys.push(tissueUri);
					rangeData.processedData.byTissue[tissueUri] = 0;
				}
				// and signal this cell_type on the tissue
				if(!(cellTypeUri in tissue.termNodesHash)) {
					tissue.termNodes.push(cell_type);
					tissue.termNodesHash[cellTypeUri] = cell_type;
				}
				tissueDataArray.push(data);
			}
		});
	}
		
	function selectableCellTypesFromHints(rangeData) {
		return (rangeData.viewHints !==  undefined && (rangeData.viewHints.initiallyShowMeanSeries !== undefined || rangeData.viewHints.visibleTerms !== undefined));
	}
	
	function selectVisibleCellTypes(rangeData) {
		var numSelected = 0;
		
		var availableChartIds = [];
		var availableChartIdsHash = {};
		var initialDiseaseByCellTypes = [];
		
		var charts = getCharts(rangeData,VIEW_GENERAL);
		console.log('Charto',charts);
		var enableTermNodeFunc = function(termNode) {
			if(termNode.wasSeen) {
				numSelected++;
				termNode.termHidden=false;
				initialDiseaseByCellTypes.push(termNode);
				for(var chartId in termNode.analysisTypes) {
					if(!(chartId in availableChartIdsHash)) {
						availableChartIds.push(chartId);
						availableChartIdsHash[chartId] = null;
					}
				}
			}
		};
		
		if(selectableCellTypesFromHints(rangeData)) {
			if(rangeData.viewHints.visibleTerms !== undefined) {
				// Preparing the selection, so terms can be found
				var visibleHash = {};
				
				rangeData.viewHints.visibleTerms.forEach(function(o) {
					visibleHash[o] = null;
				});
				
				rangeData.termNodes.forEach(function(termNode) {
					if(termNode.o in visibleHash) {
						enableTermNodeFunc(termNode);
					}
				});
			}
		} else {
			rangeData.treedata.forEach(function(ontology) {
				ontology.selectedNodes.forEach(enableTermNodeFunc);
			});
		}
		
		// Select all when no one was selected
		if(numSelected===0) {
			rangeData.termNodes.forEach(enableTermNodeFunc);
		}
		
		// Identify the enabled charts
		rangeData.ui.numSelectedCellTypes = numSelected;
		rangeData.ui.numChartsForSelectedCellTypes = availableChartIds.length;
		
		rangeData.ui.celltypesSelected = initialDiseaseByCellTypes;
		doViewChartLayout(rangeData,RedrawSelector[VIEW_DISEASES]);
		
		var chartsForSelectedCellTypes = [];
		rangeData.ui.chartsForSelectedCellTypes = chartsForSelectedCellTypes;
		
		charts.forEach(function(chart) {
			if(chart.chartId in availableChartIdsHash) {
				chartsForSelectedCellTypes.push(chart);
				//chart.isHidden = false;
			} else {
				// Already hiding it
				chart.isHidden = true;
			}
		});
	}
	
	function selectableChartsFromHints(rangeData) {
		return (rangeData.viewHints !==  undefined && rangeData.viewHints.initiallyShowMeanSeries !== undefined);
	}
	
	// This can be reused in the future for additional filters
	function invalidateFilteredSeries(rangeData) {
		// Invalidating in all the views
		EXPORTED_VIEWS.forEach(function(view) {
			if(view.canFilter) {
				var charts = getCharts(rangeData,view.viewClass);
				charts.forEach(function(chart) {
					chart.allData.forEach(function(series) {
						series.filteredSeriesValues = null;
					});
					// Resetting the title
					setChartSubtitle(chart,rangeData,view.viewClass);
				});
			}
		});
	}
	
	function filterByDisease(rangeData,diseaseTerm,/* optional */ skipRedraw) {
		// First the filtering callback setup
		if(diseaseTerm!==null && diseaseTerm!==undefined) {
			rangeData.filterFunc = function(data) {
				return diseaseTerm.o_uri === data.diseaseSeriesId;
			};
			rangeData.ui.filterDesc = "'"+diseaseTerm.name+"' disease";
		} else {
			rangeData.filterFunc = null;
			rangeData.ui.filterDesc = null;
		}
		
		if(!skipRedraw) {
			// Then, filtered values invalidation
			invalidateFilteredSeries(rangeData);
			
			// And at last, redrawing of the charts
			redrawCharts(rangeData);
		}
	}
	
	function selectVisibleCharts(rangeData) {
		// Normalizing
		var hasChartHints = selectableChartsFromHints(rangeData);
		var initiallyHideMeanSeries = !( hasChartHints ? rangeData.viewHints.initiallyShowMeanSeries : rangeData.ui.initiallyShowMeanSeries );
		
		var charts = getCharts(rangeData,VIEW_GENERAL);
		
		var visibleChartsHash;
		var visibleMeanSeriesHash;
		if(hasChartHints) {
			visibleChartsHash = {};
			
			if(Array.isArray(rangeData.viewHints.visibleCharts)) {
				rangeData.viewHints.visibleCharts.forEach(function(visibleChartId) {
					visibleChartsHash[visibleChartId] = null;
				});
			}
			
			visibleMeanSeriesHash = {};
			
			if(Array.isArray(rangeData.viewHints.visibleMeanSeries)) {
				rangeData.viewHints.visibleMeanSeries.forEach(function(visibleChartId) {
					visibleMeanSeriesHash[visibleChartId] = null;
				});
			}
			
			if(rangeData.viewHints.treeDisplay!==undefined) {
				rangeData.ui.treeDisplay = rangeData.viewHints.treeDisplay;
			}
		}
		
		charts.forEach(function(chart) {
			chart.meanSeriesHidden = initiallyHideMeanSeries;
			if(hasChartHints) {
				chart.isHidden = !(chart.chartId in visibleChartsHash);
				
				chart.meanSeriesHidden = !(chart.chartId in visibleMeanSeriesHash);
			}
		});
		
		// At last, setting up the filters
		if(rangeData.ui.diseaseSelected) {
			filterByDisease(rangeData,rangeData.ui.diseaseSelected,true);
		}
	}
	
	function buildCurrentState(localScope) {
		var state = {
			selectedTab: localScope.currentTab,
			tabs: localScope.graphData.map(function(rangeData) {
				var tabState = {
					id: rangeData.id,
				};
				
				// Visible terms
				if(rangeData.state === ConstantsService.STATE_SELECT_CHARTS || rangeData.state === ConstantsService.STATE_SHOW_DATA) {
					var visibleTerms = [];
					rangeData.termNodes.forEach(function(termNode) {
						if(termNode.wasSeen && !termNode.termHidden) {
							visibleTerms.push(termNode.o);
						}
					});
					
					tabState.visibleTerms = visibleTerms;
					
					// Visible charts
					if(rangeData.state === ConstantsService.STATE_SHOW_DATA) {
						tabState.selectedView = rangeData.viewClass;
						
						var visibleCharts = [];
						var visibleMeanSeries = [];
						
						getCharts(rangeData,VIEW_GENERAL).forEach(function(chart) {
							if(!chart.meanSeriesHidden) {
								visibleMeanSeries.push(chart.chartId);
							}
							if(!chart.isHidden) {
								visibleCharts.push(chart.chartId);
							}
						});
						
						tabState.initiallyShowMeanSeries = !!rangeData.ui.initiallyShowMeanSeries;
						tabState.visibleCharts = visibleCharts;
						tabState.visibleMeanSeries = visibleMeanSeries;
						tabState.treeDisplay = rangeData.ui.treeDisplay;
						
						// Saving the selected disease
						if(rangeData.ui.diseaseSelected !== undefined && rangeData.ui.diseaseSelected !== null) {
							tabState.filteredDisease = rangeData.ui.diseaseSelected.o;
						}
					}
				}
				
				return tabState;
			})
		};
		
		return state;
	}
	
	function switchAllTranscripts(chart,rangeData) {
		chart.showAllTranscripts = !chart.showAllTranscripts;
		chart.fDraw.showAllCategories(chart.showAllTranscripts);
		doProcessSeries(rangeData.localScope,chart.options);
	}
	
	function getChartSupportingData(rangeData,chart) {
		var table = [];
		chart.allData.forEach(function(series) {
			if(series.series.visible) {
				var arrayPrefix = [ series.series.name, rangeData.range.chr ];
				
				var seriesValues = (series.filteredSeriesValues!==null && series.filteredSeriesValues !== undefined) ? series.filteredSeriesValues : series.seriesValues;
				seriesValues.forEach(function(augData) {
					table.push(arrayPrefix.concat(augData.sDataS));
				});
			}
		});
		
		return table;
	}
	
	function mapColorsToTerms(localScope) {
		// Resetting on first usage
		Palette.resetHighColorMark();
		// Order DOES matter!!!
		assignTermsColorMap(localScope.termNodes);
		assignMeanSeriesColorMap(localScope);
		// Diseases
		assignTermsColorMap(localScope.diseaseNodes);
		// Tissues
		assignTermsColorMap(localScope.tissueNodes);
		
		return localScope;
	}
						
	return {
		doRegionFeatureLayout: doRegionFeatureLayout,
		recordAnalysisOnCellType: recordAnalysisOnCellType,
		storeFetchedData: storeFetchedData,
		assignSeriesDataToChart: assignSeriesDataToChart,
		getChartSeriesData: getChartSeriesData,
		initializeAvgSeries: initializeAvgSeries,
		initializeSubtotalsCharts: initializeSubtotalsCharts,
		linkMeanSeriesToAnalysis: linkMeanSeriesToAnalysis,
		chooseLabelFromSymbols: chooseLabelFromSymbols,
		storeRange: storeRange,
		
		getChartSupportingData: getChartSupportingData,
		
		mapColorsToTerms: mapColorsToTerms,
		
		uiFuncs: {
			redrawCharts: redrawCharts,
			doChangeView: doChangeView,
			doReflow: doReflow,
			
			EXPORTED_VIEWS: EXPORTED_VIEWS,
			VIEW_GENERAL: VIEW_GENERAL,
			
			getLegendTitle: getLegendTitle,
			switchLegend: switchLegend,
			isLegendEnabled: isLegendEnabled,
			getSeenSeriesCount: getSeenSeriesCount,
			getVisibleSeriesCount: getVisibleSeriesCount,
			getChartsWithDataCount: getChartsWithDataCount,
			getVisibleChartsCount: getVisibleChartsCount,
			
			switchSeriesNode: switchSeriesNode,
			switchChart: switchChart,
			switchMeanSeries: switchMeanSeries,
			showAllCharts: showAllCharts,
			hideAllCharts: hideAllCharts,
			showAllSeries: showAllSeries,
			hideAllSeries: hideAllSeries,
			getCharts: getCharts,
			getSeriesNodes: getSeriesNodes,
			getGroupBySeriesNodes: getGroupBySeriesNodes,
			selectGroup: selectGroup,
			
			selectVisibleCellTypes: selectVisibleCellTypes,
			selectVisibleCharts: selectVisibleCharts,
			DRAWABLE_REGION_FEATURES_V0: DRAWABLE_REGION_FEATURES_V0,
			
			buildCurrentState: buildCurrentState,
			selectableCellTypesFromHints: selectableCellTypesFromHints,
			selectableChartsFromHints: selectableChartsFromHints,
			
			switchAllTranscripts: switchAllTranscripts,
			
			filterByDisease: filterByDisease,
		},
	};
}]);
