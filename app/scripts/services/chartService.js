'use strict';

/*jshint camelcase: false , quotmark: false */

angular.
module('blueprintApp').
factory('ChartService',['$q','portalConfig','ConstantsService','ColorPalette','d3',function($q,portalConfig,ConstantsService,ColorPalette,d3) {
	
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
	
	var GRAPH_TYPE_STEP_NVD3 = 'step-'+LIBRARY_NVD3;
	var GRAPH_TYPE_STEP_CANVASJS = 'step-'+LIBRARY_CANVASJS;
	var GRAPH_TYPE_STEP_CHARTJS = 'step-'+LIBRARY_CHARTJS;
	var GRAPH_TYPE_BOXPLOT_HIGHCHARTS = 'boxplot-'+LIBRARY_HIGHCHARTS;
	var GRAPH_TYPE_STEP_HIGHCHARTS = 'step-'+LIBRARY_HIGHCHARTS;
	
	var GRAPHS = [
		{
			name: METHYL_GRAPH,
			noData: 'methylated regions',
			title: 'Methylated regions',
			ceiling: 1.0,
			floor: 0.0,
			yAxisLabel: 'Methylation level',
			type: GRAPH_TYPE_STEP_HIGHCHARTS,
		},
		{
			name: METHYL_HYPER_GRAPH,
			noData: 'hyper-methylated regions',
			title: 'Hyper-methylated regions',
			ceiling: 1.0,
			floor: 0.0,
			yAxisLabel: 'Methylation level',
			type: GRAPH_TYPE_STEP_HIGHCHARTS,
			isInitiallyHidden: true,
		},
		{
			name: METHYL_HYPO_GRAPH,
			noData: 'hypo-methylated regions',
			title: 'Hypo-methylated regions',
			ceiling: 1.0,
			floor: 0.0,
			yAxisLabel: 'Methylation level',
			type: GRAPH_TYPE_STEP_HIGHCHARTS,
			isInitiallyHidden: true,
		},
		{
			name: EXP_G_GRAPH,
			noData: 'gene expression data',
			title: 'Gene Expression',
			floor: 0.0,
			yAxisLabel: 'FPKM',
			type: GRAPH_TYPE_BOXPLOT_HIGHCHARTS,
		},
		{
			name: EXP_T_GRAPH,
			noData: 'transcript expression data',
			title: 'Transcript Expression',
			floor: 0.0,
			yAxisLabel: 'FPKM',
			type: GRAPH_TYPE_BOXPLOT_HIGHCHARTS,
		},
		{
			name: DNASE_GRAPH,
			noData: 'regulatory regions',
			title: 'Regulatory regions (DNAse)',
			yAxisLabel: 'z-score',
			type: GRAPH_TYPE_STEP_HIGHCHARTS,
		},
	];
	
	var HISTONE_GRAPHS = [
		{
			name: CSEQ_NARROW_GRAPH,
			noData: 'narrow histone peaks',
			title: 'Narrow Histone Peaks',
			floor: 0.0,
			yAxisLabel: '-Log10(q-value)',
			type: GRAPH_TYPE_STEP_HIGHCHARTS,
		},
		{
			name: CSEQ_BROAD_GRAPH,
			noData: 'broad histone peaks',
			title: 'Broad Histone Peaks',
			floor: 0.0,
			yAxisLabel: '-Log10(q-value)',
			type: GRAPH_TYPE_STEP_HIGHCHARTS,
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
			experiment_type: ConstantsService.EXPERIMENT_TYPE_DNA_METHYLATION,
			feature: 'bisulfiteSeqHash',
			doPercentFixup: true
		},
		{
			label: 'DNase-Seq (covered %)',
			experiment_type: ConstantsService.EXPERIMENT_TYPE_CHROMATIN_ACCESSIBILITY,
			feature: 'dnaseSeqHash',
			doPercentFixup: true
		},
		{
			label: 'Gene Exp (RNA-Seq)',
			experiment_type: ConstantsService.EXPERIMENT_TYPE_MRNA_SEQ,
			feature: 'rnaSeqGHash'
		},
		{
			label: 'Transcript Exp (RNA-Seq)',
			experiment_type: ConstantsService.EXPERIMENT_TYPE_MRNA_SEQ,
			feature: 'rnaSeqTHash'
		}
	];
	
	var REGION_FEATURE_GENE = 'gene';
	var REGION_FEATURE_TRANSCRIPT = 'transcript';
	var REGION_FEATURES = [REGION_FEATURE_GENE , REGION_FEATURE_TRANSCRIPT];
	var REGION_FEATURES_COLORS = {};
	REGION_FEATURES_COLORS[REGION_FEATURE_GENE] = '#ffffcc';
	REGION_FEATURES_COLORS[REGION_FEATURE_TRANSCRIPT] = 'orange';
	
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
	
	// Preparing the color range
	var Palette = ColorPalette.newInstance();
	
	function getXG(d) {
		return d.x;
	}
	
	function getYG(d) {
		return d.y;
	}
	
	function chooseLabelFromSymbols(symbols) {
		// Getting a understandable label
		var featureLabel;
		
		symbols.some(function(symbol) {
			if(symbol.indexOf('ENSG')!==0 && symbol.indexOf('ENST')!==0 && symbol.indexOf('HGNC:')!==0) {
				featureLabel = symbol;
				return true;
			}
			return false;
		});
		
		// Default case for the label
		return (featureLabel!==undefined) ? featureLabel : symbols[0];
	}
	
	function genBoxPlotSeries(origValues) {
		// First, process data
		var samps = {};
		var sampsPos = [];
		
		origValues.forEach(function(data) {
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
			var outliers = [];
			if(lastPos>1) {
				samp.series.sort(function(a,b) { return a-b; });
				
				var Q2pos = (lastPos >> 1);
				var lastQ1pos = Q2pos;
				var firstQ3pos = Q2pos;
				if((lastPos & 1)===0) {	// fast remainder by 2
					Q2 = samp.series[Q2pos];
				} else {
					Q2 = (samp.series[Q2pos] + samp.series[Q2pos+1]) / 2.0;
					
					// Calibrating it for next step
					firstQ3pos++;
				}
				
				var Q1pos = lastQ1pos>>1;
				var Q3pos = firstQ3pos + Q1pos;
				if((lastQ1pos & 1)===0) {	// fast remainder by 2
					Q1 = samp.series[Q1pos];
					Q3 = samp.series[Q3pos];
				} else if((lastPos & 3)===0) {	// fast remainder by 4
					Q1 = (samp.series[Q1pos] + 3.0*samp.series[Q1pos+1]) / 4.0;
					Q3 = (3.0*samp.series[Q3pos] + samp.series[Q3pos+1]) / 4.0;
				} else {
					Q1 = (3.0*samp.series[Q1pos] + samp.series[Q1pos+1]) / 4.0;
					Q3 = (samp.series[Q3pos] + 3.0*samp.series[Q3pos+1]) / 4.0;
				}
				
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
				samp.series.forEach(function(d) {
					if(d<Wl || d>Wh) {
						outliers.push(d);
					}
				});
			} else if(lastPos===1) {
				Q1 = samp.series[0];
				Q3 = samp.series[1];
				Q2 = (Q1+Q3) / 2.0;
				if(Q1>Q3) {
					var Qtmp = Q3;
					Q3 = Q1;
					Q1 = Qtmp;
				}
				Wl = Q1;
				Wh = Q3;
			} else {
				Wl = Wh = Q1 = Q2 = Q3 = samp.series[0];
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
			return {label:samp.label, start:samp.start, data:[Wl,Q1,Q2,Q3,Wh]};
		});
		
		//console.log("Orig values");
		//console.log(origValues);
		//console.log("Boxplots data");
		//console.log(boxplots);
		return boxplots;
	}
	
	function highchartsBoxPlotAggregator(chart,doGenerate,stillLoading) {
		if(doGenerate || !chart.boxPlotCategories) {
			var allEnsIds = [];
			var allEnsIdsHash = {};
			chart.allData.forEach(function(series) {
				if(doGenerate || !series.seriesPreDigestedValues) {
					series.seriesPreDigestedValues = series.seriesGenerator(series.seriesValues);
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
					label = chart.regionFeature[label].label + ' ('+label+')';
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
		chart.allData.forEach(function(series,iSeries) {
			// isEmpty detector
			if(series.seriesValues.length > 0) {
				isEmpty = false;
			}
			
			var reDigest = !stillLoading || !('term_type' in series);
			if(reDigest && (doGenerate || !series.seriesDigestedValues)) {
				var preparedValues = new Array(chart.options.xAxis.categories.length);
				
				series.seriesPreDigestedValues.forEach(function(boxplot) {
					preparedValues[chart.boxPlotCategories[boxplot.label].x] = boxplot.data;
				});
				series.seriesDigestedValues = preparedValues;
				chart.options.series[iSeries].data = series.seriesDigestedValues;
			}
			//console.log("DEBUG "+g.name);
			//console.log(series.seriesValues);
			//series.seriesValues = undefined;
			var visibilityState;
			if('term_type' in series) {
				visibilityState = !stillLoading && !series.term_type.termHidden;
			} else {
				visibilityState = stillLoading || !chart.meanSeriesHidden;
			}
			
			chart.options.series[iSeries].visible = visibilityState;
			chart.options.series[iSeries].showInLegend = visibilityState;
		});
		
		// It is assigned only once
		if(!stillLoading && chart.isEmpty === undefined) {
			chart.isEmpty = isEmpty;
		}
	}
	
	function defaultSeriesAggregator(chart,doGenerate,stillLoading) {
		var isEmpty = true;
		chart.allData.forEach(function(series) {
			// isEmpty detector
			if(series.seriesValues.length > 0) {
				isEmpty = false;
			}
			
			var reDigest = !stillLoading || !('term_type' in series);
			if(reDigest && (doGenerate || !series.seriesDigestedValues)) {
				series.seriesDigestedValues = series.seriesGenerator(series.seriesValues);
				series.series[series.seriesDest] = series.seriesDigestedValues;
			}
			//console.log("DEBUG "+g.name);
			//console.log(series.seriesValues);
			//series.seriesValues = undefined;
			var visibilityState;
			if('term_type' in series) {
				visibilityState = !stillLoading && !series.term_type.termHidden;
			} else {
				visibilityState = stillLoading || !chart.meanSeriesHidden;
			}
			
			if(chart.library!==LIBRARY_NVD3) {
				series.series.visible = visibilityState;
				series.series.showInLegend = visibilityState;
			} else if(visibilityState) {
				series.series[series.seriesDest] = [];
			} else {
				series.series[series.seriesDest] = series.seriesDigestedValues;
			}
		});
		
		// It is assigned only once
		if(!stillLoading && chart.isEmpty === undefined) {
			chart.isEmpty = isEmpty;
		}
	}
	
	function dataSeriesComparator(a,b) {
		return a[0] - b[0];
	}
	
	function genMeanSeries(origValues) {
		var meanValues = [];
		
		// Pre-processing the original values
		var values = [];
		origValues.forEach(function(data) {
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
		var numEq = 0;
		var sumEqVal = 0.0;
		
		var prevPos = 0;
		
		values.forEach(function(point) {
			if(prevPos!=point[0]) {
				if(numPos!==0) {
					var mean = sumPosVal  / numPos;
					meanValues.push({x: prevPos,y: mean},{x: point[0],y: mean});
					//meanValues.push({x: prevPos,y: mean},{x: point[0],y: mean},{x: point[0],y: null});
				}
				prevPos = point[0];
				if(numEq!==0) {
					var meanEq = (sumPosVal + sumEqVal) / (numPos+numEq);
					meanValues.push({x: prevPos,y:null},{x: prevPos,y: meanEq},{x: prevPos,y: null});
					//meanValues.push({x: prevPos,y: meanEq},{x: prevPos,y: null});
					numEq = 0;
					sumEqVal = 0.0;
				}
			}
			if(point[2] === 0) {
				numEq++;
				sumEqVal += point[1];
				
			} else if(point[2] > 0) {
				numPos++;
				sumPosVal += point[1];
			} else {
				numPos--;
				sumPosVal -= point[1];
			}
		});
		// Corner case
		if(numEq!==0) {
			var meanEq = (sumPosVal + sumEqVal) / (numPos+numEq);
			meanValues.push({x: prevPos,y: null},{x: prevPos,y: meanEq},{x: prevPos,y: null});
			//meanValues.push({x: prevPos,y: meanEq},{x: prevPos,y: null});
		}
		
		return meanValues;
	}
	
	function genMeanSeriesHighcharts(origValues) {
		return genMeanSeries(origValues).map(function(meanValue) {
			return [meanValue.x,meanValue.y];
		});
	}
	
	function doRegionFeatureLayout(rangeData,results) {
		rangeData.regionLayout = {};
		var range = rangeData.range;
		var rangeStr = range.chr+":"+range.start+"-"+range.end;
		var rangeStrEx = rangeStr + '';
		var range_start = rangeData.range.start;
		var range_end = rangeData.range.end;
		if(rangeData.flankingWindowSize!==undefined) {
			rangeStrEx += " \u00B1 "+rangeData.flankingWindowSize+"bp";
			range_start -= rangeData.flankingWindowSize;
			range_end += rangeData.flankingWindowSize;
		}
		
		// Now, we have the region layout and features
		var regionFeature = {};
		var found = '';
		var isReactome = ConstantsService.isReactome(range.currentQuery.queryType);
		results.forEach(function(feature) {
			var featureRegion = feature._source;
			var dest = featureRegion.feature;
			if(!(dest in rangeData.regionLayout)) {
				rangeData.regionLayout[dest] = [];
			}
			
			// Saving for later processing
			rangeData.regionLayout[dest].push(featureRegion);
			
			// Getting a understandable label
			featureRegion.label = chooseLabelFromSymbols(featureRegion.symbol);
			
			var uri = (dest in ConstantsService.SEARCH_URIS) ? ConstantsService.SEARCH_URIS[dest] : ConstantsService.DEFAULT_SEARCH_URI;
			// Matching the feature_id to its region
			featureRegion.coordinates.forEach(function(coordinates) {
				regionFeature[coordinates.feature_id] = featureRegion;
				
				if(isReactome && coordinates.feature_id.indexOf(rangeData.range.label)===0) {
					// Setting it only once
					rangeData.heading = rangeData.range.label = featureRegion.label;
					isReactome = false;
				}
				
				// Preparing the label
				if(found.length > 0) {
					found += ', ';
				}
				found += dest+" <a href='"+uri+coordinates.feature_id+"' title='"+coordinates.feature_id+"' target='_blank'>"+featureRegion.label+"</a>";
			});
		});
		if(found.length>0) {
			var newFound = "Region <a href='"+ConstantsService.REGION_SEARCH_URI+rangeStr+"' target='_blank'>chr"+rangeStr+"</a>";
			if(rangeData.flankingWindowSize!==undefined) {
				newFound += " (&plusmn; "+rangeData.flankingWindowSize+"bp)";
			}
			found = newFound + " overlaps " + found;
			
		} else {
			found = 'No gene or transcript in this region';
		}
		rangeData.regionFeature = regionFeature;
		rangeData.rangeStr = rangeStr;
		rangeData.rangeStrEx = rangeStrEx;
		rangeData.found = found;
	}
	
	function doChartLayout(rangeData,charts,chartsMap) {
		if(charts===undefined) {
			charts = rangeData.charts;
			chartsMap = rangeData.chartMaps.general;
		}
		
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
		
		var range_start = rangeData.range.start;
		var range_end = rangeData.range.end;
		if(rangeData.flankingWindowSize!==undefined) {
			range_start -= rangeData.flankingWindowSize;
			range_end += rangeData.flankingWindowSize;
		}
		
		// So, we can prepare the charts
		var histoneInstance;
		
		var GraphPrepare = function(gData) {
			var chart;
			
			var title = gData.title;
			var noData = gData.noData;
			var gName = gData.name;
	
			if(histoneInstance!==undefined) {
				title += ' ' + histoneInstance.histoneName;
				noData += ' ' + histoneInstance.histoneName;
				gName += ' ' + histoneInstance.histoneName;
			}
			
			switch(gData.type) {
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
				case GRAPH_TYPE_BOXPLOT_HIGHCHARTS:
					chart = {
						options: {
							options: {
								chart: {
									type: 'boxplot',
									backgroundColor: null,
									events: {
										// reflowing after load and redraw events led to blank drawings
										addSeries: function() {
											var chart = this;
											//this.reflow();
											setTimeout(function() {
												chart.reflow();
											},0);
										}
									},
									animation: false,
									zoomType: 'x',
									panning: true,
									panKey: 'shift'
								},
								legend: {
									enabled: false,
								},
								tooltip: {
									animation: false,
									backgroundColor: '#FFFFFF'
								},
								plotOptions: {
									series: {
										animation: false
									}
								},
								exporting: HighchartsCommonExportingOptions,
							},
							title: {
								text: title
							},
							xAxis: {
								title: {
									text: 'Ensembl Ids (at '+rangeData.rangeStrEx+')'
								},
								categories: []
							},
							yAxis: {
								title: {
									text: gData.yAxisLabel
								}
							},
							series: [],
							loading: true,
							//func: function(chart) {
							//	// This is needed to reflow the chart
							//	// to its final width
							//	$timeout(function() {
							//		chart.reflow();
							//	},0);
							//},
						},
						seriesAggregator: highchartsBoxPlotAggregator,
						library: LIBRARY_HIGHCHARTS,
					};
					
					// Setting the floor and ceiling when available
					if(gData.floor!==undefined) {
						chart.options.yAxis.floor = gData.floor;
					}
					
					if(gData.ceiling!==undefined) {
						chart.options.yAxis.ceiling = gData.ceiling;
					}
					break;
				case GRAPH_TYPE_STEP_HIGHCHARTS:
					var plotBands = [];
					chart = {
						options: {
							options: {
								chart: {
									type: 'line',
									backgroundColor: null,
									events: {
										// reflowing after load and redraw events led to blank drawings
										addSeries: function() {
											var chart = this;
											//this.reflow();
											setTimeout(function() {
												chart.reflow();
											},0);
										}
									},
									animation: false,
									zoomType: 'x',
									panning: true,
									panKey: 'shift'
								},
								legend: {
									enabled: false,
								},
								tooltip: {
									animation: false,
									shared: true,
									backgroundColor: '#FFFFFF'
								},
								plotOptions: {
									series: {
										animation: false
									}
								},
								exporting: HighchartsCommonExportingOptions,
							},
							title: {
								text: title
							},
							xAxis: {
								title: {
									text: 'Coordinates (at '+rangeData.rangeStrEx+')'
								},
								min: range_start,
								max: range_end,
								allowDecimals: false,
								plotBands: plotBands
							},
							yAxis: {
								title: {
									text: gData.yAxisLabel
								}
							},
							series: [],
							loading: true,
							//func: function(chart) {
							//	// This is needed to reflow the chart
							//	// to its final width
							//	$timeout(function() {
							//		chart.reflow();
							//	},0);
							//},
						},
						seriesAggregator: defaultSeriesAggregator,
						library: LIBRARY_HIGHCHARTS,
					};
					
					// Setting the floor and ceiling when available
					if(gData.floor!==undefined) {
						chart.options.yAxis.floor = gData.floor;
					}
					
					if(gData.ceiling!==undefined) {
						chart.options.yAxis.ceiling = gData.ceiling;
					}
					
					// Adding the gene and transcript regions
					//REGION_FEATURES.forEach(function(featureType) {
					//	var featureColor = REGION_FEATURES_COLORS[featureType];
					//	rangeData.regionLayout[featureType].forEach(function(featureRegion) {
					//		featureRegion.coordinates.forEach(function(coords) {
					//			var plotBand = {
					//				borderColor: {
					//					linearGradient: { x1: 0, x2: 1, y1:0, y2: 0 },
					//					stops: [
					//						[0, featureColor],
					//						[1, '#000000']
					//					]
					//				},
					//				borderWidth: 1,
					//				from: coords.chromosome_start,
					//				to: coords.chromosome_end,
					//			};
					//			plotBands.push(plotBand);
					//			
					//			switch(featureType) {
					//				case REGION_FEATURE_GENE:
					//					plotBand.label = {
					//						text: featureRegion.label,
					//						fontSize: '8px',
					//						rotation: 330
					//					};
					//					break;
					//			}
					//		});
					//	});
					//});
					break;
			}
			
			
			// Common attributes
			chart.type = gData.type;
			chart.regionFeature = rangeData.regionFeature;
			chart.allData = [];
			chart.bpSideData = {
				seriesToIndex: {},
				meanSeries: null
			};
			chart.title = title;
			// Is this graph initially hidden?
			if(gData.isInitiallyHidden !== undefined) {
				chart.isHidden = gData.isInitiallyHidden;
			}

			charts.push(chart);
			
			chartsMap[gName] = chart;
		};
		
		GRAPHS.forEach(GraphPrepare);
		
		rangeData.localScope.histones.forEach(function(histone) {
			histoneInstance = histone;
			HISTONE_GRAPHS.forEach(GraphPrepare);
		});
		
	}
	
	function processGeneralChartData(rangeData) {
		var origin = rangeData.processedData.all;
		var dataArray = rangeData.fetchedData.all;
		var maxI = dataArray.length;
		if(origin<maxI) {
			var localScope = rangeData.localScope;
			for(var i=origin; i<maxI ; i++) {
				var data = dataArray[i];
				if(data.meanCellTypeSeriesId in localScope.SeriesToChart) {
					var chartIds = localScope.SeriesToChart[data.meanCellTypeSeriesId];
					
					// We do this for every chart where the series appears
					for(var iChart=0;iChart<chartIds.length;iChart++) {
						var chartId = chartIds[iChart];
						if(chartId in rangeData.chartMaps.general) {
							var graph = rangeData.chartMaps.general[chartId];
							
							var meanSeriesValues;
							if(data.meanCellTypeSeriesId in graph.bpSideData.seriesToIndex) {
								meanSeriesValues = graph.bpSideData.seriesToIndex[data.meanCellTypeSeriesId];
							} else {
								meanSeriesValues = [];
								var meanSeries;
								
								graph.bpSideData.meanSeries = localScope.AVG_SERIES_COLORS[data.meanCellTypeSeriesId];
								switch(graph.type) {
									case GRAPH_TYPE_STEP_CHARTJS:
										meanSeries = {
											seriesValues: meanSeriesValues,
											seriesGenerator: genMeanSeries,
											seriesDest: 'data',
											series: {
												label: graph.bpSideData.meanSeries.name,
												strokeColor: graph.bpSideData.meanSeries.color
											}
										};
										graph.options.data.datasets.push(meanSeries.series);
										break;
									case GRAPH_TYPE_STEP_CANVASJS:
										meanSeries = {
											seriesValues: meanSeriesValues,
											seriesGenerator: genMeanSeries,
											seriesDest: 'dataPoints',
											series: {
												type: "stepLine",
												name: graph.bpSideData.meanSeries.name,
												color: graph.bpSideData.meanSeries.color
											}
										};
										graph.options.data.push(meanSeries.series);
										break;
									case GRAPH_TYPE_BOXPLOT_HIGHCHARTS:
										meanSeries = {
											seriesValues: meanSeriesValues,
											seriesGenerator: genBoxPlotSeries,
											seriesDest: 'data',
											series: {
												name: graph.bpSideData.meanSeries.name,
												color: graph.bpSideData.meanSeries.color
											}
										};
										graph.options.series.push(meanSeries.series);
										break;
									case GRAPH_TYPE_STEP_HIGHCHARTS:
										meanSeries = {
											seriesValues: meanSeriesValues,
											seriesGenerator: genMeanSeriesHighcharts,
											seriesDest: 'data',
											series: {
												name: graph.bpSideData.meanSeries.name,
												color: graph.bpSideData.meanSeries.color,
												shadow: false,
												connectNulls: false,
												marker: {
													enabled: false
												},
												tooltip: {
													shared: true,
													shadow: false,
												},
												turboThreshold: 0,
												step: 'left',
											}
										};
										graph.options.series.push(meanSeries.series);
										break;
									case GRAPH_TYPE_STEP_NVD3:
										meanSeries = {
											seriesValues: meanSeriesValues,
											seriesGenerator: genMeanSeries,
											seriesDest: 'values',
											series: {
												type: 'area',
												key: graph.bpSideData.meanSeries.name,
												color: graph.bpSideData.meanSeries.color
											}
										};
										graph.data.push(meanSeries.series);
										break;
								}
								meanSeries.series[meanSeries.seriesDest] = [];
								graph.bpSideData.seriesToIndex[data.meanCellTypeSeriesId] = meanSeriesValues;
								graph.allData.push(meanSeries);
							}
							
							var seriesValues;
							if(data.cellTypeSeriesId in graph.bpSideData.seriesToIndex) {
								seriesValues = graph.bpSideData.seriesToIndex[data.cellTypeSeriesId];
							} else {
								seriesValues = [];
								var series;
								
								// We need this shared reference
								var term_type = rangeData.termNodesHash[data.analysis.cell_type.o_uri];
								
								var seriesName = data.analysis.cell_type.name;
								var seriesColor = data.analysis.cell_type.color;
								switch(graph.type) {
									case GRAPH_TYPE_STEP_CHARTJS:
										series = {
											seriesValues: seriesValues,
											seriesGenerator: genMeanSeries,
											seriesDest: 'data',
											series: {
												label: seriesName,
												strokeColor: seriesColor,
											}
										};
										graph.options.data.datasets.push(series.series);
										break;
									case GRAPH_TYPE_STEP_CANVASJS:
										series = {
											seriesValues: seriesValues,
											seriesGenerator: genMeanSeries,
											seriesDest: 'dataPoints',
											series: {
												type: "stepLine",
												name: seriesName,
												color: seriesColor,
											}
										};
										graph.options.data.push(series.series);
										break;
									case GRAPH_TYPE_BOXPLOT_HIGHCHARTS:
										series = {
											seriesValues: seriesValues,
											seriesGenerator: genBoxPlotSeries,
											seriesDest: 'data',
											term_type: term_type,
											series: {
												name: seriesName,
												color: seriesColor,
											}
										};
										graph.options.series.push(series.series);
										break;
									case GRAPH_TYPE_STEP_HIGHCHARTS:
										series = {
											seriesValues: seriesValues,
											seriesGenerator: genMeanSeriesHighcharts,
											seriesDest: 'data',
											term_type: term_type,
											series: {
												name: seriesName,
												color: seriesColor,
												shadow: false,
												connectNulls: false,
												marker: {
													enabled: false
												},
												tooltip: {
													shared: true,
													shadow: false,
												},
												turboThreshold: 1000,
												step: 'left',
											}
										};
										graph.options.series.push(series.series);
										break;
									case GRAPH_TYPE_STEP_NVD3:
										series = {
											seriesValues: seriesValues,
											seriesGenerator: genMeanSeries,
											seriesDest: 'values',
											term_type: term_type,
											series: {
												key: seriesName,
												color: seriesColor,
											}
										};
										graph.data.push(series.series);
										break;
								}
								series.series[series.seriesDest] = [];
								graph.bpSideData.seriesToIndex[data.cellTypeSeriesId] = seriesValues;
								graph.allData.push(series);
							}
							
							meanSeriesValues.push(data.sDataS);
							seriesValues.push(data.sDataS);
						}
					}
				}
			}
			rangeData.processedData.all = maxI;
		}
	}
	
	
	function redrawGeneralCharts(charts,doGenerate,stillLoading) {
		if('charts' in charts) {
			var rangeData = charts;
			
			// We have to call here this method, to be sure
			// we have fulfilled all the preconditions
			processGeneralChartData(rangeData);
			
			charts = rangeData.charts;
		}
		if(!Array.isArray(charts)) {
			charts = [ charts ];
		}
		
		// Normalizing stillLoading to a boolean
		stillLoading = !!stillLoading;
		if(!!doGenerate || stillLoading) {
			charts.forEach(function(chart) {
				setTimeout(function() {
					try {
						chart.seriesAggregator(chart,doGenerate,stillLoading);
						chart.options.loading = stillLoading;
					} catch(e) {
						console.log(e);
					}
				},0);
			});
		} else {
			charts.forEach(function(chart) {
				try {
					chart.seriesAggregator(chart,doGenerate,stillLoading);
					chart.options.loading = stillLoading;
				} catch(e) {
					console.log(e);
				}
			});
			// To force a reflow / redraw
			//$scope.$broadcast('highchartsng.reflow');
		}
	}
	
	// This is a trimmed version of processGeneralChartData
	function processCellTypeDiseaseChartData(rangeData) {
		var origin = rangeData.processedData.byCellType[rangeData.ui.celltypeSelected.o_uri];
		var dataArray = rangeData.fetchedData.byCellType.hash[rangeData.ui.celltypeSelected.o_uri];
		var maxI = dataArray.length;
		if(origin<maxI) {
			var localScope = rangeData.localScope;
			for(var i=origin; i<maxI ; i++) {
				var data = dataArray[i];
				if(data.meanCellTypeSeriesId in localScope.SeriesToChart) {
					var chartIds = localScope.SeriesToChart[data.meanCellTypeSeriesId];
					
					// We do this for every chart where the series appears
					for(var iChart=0;iChart<chartIds.length;iChart++) {
						var chartId = chartIds[iChart];
						if(chartId in rangeData.chartMaps.celltypeDisease) {
							var graph = rangeData.chartMaps.celltypeDisease[chartId];
							
							var seriesValues;
							if(data.diseaseSeriesId in graph.bpSideData.seriesToIndex) {
								seriesValues = graph.bpSideData.seriesToIndex[data.diseaseSeriesId];
							} else {
								seriesValues = [];
								var series;
								
								// We need this shared reference
								var disease = rangeData.diseaseNodesHash[data.analysis.lab_experiment.sample.specimen.donor_disease];
								
								var seriesName = disease.name;
								var seriesColor = disease.color;
								switch(graph.type) {
									case GRAPH_TYPE_STEP_CHARTJS:
										series = {
											seriesValues: seriesValues,
											seriesGenerator: genMeanSeries,
											seriesDest: 'data',
											series: {
												label: seriesName,
												strokeColor: seriesColor,
											}
										};
										graph.options.data.datasets.push(series.series);
										break;
									case GRAPH_TYPE_STEP_CANVASJS:
										series = {
											seriesValues: seriesValues,
											seriesGenerator: genMeanSeries,
											seriesDest: 'dataPoints',
											series: {
												type: "stepLine",
												name: seriesName,
												color: seriesColor,
											}
										};
										graph.options.data.push(series.series);
										break;
									case GRAPH_TYPE_BOXPLOT_HIGHCHARTS:
										series = {
											seriesValues: seriesValues,
											seriesGenerator: genBoxPlotSeries,
											seriesDest: 'data',
											term_type: disease,
											series: {
												name: seriesName,
												color: seriesColor,
											}
										};
										graph.options.series.push(series.series);
										break;
									case GRAPH_TYPE_STEP_HIGHCHARTS:
										series = {
											seriesValues: seriesValues,
											seriesGenerator: genMeanSeriesHighcharts,
											seriesDest: 'data',
											term_type: disease,
											series: {
												name: seriesName,
												color: seriesColor,
												shadow: false,
												connectNulls: false,
												marker: {
													enabled: false
												},
												tooltip: {
													shared: true,
													shadow: false,
												},
												turboThreshold: 1000,
												step: 'left',
											}
										};
										graph.options.series.push(series.series);
										break;
									case GRAPH_TYPE_STEP_NVD3:
										series = {
											seriesValues: seriesValues,
											seriesGenerator: genMeanSeries,
											seriesDest: 'values',
											term_type: disease,
											series: {
												key: seriesName,
												color: seriesColor,
											}
										};
										graph.data.push(series.series);
										break;
								}
								series.series[series.seriesDest] = [];
								graph.bpSideData.seriesToIndex[data.diseaseSeriesId] = seriesValues;
								graph.allData.push(series);
							}
							
							seriesValues.push(data.sDataS);
						}
					}
				}
			}
			rangeData.processedData.byCellType[rangeData.ui.celltypeSelected.o_uri] = maxI;
		}
	}
	
	// This is almost identical to redrawGeneralCharts
	function redrawCellTypeDiseaseCharts(charts,doGenerate,stillLoading) {
		if('ui' in charts) {
			var rangeData = charts;
			
			// We have to call here this method, to be sure
			// we have fulfilled all the preconditions
			processCellTypeDiseaseChartData(rangeData);
			
			charts = rangeData.ui.celltypeDiseaseCharts;
		}
		if(!Array.isArray(charts)) {
			charts = [ charts ];
		}
		
		// Normalizing stillLoading to a boolean
		stillLoading = !!stillLoading;
		if(!!doGenerate || stillLoading) {
			charts.forEach(function(chart) {
				setTimeout(function() {
					try {
						chart.seriesAggregator(chart,doGenerate,stillLoading);
						chart.options.loading = stillLoading;
					} catch(e) {
						console.log(e);
					}
				},0);
			});
		} else {
			charts.forEach(function(chart) {
				try {
					chart.seriesAggregator(chart,doGenerate,stillLoading);
					chart.options.loading = stillLoading;
				} catch(e) {
					console.log(e);
				}
			});
			// To force a reflow / redraw
			//$scope.$broadcast('highchartsng.reflow');
		}
	}
	
	function redrawCharts(charts,doGenerate,stillLoading,viewClass) {
		if('charts' in charts) {
			var rangeData = charts;
			
			viewClass = rangeData.viewClass;
		}
		if(viewClass===undefined) {
			viewClass = ConstantsService.VIEW_GENERAL;
		}
		switch(viewClass) {
			case ConstantsService.VIEW_GENERAL:
				redrawGeneralCharts(charts,doGenerate,stillLoading);
				break;
			case ConstantsService.VIEW_DISEASES:
				redrawCellTypeDiseaseCharts(charts,doGenerate,stillLoading);
				break;
		}
	}
	
	function assignCellTypesColorMap(localScope,termNodes) {
		var cellTypeColors = Palette.getNextColors(termNodes.length);
		
		// Coloring the cell types
		termNodes.forEach(function(termNode,i) {
			var theColor = cellTypeColors[i];
			termNode.color = theColor;
			termNode.termHidden = false;
		});
		
		// This is needed for the data model
		localScope.termNodes = termNodes;
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
	
	function assignDiseasesColorMap(localScope) {
		// The colors for the diseases
		var diseaseRGBColors = Palette.getNextColors(localScope.diseaseNodes.length);
		localScope.diseaseNodes.forEach(function(disease, i) {
			disease.color = diseaseRGBColors[i];
		});
	}
	
	function assignSeriesDataToChart(chart,data) {
		// Very important, so we are managing the same array
		switch(chart.library) {
			case LIBRARY_NVD3:
				chart.data = data;
				break;
			case LIBRARY_HIGHCHARTS:
				chart.options.series[0].data = data;
				break;
		}
	}
	
	function getChartSeriesData(chart) {
		var data;
		
		switch(chart.library) {
			case LIBRARY_NVD3:
				data = chart.data;
				break;
			case LIBRARY_HIGHCHARTS:
				data = chart.options.series[0].data;
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
				experiment_type: histone.histoneName,
				feature: 'broad'
			});
			localScope.experimentLabels.push({
				label: histone.histoneName+' (peaks)',
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
		subtotals.options.title.text = 'Donors & Samples';
		subtotals.options.options.tooltip.pointFormat = '<span style="color:{point.color}">\u25CF</span> {point.y}';
		
		$scope.subtotals = subtotals;
		
		var analysisSubtotals = angular.copy(subtotalsChartTemplate);
		analysisSubtotals.options.title.text = 'Analysis';
		analysisSubtotals.options.options.tooltip.headerFormat = '';
		analysisSubtotals.options.options.tooltip.pointFormat = '{point.desc}<br /><span style="color:{point.color}">\u25CF</span> {point.y}';
		
		$scope.analysisSubtotals = analysisSubtotals;
	}
	
	function storeRange(localScope,range) {
		// Preparing the charts!
		var termNodes = angular.copy(localScope.termNodes);
		var termNodesHash = {};
		termNodes.forEach(function(termNode) {
			termNodesHash[termNode.o_uri] = termNode;
		});
		
		var diseaseNodes = angular.copy(localScope.diseaseNodes);
		var diseaseNodesHash = {};
		diseaseNodes.forEach(function(diseaseNode) {
			diseaseNodesHash[diseaseNode.o_uri] = diseaseNode;
		});
		
		var rangeData = {
			localScope: localScope,
			toBeFetched: true,
			fetching: false,
			heading: (range.label !== undefined) ? range.label : ('Region ' + range.chr + ':' + range.start + '-' + range.end),
			range: range,
			treedata: null,
			termNodes: termNodes,
			termNodesHash: termNodesHash,
			diseaseNodes: diseaseNodes,
			diseaseNodesHash: diseaseNodesHash,
			charts: [],
			chartMaps: {
				general: {},
			},
			stats: {},
			fetchedData: {
				byCellType: {
					hash: {},
					orderedKeys: [],
				},
				all: [],
			},
			processedData: {
				byCellType: {},
				all: 0,
			},
			ui: {
				gChro: (range.chr in ChromosomesHash) ? ChromosomesHash[range.chr] : UnknownChromosome,
			},
			viewClass: ConstantsService.VIEW_GENERAL,
		};
		
		selectCellTypeForDiseases(rangeData,0);
		
		// Only not taking into account flanking window size for explicit ranges
		if(range.currentQuery.flankingWindowSize !== undefined) {
			rangeData.flankingWindowSize = range.currentQuery.flankingWindowSize;
		}
		
		localScope.graphData.push(rangeData);
	}
	
	function selectCellTypeForDiseases(rangeData,cellTypeIndex) {
		rangeData.ui.celltypeButtonSelected = cellTypeIndex;
		rangeData.ui.celltypeSelected = rangeData.termNodes[cellTypeIndex];
		rangeData.ui.celltypeDiseaseCharts = [];
		rangeData.chartMaps.celltypeDisease = {};
		doChartLayout(rangeData,rangeData.ui.celltypeDiseaseCharts,rangeData.chartMaps.celltypeDisease);
	}
	
	function storeFetchedData(rangeData,range_start,range_end,results) {
		var localScope = rangeData.localScope;
		results.forEach(function(segment) {
			var analysis_id = segment._source.analysis_id;
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
								value = segment._source.FPKM;
								meanCellTypeSeriesId = EXPG_SERIES;
								payload = segment._source.gene_stable_id;
								break;
							case ConstantsService.EXPT_CONCEPT:
								value = segment._source.FPKM;
								meanCellTypeSeriesId = EXPT_SERIES;
								payload = segment._source.transcript_stable_id;
								break;
						}
						break;
					case DLAT_HYPER_SERIES:
						value = segment._source.meth_level;
						break;
					case DLAT_HYPO_SERIES:
						value = segment._source.meth_level;
						break;
					case RREG_SERIES:
						value = segment._source.z_score;
						break;
					default:
						if(meanCellTypeSeriesId.indexOf(PDNA_NARROW_SERIES)===0) {
							value = segment._source.log10_qvalue;
						} else if(meanCellTypeSeriesId.indexOf(PDNA_BROAD_SERIES)===0) {
							value = segment._source.log10_qvalue;
						}
						break;
				}
				
				// Clipping to the viewed region
				var chromosome_start = segment._source.chromosome_start;
				var chromosome_end = segment._source.chromosome_end;
				
				if(chromosome_start < range_start) {
					chromosome_start = range_start;
				}
				if(chromosome_end > range_end) {
					chromosome_end = range_end;
				}
				
				var sDataS = [chromosome_start,chromosome_end,value,payload];
				var data = {
					cellTypeSeriesId: cellTypeSeriesId,
					meanCellTypeSeriesId: meanCellTypeSeriesId,
					diseaseSeriesId: diseaseSeriesId,
					analysis: analysis,
					chromosome_start: segment._source.chromosome_start,
					chromosome_end: segment._source.chromosome_end,
					sDataS: sDataS
				};
				
				// Labelling what we have seen
				// We need this shared reference
				var cell_type = rangeData.termNodesHash[analysis.cell_type.o_uri];
				// and signal this cell_type
				cell_type.wasSeen = true;
				
				// And the same for diseases
				var disease = rangeData.diseaseNodesHash[analysis.lab_experiment.sample.specimen.donor_disease];
				// and signal this cell_type
				disease.wasSeen = true;
				
				// By default, store all
				rangeData.fetchedData.all.push(data);
				var cellDataArray;
				if(analysis.cell_type.o_uri in rangeData.fetchedData.byCellType.hash) {
					cellDataArray = rangeData.fetchedData.byCellType.hash[analysis.cell_type.o_uri];
				} else {
					cellDataArray = [];
					rangeData.fetchedData.byCellType.hash[analysis.cell_type.o_uri] = cellDataArray;
					rangeData.fetchedData.byCellType.orderedKeys.push(analysis.cell_type.o_uri);
					rangeData.processedData.byCellType[analysis.cell_type.o_uri] = 0;
				}
				cellDataArray.push(data);
			}
		});
	}
		
	return {
		doRegionFeatureLayout: doRegionFeatureLayout,
		doChartLayout: doChartLayout,
		storeFetchedData: storeFetchedData,
		processGeneralChartData: processGeneralChartData,
		redrawCharts: redrawCharts,
		redrawGeneralCharts: redrawGeneralCharts,
		assignCellTypesColorMap: assignCellTypesColorMap,
		assignMeanSeriesColorMap: assignMeanSeriesColorMap,
		assignDiseasesColorMap: assignDiseasesColorMap,
		assignSeriesDataToChart: assignSeriesDataToChart,
		getChartSeriesData: getChartSeriesData,
		initializeAvgSeries: initializeAvgSeries,
		initializeSubtotalsCharts: initializeSubtotalsCharts,
		linkMeanSeriesToAnalysis: linkMeanSeriesToAnalysis,
		chooseLabelFromSymbols: chooseLabelFromSymbols,
		REGION_FEATURES: REGION_FEATURES,
		storeRange: storeRange,
		selectCellTypeForDiseases: selectCellTypeForDiseases,
	};
}]);
