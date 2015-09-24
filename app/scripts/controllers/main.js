'use strict';

/*jshint camelcase: false , quotmark: false */

/**
 * @ngdoc function
 * @name blueprintApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the blueprintApp
 */
angular.module('blueprintApp')
  .controller('MainCtrl', ['$scope','$sce','$location','$q','es','portalConfig','d3','$timeout','$modal','$interpolate',function($scope,$sce,$location,$q, es, portalConfig, d3, $timeout,$modal,$interpolate) {
	
	var SEARCHING_LABEL = "Searching...";
	var FETCHING_LABEL = "Fetching...";
	var PLOTTING_LABEL = "Plotting...";
	var SEARCH_LABEL = "Search";
	
	$scope.termTooltip = $sce.trustAsHtml("<b>Click</b>: switches term&apos;s results<br /><b>Ctrl+Click</b>: focus on term&apos;s results");
	
	var METHYL_HYPER_GRAPH = 'methyl_hyper';
	var METHYL_HYPO_GRAPH = 'methyl_hypo';
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
			name: METHYL_HYPER_GRAPH,
			noData: 'hyper-methylated regions',
			title: 'Hyper-methylated regions',
			floor: 0.0,
			yAxisLabel: 'Methylation level',
			type: GRAPH_TYPE_STEP_HIGHCHARTS,
		},
		{
			name: METHYL_HYPO_GRAPH,
			noData: 'hypo-methylated regions',
			title: 'Hypo-methylated regions',
			floor: 0.0,
			yAxisLabel: 'Methylation level',
			type: GRAPH_TYPE_STEP_HIGHCHARTS,
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
		{
			name: DNASE_GRAPH,
			noData: 'regulatory regions',
			title: 'Regulatory regions (DNAse)',
			yAxisLabel: 'z-score',
			type: GRAPH_TYPE_STEP_HIGHCHARTS,
		},
	];
	var DLAT_CONCEPT_M = 'dlat.m';
	var PDNA_CONCEPT_M = 'pdna.m';
	var EXP_CONCEPT_M = 'exp.m';
	var RREG_CONCEPT_M = 'rreg.m';


	var DLAT_CONCEPT = 'dlat.mr';
	var PDNA_CONCEPT = 'pdna.p';
	var EXPG_CONCEPT = 'exp.g';
	var EXPT_CONCEPT = 'exp.t';
	var RREG_CONCEPT = 'rreg.p';
	
	var DLAT_HYPO_SERIES = DLAT_CONCEPT+'_hypo';
	var DLAT_HYPER_SERIES = DLAT_CONCEPT+'_hyper';
	var EXPG_SERIES = EXPG_CONCEPT;
	var EXPT_SERIES = EXPT_CONCEPT;
	var EXP_ANY_SERIES = EXP_CONCEPT_M;
	var PDNA_BROAD_SERIES = PDNA_CONCEPT + '_broad';
	var PDNA_NARROW_SERIES = PDNA_CONCEPT + '_narrow';
	var RREG_SERIES = RREG_CONCEPT;
	
	var AVG_SERIES = [
		{
			seriesId: DLAT_HYPO_SERIES,
			name: 'Mean hypo-methylated regions',
			chartId: METHYL_HYPO_GRAPH
		},
		{
			seriesId: DLAT_HYPER_SERIES,
			name: 'Mean hyper-methylated regions',
			chartId: METHYL_HYPER_GRAPH
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
			seriesId: PDNA_BROAD_SERIES,
			name: 'Mean broad histone peaks',
			chartId: CSEQ_BROAD_GRAPH
		},
		{
			seriesId: PDNA_NARROW_SERIES,
			name: 'Mean narrow histone peaks',
			chartId: CSEQ_NARROW_GRAPH
		},
		{
			seriesId: RREG_SERIES,
			name: 'Mean chromatin accessibility',
			chartId: DNASE_GRAPH
		},
	];
	
	var SeriesToChart = {};
	AVG_SERIES.forEach(function(avgSeries) {
		SeriesToChart[avgSeries.seriesId] = avgSeries.chartId;
	});
	
	var CHR_SEGMENT_LIMIT = 2500000;	// A bit larger than largest gene
	
	var REGION_FEATURE_GENE = 'gene';
	var REGION_FEATURE_TRANSCRIPT = 'transcript';
	var REGION_FEATURES = [REGION_FEATURE_GENE , REGION_FEATURE_TRANSCRIPT];
	var REGION_FEATURES_COLORS = {};
	REGION_FEATURES_COLORS[REGION_FEATURE_GENE] = '#ffffcc';
	REGION_FEATURES_COLORS[REGION_FEATURE_TRANSCRIPT] = 'orange';

    var pageNum = 1;
    var perPage = 50;
    var experimentLabels = ['Bisulfite-Seq','DNase-Seq','Gene Exp (RNA-Seq)','Transcript Exp (RNA-Seq)'];

    $scope.fetchedTreeData = undefined;

    $scope.info = '<p><a href="http://www.blueprint-epigenome.eu/"><img src="http://dcc.blueprint-epigenome.eu/img/blueprint.png" style="float:left;height:50px;margin-right:20px;"></a>BLUEPRINT is a high impact FP7 project aiming to produce a blueprint of haemopoetic epigenomes. Our goal is to apply highly sophisticated functional genomics analysis on a clearly defined set of primarily human samples from healthy and diseased individuals, and to provide at least 100 <a href="http://ihec-epigenomes.org/research/reference-epigenome-standards/" title="IHEC reference epigenome standards">reference epigenomes</a> to the scientific community. This resource-generating activity will be complemented by research into blood-based diseases, including common leukaemias and autoimmune disease (Type 1 Diabetes), by discovery and validation of epigenetic markers for diagnostic use and by epigenetic target identification.This may eventually lead to the development of novel and more individualised medical treatments. This website will provide links to the data &amp; primary analysis generated by the project.</p>'; 

    $scope.dataRelease = '[Dev without config]';
    $scope.dataDesc = '[Dev without config]';
    if(portalConfig.dataRelease) {
        $scope.dataRelease = portalConfig.dataRelease;
    }
    if(portalConfig.dataDesc) {
        $scope.dataDesc = portalConfig.dataDesc;
    }

    $scope.queryInProgress = false;
    $scope.suggestInProgress = false;
    $scope.searchButtonText = SEARCH_LABEL;
    $scope.found = "";
    $scope.samplesOnt = [];
    $scope.samples = [];
    $scope.specimens = [];
    $scope.donors = [];
    $scope.labs = [];
    $scope.analyses = [];
    $scope.experimentLabels = [];
    $scope.depth=null;
    $scope.numHistones = 8;	// Default value
    $scope.numCellularLines = 7;	// Default value
    $scope.histoneMap = {};
    
    $scope.rangeQuery = [];
    $scope.ensemblGeneId = null;
    $scope.currentQuery = null;
    $scope.currentQueryType = null;
    $scope.featureLabel = null;
    
	$scope.graphData = [];
    
    
    
    
    
    $scope.display = 'compact';
    $scope.chromosomes = [{n:1,c:"chr",f:"images/GRCh38_chromosome_1.svg"},
                    {n:2,c:"chr",f:"images/GRCh38_chromosome_2.svg"},
                    {n:3,c:"chr",f:"images/GRCh38_chromosome_3.svg"},
                    {n:4,c:"chr",f:"images/GRCh38_chromosome_4.svg"},
                    {n:5,c:"chr",f:"images/GRCh38_chromosome_5.svg"},
                    {n:6,c:"chr",f:"images/GRCh38_chromosome_6.svg"},
                    {n:7,c:"chr",f:"images/GRCh38_chromosome_7.svg"},
                    {n:8,c:"chr",f:"images/GRCh38_chromosome_8.svg"},
                    {n:9,c:"chr",f:"images/GRCh38_chromosome_9.svg"},
                    {n:10,c:"chr",f:"images/GRCh38_chromosome_10.svg"},
                    {n:11,c:"chr",f:"images/GRCh38_chromosome_11.svg"},
                    {n:12,c:"chr",f:"images/GRCh38_chromosome_12.svg"},
                    {n:13,c:"chr",f:"images/GRCh38_chromosome_13.svg"},
                    {n:14,c:"chr",f:"images/GRCh38_chromosome_14.svg"},
                    {n:15,c:"chr",f:"images/GRCh38_chromosome_15.svg"},
                    {n:16,c:"chr",f:"images/GRCh38_chromosome_16.svg"},
                    {n:17,c:"chr",f:"images/GRCh38_chromosome_17.svg"},
                    {n:18,c:"chr",f:"images/GRCh38_chromosome_18.svg"},
                    {n:19,c:"chr",f:"images/GRCh38_chromosome_19.svg"},
                    {n:20,c:"chr",f:"images/GRCh38_chromosome_20.svg"},
                    {n:21,c:"chr",f:"images/GRCh38_chromosome_21.svg"},
                    {n:22,c:"chr",f:"images/GRCh38_chromosome_22.svg"},
                    {n:"X",c:"chr",f:"images/GRCh38_chromosome_X.svg"},
                    {n:"Y",c:"chr",f:"images/GRCh38_chromosome_Y.svg"},
                    {n:"MT",c:"chr",f:"images/GRCh38_chromosome_MT.svg"}
                  ];

	$scope.unknownChromosome = { n: "(unknown)", f: "images/chr.svg" };
	
	function openModal(state,message,callback,size) {
		var modalInstance = $modal.open({
			animation: false,
			templateUrl: 'messages.html',
			controller: 'ModalInstanceCtrl',
			//bindToController: true,
			size: size,
			resolve: {
				modalState: function() { return state; },
				modalMessage: function() { return message; },
			}
		});
		
		modalInstance.result.then(callback);
		//    }, function () {
		//      $log.info('Modal dismissed at: ' + new Date());
		//    });
		
	}
	
	function getXG(d) {
		return d.x;
	}
	
	function getYG(d) {
		return d.y;
	}
	
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
    
    // If we set this to 1, we separate broad from narrow peaks
    var CSpeakSplit;

	var getAnalyses = function(localScope) {
		if(localScope.analyses!==undefined && localScope.analyses.length !== 0) {
			return localScope;
		}
		
		localScope.analyses = [];
		localScope.analysesHash = {};
		localScope.experiment2AnalysisHash = {};
		return es.search({
			size: 10000000,
			index: 'metadata',
			body: {
				query: {
					filtered: {
						filter: {
							bool: {
								must: [
									{exists : { field : 'experiment_id' }},
									{exists : { field : 'analysis_id' }}
								]  
							}
						}
					}
				}
		
			}
		}).then(function(resp){
			if(typeof(resp.hits.hits) !== undefined) {
				// Now, the analysis subtotals
				var numDlatHyper = 0;
				var numDlatHypo = 0;
				var numDlatOther = 0;
				
				var numCSbroad = 0;
				var numCSnarrow = 0;
				
				var numExpG = 0;
				var numExpT = 0;
				
				var numRReg = 0;
				var numAnOther = 0;
				
				resp.hits.hits.forEach(function(d) {
					var analysis = d._source;
					analysis._type = d._type;
					switch(d._type) {
						case DLAT_CONCEPT_M:
							switch(analysis.mr_type) {
								case 'hyper':
									numDlatHyper++;
									break;
								case 'hypo':
									numDlatHypo++;
									break;
								default:
									numDlatOther++;
									break;
							}
							
							break;
						case PDNA_CONCEPT_M:
							if(analysis.analysis_id.indexOf('_broad_')!==-1) {
								analysis.isBroad = true;
								numCSbroad++;
							} else {
								analysis.isBroad = false;
								numCSnarrow++;
							}
							break;
						case EXP_CONCEPT_M:
							numExpG++;
							numExpT++;
							break;
						case RREG_CONCEPT_M:
							numRReg++;
							break;
						default:
							numAnOther++;
					}
					localScope.analyses.push(analysis);
					localScope.analysesHash[analysis.analysis_id] = analysis;
					if(!(analysis.experiment_id in localScope.experiment2AnalysisHash)) {
						localScope.experiment2AnalysisHash[analysis.experiment_id] = [];
					}
					localScope.experiment2AnalysisHash[analysis.experiment_id].push(analysis);
				});
				
				var analysisSubtotals = [];
				
				// This is very important!!!
				switch(localScope.analysisSubtotals.library) {
					case LIBRARY_NVD3:
						localScope.analysisSubtotals.data = analysisSubtotals;
						break;
					case LIBRARY_HIGHCHARTS:
						localScope.analysisSubtotals.options.series[0].data = analysisSubtotals;
						break;
				}
				
				analysisSubtotals.push(
					{
						name: 'Hyper-m',
						desc: 'Hyper-methylated regions',
						y: numDlatHyper
					},
					{
						name: 'Hypo-m',
						desc: 'Hypo-methylated regions',
						y: numDlatHypo
					}
				);
				
				if(numDlatOther > 0) {
					analysisSubtotals.push({
						name: 'Other m regions',
						desc: 'Other methylated regions',
						y: numDlatOther
					});
				}
				
				analysisSubtotals.push(
					{
						name: 'CS broad',
						desc: 'ChIP-Seq (broad peaks)',
						y: numCSbroad
					},
					{
						name: 'CS narrow',
						desc: 'ChIP-Seq (narrow peaks)',
						y: numCSnarrow
					},
					{
						name: 'Gene exp',
						desc: 'Gene expression',
						y: numExpG
					},
					{
						name: 'Trans exp',
						desc: 'Transcript expression',
						y: numExpT
					},
					{
						name: 'Chrom Acc',
						desc: 'Chromatin accessibility',
						y: numRReg
					}
				);
				
				if(numAnOther > 0) {
					analysisSubtotals.push({
						name: 'Other',
						desc: 'Other',
						y: numAnOther
					});
				}
			//} else {
			//	return deferred.reject(err);
			}
			
			return localScope;
		});
	};

	var getLabs = function(localScope) {
		// As it should get an array of local scopes, which should be the same, let's use the first one
		if(Array.isArray(localScope)) {
			localScope = localScope[0];
		}
		
		if(localScope.labs!==undefined && localScope.labs.length!==0) {
			return localScope;
		}
		
		localScope.labs = [];
		
		var deferred = $q.defer();
		es.search({
			size:100000,
			index: 'sample-tracking-data',
			body:{
				query: {
					filtered: {
						filter: {
							bool: {
								must: [
									{exists : { field : 'experiment_id' }},
									{exists : { field : 'experiment_type' }}
								]	
							}
						}
					}
				}
		
			}
		},function(err,resp){
			if(typeof(resp.hits.hits) !== 'undefined'){
				var histones = [];
				var histoneMap = {};
				localScope.labs = resp.hits.hits.map(function(d) {
					var lab_experiment = {};
					lab_experiment._type	= d._type;
					lab_experiment.sample_id = d._source.analyzed_sample_id;
					lab_experiment.experiment_id = d._source.experiment_id;
					lab_experiment.experiment_type = d._source.experiment_type;
					lab_experiment.features = d._source.features;
					if(lab_experiment.experiment_type.indexOf('Histone ')===0) {
						var histoneName = lab_experiment.features.CHIP_ANTIBODY.value;
						var normalizedHistoneName = histoneName.replace(/[.]/g,'_');
						
						// Registering new histones
						if(!(normalizedHistoneName in histoneMap)) {
							var histone = {
								histoneName: histoneName,
								normalizedHistoneName: normalizedHistoneName,
								histoneIndex: -1,
								lab_experiments: []
							};
							histoneMap[normalizedHistoneName] = histone;
							histones.push(histone);
						}
						histoneMap[normalizedHistoneName].lab_experiments.push(lab_experiment);
						lab_experiment.histone = histoneMap[normalizedHistoneName];
					}
					
					// Linking everything
					lab_experiment.analyses = (lab_experiment.experiment_id in localScope.experiment2AnalysisHash) ? localScope.experiment2AnalysisHash[lab_experiment.experiment_id] : [];
					lab_experiment.analyses.forEach(function(analysis) {
						analysis.lab_experiment = lab_experiment;
					});
					return lab_experiment;
				});
				
				// Now, map the histones and generate the labels
				localScope.experimentLabels = angular.copy(experimentLabels);
				var iHis = localScope.experimentLabels.length;
				histones.sort(function(a,b) { return a.histoneName.localeCompare(b.histoneName); });
				
				histones.forEach(function(histone) {
					histone.histoneIndex = iHis;
					
					iHis++;
					localScope.experimentLabels.push(histone.histoneName+' (broad peaks)');
					if(CSpeakSplit) {
						// It uses two slots
						localScope.experimentLabels.push(histone.histoneName+' (peaks)');
						iHis++;
					}
				});
				localScope.numHistones = histones.length;
				localScope.histoneMap = histoneMap;
				
				deferred.resolve(localScope);
			} else {
				return deferred.reject(err);
			}
		
		});
		
		return deferred.promise;
	};
     
	var genShouldQuery = function(rangeQueryArr,prefix) {
		// We transform it into an array, in case it is not yet
		if(!Array.isArray(rangeQueryArr)) {
			rangeQueryArr = [ rangeQueryArr ];
		}
		var chromosome_name = 'chromosome';
		var chromosome_start_name = 'chromosome_start';
		var chromosome_end_name = 'chromosome_end';
		if(prefix!==undefined) {
			chromosome_name = prefix + '.' + chromosome_name;
			chromosome_start_name = prefix + '.' + chromosome_start_name;
			chromosome_end_name = prefix + '.' + chromosome_end_name;
		}
		var shouldQuery = rangeQueryArr.map(function(q) {
			var termQuery = {};
			termQuery[chromosome_name] = q.chr;
			
			var commonRange = {
				gte: q.start,
				lte: q.end
			};
			
			var chromosome_start_range = {};
			chromosome_start_range[chromosome_start_name] = commonRange;
			
			var chromosome_end_range = {};
			chromosome_end_range[chromosome_end_name] = commonRange;
			
			var chromosome_start_lte_range = {};
			chromosome_start_lte_range[chromosome_start_name] = {
				lte: q.end
			};
			
			var chromosome_end_gte_range = {};
			chromosome_end_gte_range[chromosome_end_name] = {
				gte: q.start
			};
			
			return {
				bool: {
					must: [
						{
							term: termQuery
						},
						{
							bool: {
								should: [
									{
										range: chromosome_start_range
									},
									{
										range: chromosome_end_range
									},
									{
										bool: {
											must: [
												{
													range: chromosome_start_lte_range
												},
												{
													range: chromosome_end_gte_range
												}
											]
										}
									}
								]
							}
						}
					]
				}
			};
		});
		
		// Preparing for the nested query
		if(prefix!==undefined) {
			shouldQuery = {
				nested: {
					path: prefix,
					filter: {
						bool: {
							should: shouldQuery
						}
					}
				}
			};
		}
		
		return shouldQuery;
	};
	
	var launch = function() {
		var theArgs = arguments;
		return function(localScope) {
			if(localScope!==undefined) {
				if(Array.isArray(localScope)) {
					localScope = localScope[0];
				}
				
				var queries = [];
				
				for(var t=0;t<theArgs.length;t++) {
					var theFunc = theArgs[t];
					localScope.graphData.forEach(function(rangeData) {
						//try {
							queries.push(theFunc(localScope,rangeData));
						//} catch(e) {
						//	console.log("Mira");
						//	console.log(e);
						//}
					});
				}
				
				if(queries.length > 0) {
					return queries.length===1 ? queries[0] : $q.all(queries);
				} else {
					return undefined;
				}
			} else {
				return undefined;
			}
		};
	};
	
	var rangeLaunch = function(theFunc,rangeData) {
		var theArgs = arguments;
		return function(localScope) {
			if(localScope!==undefined) {
				if(Array.isArray(localScope)) {
					localScope = localScope[0];
				}
				
				return theFunc(localScope,rangeData);
			} else {
				return undefined;
			}
		};
	};
	
	var getWgbsStatsData = function(localScope,rangeData) {
		var deferred = $q.defer();
		var shouldQuery = genShouldQuery(rangeData.range);
		
		rangeData.stats.bisulfiteSeq = [];
		rangeData.stats.bisulfiteSeqHash = {};
		es.search({
			size:10000000,
			index: 'primary',
			type: DLAT_CONCEPT,
			search_type: 'count',
			body: {
				query: {
					filtered: {
						filter: {
							bool: {
								should: shouldQuery
							}
						}
					}
				},
				aggs: {
					analyses: {
						terms: {
							field: 'analysis_id',
							size: 0
						},
						aggs: {
							stats_meth_level: {
								extended_stats: {
									field: 'meth_level'
								}
							}
						}
					}
				}
			}
		},function(err,resp) {
			if(typeof(resp.aggregations) !== undefined){  
				resp.aggregations.analyses.buckets.forEach(function(d) {
					rangeData.stats.bisulfiteSeq.push(d);
					rangeData.stats.bisulfiteSeqHash[d.key] = d;
				});
				deferred.resolve(localScope);
			} else {
				return deferred.reject(err); 
			}
		});
		
		return deferred.promise;
	};
	
	var getRnaSeqGStatsData = function(localScope,rangeData) {
		var deferred = $q.defer();
		var shouldQuery = genShouldQuery(rangeData.range);
		
		rangeData.stats.rnaSeqG = [];
		rangeData.stats.rnaSeqGHash = {};
		es.search({
			size:10000000,	
			index: 'primary',
			type: EXPG_CONCEPT,
			search_type: 'count',
			body: {
				query: {
					filtered: {
						filter: {
							bool: {
								should: shouldQuery
							}
						}
					}
				},
				aggs: {
					analyses: {
						terms: {
							field: 'analysis_id',
							size: 0
						},
						aggs: {
							stats_normalized_read_count: {
								extended_stats: {
									field: 'expected_count'
								}
							}
						}
					}
				}
			}
		},function(err,resp) {
			if(typeof(resp.aggregations) !== undefined){	
				resp.aggregations.analyses.buckets.forEach(function(d) {
					rangeData.stats.rnaSeqG.push(d);
					rangeData.stats.rnaSeqGHash[d.key] = d;
				});
				deferred.resolve(localScope);
			} else {
				return deferred.reject(err); 
			}
		});
		
		return deferred.promise;
	};

	var getRnaSeqTStatsData = function(localScope,rangeData) {
		var deferred = $q.defer();
		var shouldQuery = genShouldQuery(rangeData.range);
		
		rangeData.stats.rnaSeqT = [];
		rangeData.stats.rnaSeqTHash = {};
		es.search({
			size:10000000,	
			index: 'primary',
			type: EXPT_CONCEPT,
			search_type: 'count',
			body: {
				query: {
					filtered: {
						filter: {
							bool: {
								should: shouldQuery
							}
						}
					}
				},
				aggs: {
					analyses: {
						terms: {
							field: 'analysis_id',
							size: 0
						},
						aggs: {
							stats_normalized_read_count: {
								extended_stats: {
									field: 'expected_count'
								}
							}
						}
					}
				}
			}
		},function(err,resp) {
			if(typeof(resp.aggregations) !== undefined){	
				resp.aggregations.analyses.buckets.forEach(function(d) {
					rangeData.stats.rnaSeqT.push(d);
					rangeData.stats.rnaSeqTHash[d.key] = d;
				});
				deferred.resolve(localScope);
			} else {
				return deferred.reject(err); 
			}
		});
		
		return deferred.promise;
	};

	var getDnaseStatsData = function(localScope,rangeData) {
		var deferred = $q.defer();
		var shouldQuery = genShouldQuery(rangeData.range);
		
		rangeData.stats.dnaseSeq = [];
		rangeData.stats.dnaseSeqHash = {};
		es.search({
			size:10000000,	
			index: 'primary',
			type: RREG_CONCEPT,
			search_type: 'count',
			body: {
				query: {
					filtered: {
						filter: {
							bool: {
								should: shouldQuery
							}
						}
					}
				},
				aggs: {
					analyses:{
						terms:{
							field: 'analysis_id',
							size: 0
						},
						aggs:{
							peak_size: {
								sum: {
									lang: "expression",
									script: "doc['chromosome_end'].value - doc['chromosome_start'].value + 1" 
								}
							}
						}
					}
				}


			}
		},function(err,resp) {
			if(typeof(resp.aggregations) !== undefined){	
				resp.aggregations.analyses.buckets.forEach(function(d) {
					rangeData.stats.dnaseSeq.push(d);
					rangeData.stats.dnaseSeqHash[d.key] = d;
				});
				deferred.resolve(localScope);
			}else{
				return deferred.reject(err); 
			}
		});
		
		return deferred.promise;
	};
	
	var chipSeqWindow = 500;
	
	var getChipSeqStatsData = function(localScope,rangeData) {			
		var deferred = $q.defer();
		var shouldQuery = genShouldQuery(rangeData.range);
		
		rangeData.stats.chipSeq = [];
		rangeData.stats.chipSeqHash = {};
		es.search({
			size:10000000,	
			index: 'primary',
			type: PDNA_CONCEPT,
			search_type: 'count',
			body: {
				query: {
					filtered: {
						filter: {
							bool: {
								should: shouldQuery
							}
						}
					}
				},
				aggs: {
					analyses:{
						terms:{
							field: 'analysis_id',
							size: 0
						},
						aggs:{
							peak_size: {
								sum: {
									lang: "expression",
									script: "doc['chromosome_end'].value - doc['chromosome_start'].value + 1" 
								}
							}
						}
					}
				}
			}
		},function(err,resp) {
			if(typeof(resp.aggregations) !== undefined) {
				resp.aggregations.analyses.buckets.forEach(function(d) {
					rangeData.stats.chipSeq.push(d);
					rangeData.stats.chipSeqHash[d.key] = d;
				});
				deferred.resolve(localScope);
			} else {
				return deferred.reject(err); 
			}
		});
		
		return deferred.promise;
	};
	
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
		chart.allData.forEach(function(series,iSeries) {
			var reDigest = !stillLoading || !('cell_type' in series);
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
			var visibilityState = !('cell_type' in series) || (!stillLoading && !series.cell_type.termHidden);
			chart.options.series[iSeries].visible = visibilityState;
			chart.options.series[iSeries].showInLegend = visibilityState;
		});
	}
	
	function defaultSeriesAggregator(chart,doGenerate,stillLoading) {
		chart.allData.forEach(function(series) {
			var reDigest = !stillLoading || !('cell_type' in series);
			if(reDigest && (doGenerate || !series.seriesDigestedValues)) {
				series.seriesDigestedValues = series.seriesGenerator(series.seriesValues);
				series.series[series.seriesDest] = series.seriesDigestedValues;
			}
			//console.log("DEBUG "+g.name);
			//console.log(series.seriesValues);
			//series.seriesValues = undefined;
			var visibilityState = !('cell_type' in series) || (!stillLoading && !series.cell_type.termHidden);
			if(chart.library!==LIBRARY_NVD3) {
				series.series.visible = visibilityState;
				series.series.showInLegend = visibilityState;
			} else if(visibilityState) {
				series.series[series.seriesDest] = [];
			} else {
				series.series[series.seriesDest] = series.seriesDigestedValues;
			}
		});
		
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
	
	function redrawCharts(charts,doGenerate,stillLoading) {
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
	
	var getGeneLayout = function(localScope,rangeData) {
		if(localScope===undefined || rangeData.regionLayout!==undefined) {
			return localScope;
		}
		rangeData.regionLayout = null;
			
		var deferred = $q.defer();
		var nestedShouldQuery = genShouldQuery(rangeData.range,'coordinates');
		
		localScope.searchButtonText = FETCHING_LABEL;
		es.search({
			size: 10000,
			index: 'external',
			type: 'external.features',
			body: {
				query: {
					filtered: {
						filter: {
							bool: {
								must: [
									{
										terms: {
											feature: REGION_FEATURES
										},
									},
									nestedShouldQuery,
								]
							}
						}
					}
				},
			}
		}, function(err, resp) {
			if(err) {
				deferred.reject(err);
			} else if(resp.hits!==undefined) {
				rangeData.regionLayout = {};
				var range = rangeData.range;
				var rangeStr = range.chr+":"+range.start+"-"+range.end;
				
				// Now, we have the region layout and features
				var regionFeature = {};
				var found = '';
				var isReactome = ( localScope.currentQueryType === 'reaction' || localScope.currentQueryType === 'pathway');
				resp.hits.hits.forEach(function(feature) {
					var featureRegion = feature._source;
					var dest = featureRegion.feature;
					if(!(dest in rangeData.regionLayout)) {
						rangeData.regionLayout[dest] = [];
					}
					
					// Saving for later processing
					rangeData.regionLayout[dest].push(featureRegion);
					
					// Getting a understandable label
					featureRegion.label = chooseLabelFromSymbols(featureRegion.symbol);
					
					var uri = (dest in SEARCH_URIS) ? SEARCH_URIS[dest] : DEFAULT_SEARCH_URI;
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
					found = "Region <a href='"+REGION_SEARCH_URI+rangeStr+"' target='_blank'>chr"+rangeStr+"</a> overlaps "+found;
				} else {
					found = 'No gene or transcript in this region';
				}
				rangeData.found = found;
				
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
				
				// So, we can prepare the charts
				GRAPHS.forEach(function(gData) {
					var chart;
					
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
										noData: "Fetching "+gData.noData+" from "+rangeStr,
										showLegend: false,
										transitionDuration: 0,
										xAxis: {
											axisLabel: 'Coordinates (at chromosome '+range.chr+')'
										},
										yAxis: {
											axisLabel: gData.yAxisLabel,
											tickFormat: d3.format('.3g')
										}
									},
									title: {
										text: gData.title
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
										text: gData.title,
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
										text: gData.title,
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
										},
										plotOptions: {
											series: {
												animation: false
											}
										},
										exporting: HighchartsCommonExportingOptions,
									},
									title: {
										text: gData.title
									},
									xAxis: {
										title: {
											text: 'Ensembl Ids (at '+rangeStr+')'
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
										},
										plotOptions: {
											series: {
												animation: false
											}
										},
										exporting: HighchartsCommonExportingOptions,
									},
									title: {
										text: gData.title
									},
									xAxis: {
										title: {
											text: 'Coordinates (at '+rangeStr+')'
										},
										min: range.start,
										max: range.end,
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
					chart.regionFeature = regionFeature;
					chart.allData = [];
					chart.bpSideData = {
						sampleToIndex: {},
					};
					chart.title = gData.title;

					rangeData.charts.push(chart);
					rangeData[gData.name] = chart;
				});
				
				deferred.resolve(localScope);
			} else {
				deferred.reject(err);
			}
		});
		
		return deferred.promise;
	};
	
	var getChartData = function(localScope,rangeData) {
		var deferred = $q.defer();
		var shouldQuery = genShouldQuery(rangeData.range);
		var range_start = rangeData.range.start;
		var range_end = rangeData.range.end;
		
		var total = 0;
		//var totalPoints = 0;
		localScope.searchButtonText = FETCHING_LABEL;
		
		var scrolled = false;
		es.search({
			size: 10000,
			index: 'primary',
			scroll: '60s',
			body: {
				query: {
					filtered: {
						filter: {
							bool: {
								should: shouldQuery
							}
						}
					}
				},
				// With this sort, sent data compresses better
				sort: [
					{
						chromosome_start: {
							order: "asc"
						}
					}
				]
			}
		}, function getMoreChartDataUntilDone(err, resp) {
			if(resp.hits!==undefined) {
				resp.hits.hits.forEach(function(segment) {
					var analysis_id = segment._source.analysis_id;
					if(analysis_id in localScope.analysesHash) {
						var analysis = localScope.analysesHash[analysis_id];
						var meanSeriesId = analysis.meanSeries;
						
						var seriesId = analysis.cell_type.o_uri;
						
						var value;
						var payload;
						switch(meanSeriesId) {
							case PDNA_NARROW_SERIES:
								value = segment._source.log10_qvalue;
								break;
							case PDNA_BROAD_SERIES:
								value = segment._source.log10_qvalue;
								break;
							case EXP_ANY_SERIES:
								switch(segment._type) {
									case EXPG_CONCEPT:
										value = segment._source.FPKM;
										meanSeriesId = EXPG_SERIES;
										payload = segment._source.gene_stable_id;
										break;
									case EXPT_CONCEPT:
										value = segment._source.FPKM;
										meanSeriesId = EXPT_SERIES;
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
						}
						
						if(meanSeriesId in SeriesToChart) {
							var chartId = SeriesToChart[meanSeriesId];
							
							if(chartId in rangeData) {
								var graph = rangeData[chartId];
								
								var meanSeriesValues;
								if(meanSeriesId in graph.bpSideData.sampleToIndex) {
									meanSeriesValues = graph.bpSideData.sampleToIndex[meanSeriesId];
								} else {
									meanSeriesValues = [];
									var meanSeries;
									
									switch(graph.type) {
										case GRAPH_TYPE_STEP_CHARTJS:
											meanSeries = {
												seriesValues: meanSeriesValues,
												seriesGenerator: genMeanSeries,
												seriesDest: 'data',
												series: {
													label: localScope.AVG_SERIES_COLORS[meanSeriesId].name,
													strokeColor: localScope.AVG_SERIES_COLORS[meanSeriesId].color
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
													name: localScope.AVG_SERIES_COLORS[meanSeriesId].name,
													color: localScope.AVG_SERIES_COLORS[meanSeriesId].color
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
													name: localScope.AVG_SERIES_COLORS[meanSeriesId].name,
													color: localScope.AVG_SERIES_COLORS[meanSeriesId].color
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
													name: localScope.AVG_SERIES_COLORS[meanSeriesId].name,
													color: localScope.AVG_SERIES_COLORS[meanSeriesId].color,
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
													key: localScope.AVG_SERIES_COLORS[meanSeriesId].name,
													color: localScope.AVG_SERIES_COLORS[meanSeriesId].color
												}
											};
											graph.data.push(meanSeries.series);
											break;
									}
									meanSeries.series[meanSeries.seriesDest] = [];
									graph.bpSideData.sampleToIndex[meanSeriesId] = meanSeriesValues;
									graph.allData.push(meanSeries);
								}
								
								var seriesValues;
								if(seriesId in graph.bpSideData.sampleToIndex) {
									seriesValues = graph.bpSideData.sampleToIndex[seriesId];
								} else {
									seriesValues = [];
									var series;
									
									// We need this shared reference
									var cell_type = rangeData.termNodesHash[analysis.cell_type.o_uri];
									// and signal this cell_type
									cell_type.wasSeen = true;
										
									switch(graph.type) {
										case GRAPH_TYPE_STEP_CHARTJS:
											series = {
												seriesValues: seriesValues,
												seriesGenerator: genMeanSeries,
												seriesDest: 'data',
												series: {
													label: analysis.cell_type.name,
													strokeColor: analysis.cell_type.color
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
													name: analysis.cell_type.name,
													color: analysis.cell_type.color
												}
											};
											graph.options.data.push(series.series);
											break;
										case GRAPH_TYPE_BOXPLOT_HIGHCHARTS:
											series = {
												seriesValues: seriesValues,
												seriesGenerator: genBoxPlotSeries,
												seriesDest: 'data',
												cell_type: cell_type,
												series: {
													name: analysis.cell_type.name,
													color: analysis.cell_type.color
												}
											};
											graph.options.series.push(series.series);
											break;
										case GRAPH_TYPE_STEP_HIGHCHARTS:
											series = {
												seriesValues: seriesValues,
												seriesGenerator: genMeanSeriesHighcharts,
												seriesDest: 'data',
												cell_type: cell_type,
												series: {
													name: analysis.cell_type.name,
													color: analysis.cell_type.color,
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
											graph.options.series.push(series.series);
											break;
										case GRAPH_TYPE_STEP_NVD3:
											series = {
												seriesValues: seriesValues,
												seriesGenerator: genMeanSeries,
												seriesDest: 'values',
												cell_type: cell_type,
												series: {
													key: analysis.cell_type.name,
													color: analysis.cell_type.color
												}
											};
											graph.data.push(series.series);
											break;
									}
									series.series[series.seriesDest] = [];
									graph.bpSideData.sampleToIndex[seriesId] = seriesValues;
									graph.allData.push(series);
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
								meanSeriesValues.push(sDataS);
								seriesValues.push(sDataS);
							}
						}
						// totalPoints += segment._source.chromosome_end - segment._source.chromosome_start + 1;
					//} else {
						// Ignoring what we cannot process
					}
				});
				total += resp.hits.hits.length;
				
				// Now, updating the graphs
				localScope.searchButtonText = PLOTTING_LABEL;
				//var xRange = [rangeData.range.start,rangeData.range.end];
				
				// Re-drawing charts
				var stillLoading = resp.hits.total > total;
				redrawCharts(rangeData.charts,true,stillLoading);
				
				// Is there any more data?
				if(stillLoading) {
					var percent = 100.0 * total / resp.hits.total;
					
					localScope.searchButtonText = "Loaded "+percent.toPrecision(2)+'%';
					
					//console.log("Hay "+total+' de '+resp.hits.total);
					scrolled = true;
					es.scroll({
						index: 'primary',
						scrollId: resp._scroll_id,
						scroll: '60s'
					}, getMoreChartDataUntilDone);
				} else {
					if(scrolled) {
						es.clearScroll({scrollId: resp._scroll_id});
					}
					
					//console.log("Total: "+total+"; points: "+totalPoints);
					
					//console.log('All data ('+total+') was fetched');
					if(resp.hits.total > 0) {
						deferred.resolve(localScope);
					} else {
						deferred.reject('No data returned');
					}
				}
			} else {
				deferred.reject(err);
			}
		});
		
		return deferred.promise;
	};
	
	var getSamples = function(localScope) {
		if(localScope.samples.length!==0) {
			return localScope;
		}
		
		localScope.samples = [];
		localScope.samplesOnt = [];
		var deferred = $q.defer();
		es.search({
			index: 'sample-tracking-data',
			type: 'sdata.sample',
			size: 100000,
			body:{},
		},function(err,resp){
			if(typeof(resp.hits.hits) !== undefined) {
				var data;
				
				switch(localScope.subtotals.library) {
					case LIBRARY_NVD3:
						data = localScope.subtotals.data;
						break;
					case LIBRARY_HIGHCHARTS:
						data = localScope.subtotals.options.series[0].data;
						break;
				}
				
				resp.hits.hits.forEach(function(d) {
					var s = {};
					s.analyzed_sample_type_other = d._source.analyzed_sample_type_other;
					s.sample_id = d._source.sample_id;
					s.ontology = d._source.purified_cell_type;
					s.markers = d._source.markers;
					s.experiments = [];
					localScope.labs.forEach(function(d){
						if(d.sample_id == s.sample_id){
							s.experiments.push(d);
						}
					});
					localScope.samplesOnt.push(s.ontology);
					localScope.samples.push(s);
				});
				
				var numSamples = localScope.samples.length;
				
				data.push(['Samples', numSamples]);
				
				//console.log(localScope.samples);
				deferred.resolve(localScope);
			} else {
				return deferred.reject(err);
			}
		});
		return deferred.promise;
	};

	var getDonors = function(localScope) {
		if(localScope.donors.length!==0) {
			return localScope;
		}
		
		localScope.donors = [];
		return es.search({
			index: 'sample-tracking-data',
			type: 'sdata.donor',
			size: 100000,
			body:{},
		}).then(function(resp){
			if(typeof(resp.hits.hits) !== undefined) {
				var subtotalsData = [];
				
				// Very important, so we are managing the same array
				switch(localScope.subtotals.library) {
					case LIBRARY_NVD3:
						localScope.subtotals.data = subtotalsData;
						break;
					case LIBRARY_HIGHCHARTS:
						localScope.subtotals.options.series[0].data = subtotalsData;
						break;
				}
				
				var numDonors = 0;
				var numPooledDonors = 0;
				var numCellularLines = 0;
				var numOther = 0;
				resp.hits.hits.forEach(function(d) {
					switch(d._source.donor_kind) {
						case 'd':
							numDonors++;
							break;
						case 'p':
							numPooledDonors++;
							break;
						case 'c':
							numCellularLines++;
							break;
						default:
							numOther++;
					}
					localScope.donors.push(d._source);
				});
				subtotalsData.push(
					['Donors', numDonors],
					['Cellular Lines', numCellularLines],
					['Pooled Donors', numPooledDonors]
				);
				localScope.numCellularLines = numCellularLines;
				
				if(numOther>0) {
					subtotalsData.push(['Other kind of donors', numOther]);
				}
				
				//console.log(localScope.donors);
			}
			
			return localScope;
		});
	};
	
	var getSpecimens = function(localScope) {
		if(localScope.specimens.length!==0) {
			return localScope;
		}
		
		return es.search({
			index: 'sample-tracking-data',
			type: 'sdata.specimen',
			size: 100000,
			body:{},
		}).then(function(resp){
			if(typeof(resp.hits.hits) !== undefined) {
				resp.hits.hits.forEach(function(d) {
					localScope.specimens.push(d._source);
				});
				//console.log(localScope.specimens);
			}
			
			return localScope;
		});
	};

	var getHistoneStatsData = function(lab_experiment,stats,range){
		var exp = 0;
		var value = 0.0;
		var expB = 0;
		var valueB = 0.0;
		var histone = lab_experiment.histone;
		
		lab_experiment.analyses.forEach(function(analysis) {
			var analysis_id = analysis.analysis_id;
			var theValue = 0.0;
			var theExp = 0;
			if(analysis_id in stats.chipSeqHash) {
				var a = stats.chipSeqHash[analysis_id];
				theValue += parseFloat(a.peak_size.value);
				theExp++;
			}
			if(analysis.isBroad) {
				expB += theExp;
				valueB += theValue;
			} else {
				exp += theExp;
				value += theValue;
			}
		});
		
		// This can be a bit incorrect for pathways...
		if(exp > 0 || expB > 0) {
			var end = range.end+chipSeqWindow;
			var start = range.start-chipSeqWindow;
			// Corner case
			if(start < 1) {
				start=1;
			}
			var region = end - start + 1;
		  
			// console.log(region);
			if(exp > 0) {
				//console.log(region);
				value = (value/region)*100.0;
			}
			if(expB > 0) {
				valueB = (valueB/region)*100.0;
			}
		}
		return {notBroad:value, broad:valueB}; 
	};
	
	var populateBasicTree = function(o,localScope,rangeData,isDetailed) {
		var numNodes = 1;
		// First, the children
		if(o.children) {
			var termNodesHash = rangeData.termNodesHash;
			var children = [];
			var changed = false;
			
			// First, replace those nodes which are termNodes
			o.children.forEach(function(child) {
				if(child.o_uri && (child.o_uri in termNodesHash)) {
					child = termNodesHash[child.o_uri];
					changed = true;
				}
				
				children.push(child);
			});
			
			if(changed) {
				o.children = children;
			}
			
			// Then, populate them!
			o.children.forEach(function(child) {
				numNodes += populateBasicTree(child,localScope,rangeData,isDetailed);
			});
		} else {
			o.children = [];
		}
		
		// And now, me!
		if(o.o_uri) {
			var range = rangeData.range;
			var stats = rangeData.stats;
			
			var aggregated_statistics = [];
			var childrens = [];
			localScope.experimentLabels.forEach(function() {
				aggregated_statistics.push(0.0);
				childrens.push(0);
			});
			localScope.samples.forEach(function(s) {
				if(s.ontology == o.o_uri) {
					o.analyzed = true;
					var statistics = localScope.experimentLabels.map(function() {
						return 0.0;
					});
					s.experiments.forEach(function(lab_experiment){
						//console.log(d);
						var theStat = 0.0;
						switch(lab_experiment.experiment_type) {
							case 'DNA Methylation':
								var methExp = 0;
								lab_experiment.analyses.forEach(function(analysis) {
									var v = analysis.analysis_id;
									if(v in stats.bisulfiteSeqHash) {
										var a = stats.bisulfiteSeqHash[v];
										theStat += a.stats_meth_level.avg;
										methExp++;
									}
								});
								if(methExp > 0.0){
									theStat = theStat/methExp;
									childrens[0]++;
								} else {
									theStat = NaN;
								}
								statistics[0] = theStat;
								break;
							case 'Chromatin Accessibility':
								var dnaseSeqExp = 0;
								lab_experiment.analyses.forEach(function(analysis) {
									var v = analysis.analysis_id;
									if(v in stats.dnaseSeqHash) {
										var a = stats.dnaseSeqHash[v];
										theStat += a.peak_size.value;
										dnaseSeqExp++;
									}
								});
								if(dnaseSeqExp > 0) {
									var region = range.end - range.start + 1;
									theStat = theStat/region;
									childrens[1]++;
								} else {
									theStat = NaN;
								}
								statistics[1] = theStat;
								break;
							case 'mRNA-seq':
								// Expression at Gene and Transcript levels
								var rnaSeqExpG = 0;
								var rnaSeqExpT = 0;
								var theStatT = 0.0;
								
								lab_experiment.analyses.forEach(function(analysis) {
									var v = analysis.analysis_id;
									if(v in stats.rnaSeqGHash) {
										var a = stats.rnaSeqGHash[v];
										theStat += a.stats_normalized_read_count.avg;
										rnaSeqExpG++;
									}
									if(v in stats.rnaSeqTHash) {
										var b = stats.rnaSeqTHash[v];
										theStatT += b.stats_normalized_read_count.avg;
										rnaSeqExpT++;
									}
								});
								if(rnaSeqExpG > 0) {
									theStat = theStat/rnaSeqExpG;
									childrens[2]++;
								} else {
									theStat = NaN;
								}
								statistics[2] = theStat;
								
								if(rnaSeqExpT > 0) {
									theStatT = theStatT/rnaSeqExpT;
									childrens[3]++;
								} else {
									theStatT = NaN;
								}
								statistics[3] = theStatT;
								break;
							default:
								if(lab_experiment.experiment_type.indexOf('Histone ')===0) {
									if(lab_experiment.histone!==undefined) {
										var histone = lab_experiment.histone;
										var expIdx = histone.histoneIndex;
										
										var histoneStats = getHistoneStatsData(lab_experiment,stats,range);
										
										statistics[expIdx] = histoneStats.broad;
										if(statistics[expIdx]>0) {
											childrens[expIdx]++;
										//} else {
										//	statistics[expIdx] = NaN;
										}
											
										if(CSpeakSplit) {
											statistics[expIdx+1] = histoneStats.notBroad;
											if(statistics[expIdx+1]>0) {
												childrens[expIdx+1]++;
											//} else {
											//	statistics[expIdx+1] = NaN;
											}
										}
									} else {
										console.log("Unmapped histone "+lab_experiment.experiment_type);
									}
								} else {
									console.log("Unmanaged experiment type: "+lab_experiment.experiment_type);
								}
								break;
						}
					});
					
					// Translating to the right units
					if(!isNaN(statistics[0]) && statistics[0]!==-1) {
						statistics[0] *= 100.0;
					}
					
					if(!isNaN(statistics[1]) && statistics[1]!==-1) {
						statistics[1] *= 100.0;
					}
					
					statistics.forEach(function(stat,i) {
						if(!isNaN(stat) && stat!==-1) {
							aggregated_statistics[i] += stat;
						}
					});
					
					if(isDetailed){
						var newNode = {
							expData: statistics,
							name: s.sample_id,
							experimentsCount: s.experiments.length
						};
						
						o.children.push(newNode);
						numNodes++;
					}
				}
			});
			if(! o.expData) {
				//console.log(o[i]);
				var expData = [];
				aggregated_statistics.forEach(function(stat,i) {
					// Storing -1 for uninitialized cases
					expData.push((childrens[i] > 0)?(stat/childrens[i]):NaN);
				});
				o.expData = expData;
			}
		}
		return numNodes;
	};

	var initTree = function(localScope,rangeData){
		if(localScope===undefined) {
			return undefined;
		}
		
		console.log("initializing tree");
		
		var lastSearchMode = localScope.display;
		if(lastSearchMode!=='none') {
			var isDetailed = lastSearchMode==='detailed';
			
			var clonedTreeData = angular.copy(localScope.fetchedTreeData);
			rangeData.treedata = [];
			clonedTreeData.forEach(function(cloned) {
				var numNodes = populateBasicTree(cloned,localScope,rangeData,isDetailed);
				rangeData.treedata.push({root: cloned, numNodes: numNodes, depth:(isDetailed?localScope.depth+1:localScope.depth), experiments: localScope.experimentLabels});
			});
		}
	};

	var DEFAULT_SEARCH_URI = 'http://www.ensembl.org/Human/Search/Results?site=ensembl;facet_species=Human;q=';
	var REGION_SEARCH_URI = 'http://www.ensembl.org/Homo_sapiens/Location/View?r=';
	var SEARCH_URIS = {
		gene: 'http://www.ensembl.org/Homo_sapiens/Gene/Summary?db=core&g=',
		pathway: 'http://www.reactome.org/content/detail/',
		transcript: 'http://www.ensembl.org/Homo_sapiens/Transcript/Summary?db=core&t=',
		reaction: 'http://www.reactome.org/content/detail/',
		region: REGION_SEARCH_URI,
	};
	
	var updateChromosomes = function(localScope) {
		var tooMuch = localScope.rangeQuery.some(function(range) {
			return ((range.start>=range.end) || (range.end - range.start) > CHR_SEGMENT_LIMIT);
		});
		
		if(tooMuch) {
			return false;
		}

		// First, let's update the query string
		var qString = ( localScope.currentQueryType !== 'range' ) ? localScope.currentQueryType + ':' + localScope.currentQuery : localScope.currentQuery;
		$location.search({q: qString});
		
		var regions = '';
		//localScope.chromosomes.forEach(function(d){
		//	d.c = "chr";
		//});
		// Now, let's prepare the backbones!
		localScope.graphData = [];
		localScope.rangeQuery.forEach(function(range,i) {
			console.log('Updating chromosome data '+range.chr);
			//localScope.chromosomes.forEach(function(d){
			//	if(d.n == range.chr) {
			//		d.c = "chr_active";
			//	}
			//});
			
			if(i>0) {
				regions += ' ; ';
			}
			var rangeStr = range.chr+":"+range.start+"-"+range.end;
			
			regions += "<a href='"+REGION_SEARCH_URI+rangeStr+"' target='_blank'>chr"+rangeStr+"</a>";
			
			// Preparing the charts!
			var termNodes = angular.copy(localScope.termNodes);
			var termNodesHash = {};
			termNodes.forEach(function(termNode) {
				termNodesHash[termNode.o_uri] = termNode;
			});
			var rangeData = {
				toBeFetched: true,
				fetching: false,
				heading: (range.label !== undefined) ? range.label : ('Region ' + range.chr + ':' + range.start + '-' + range.end),
				range: range,
				treedata: null,
				termNodes: termNodes,
				termNodesHash: termNodesHash,
				charts: [],
				stats: {
					bisulfiteSeq: [],
					rnaSeqG: [],
					rnaSeqT: [],
					chipSeq: [],
					dnaseSeq: [],
				},
				gChro: localScope.unknownChromosome,
			};
			
			localScope.chromosomes.some(function(d){
				if(d.n == range.chr) {
					rangeData.gChro = d;
					return true;
				}
				return false;
			});
			
			localScope.graphData.push(rangeData);
		});
		localScope.found = "Query '"+localScope.currentQuery+"' displaying information from ";
		if(localScope.currentQueryType !== 'range') {
			var uri = (localScope.currentQueryType in SEARCH_URIS) ? SEARCH_URIS[localScope.currentQueryType] : DEFAULT_SEARCH_URI;
			var featureLabel = localScope.featureLabel !== null ? localScope.featureLabel : localScope.currentQuery;
			localScope.found += localScope.currentQueryType+" <a href='"+uri+localScope.ensemblGeneId+"' target='_blank'>"+featureLabel+" ["+localScope.ensemblGeneId+"]</a>, ";
		}
		localScope.found += "region"+((localScope.rangeQuery.length > 1)?'s':'')+": "+regions;
		
		return true;
	};
	
	var DEFAULT_QUERY_TYPES = ["gene","pathway","reaction"];
	
	var getRanges = function(localScope){
		var deferred = $q.defer();
		var queryTypes = localScope.currentQueryType!==undefined ? [localScope.currentQueryType] : DEFAULT_QUERY_TYPES;
		es.search({
			index: 'external',
			type: 'external.features',
			size: 1000,
			body: {
				query:{
					filtered:{
						query:{
							match: {
								symbol: localScope.currentQuery 
							}
						},
						filter: {
							terms: {
								feature: queryTypes
							}
						}
					}
				}
			}
		},function(err,resp){
			if(typeof(resp.hits.hits) !== undefined){
				if(resp.hits.hits.length > 0) {
					localScope.ensemblGeneId = resp.hits.hits[0]._source.feature_cluster_id;
					localScope.currentQueryType = resp.hits.hits[0]._source.feature;
					
					var featureLabel = localScope.featureLabel = chooseLabelFromSymbols(resp.hits.hits[0]._source.symbol);
					var isReactome = ( localScope.currentQueryType === 'reaction' || localScope.currentQueryType === 'pathway');
					resp.hits.hits[0]._source.coordinates.forEach(function(range) {
						var theRange = { chr: range.chromosome , start: range.chromosome_start, end: range.chromosome_end};
						
						theRange.label = isReactome ? range.feature_id : featureLabel;
						localScope.rangeQuery.push(theRange);
					});
					if(updateChromosomes(localScope)) {
						deferred.resolve(localScope);
					} else {
						openModal('Query rejected (too large)','Chromosomical range of query '+localScope.currentQuery+' is larger than '+CHR_SEGMENT_LIMIT+"bp",function() {
							localScope.query='';
							deferred.reject('Too large query '+localScope.currentQuery);
						});
					}
				} else {
					openModal('No results','Query '+localScope.currentQuery+' did not match any gene or pathway',function() {
						localScope.query='';
						deferred.reject('No results for '+localScope.currentQuery);
					});
				}
			} else {
				deferred.reject(err);
			}
		});
		return deferred.promise;
	};
    
	var fetchCellTerms = function(localScope) {
		if(localScope.fetchedTreeData!==undefined) {
			return localScope;
		}
		
		
		var deferred = $q.defer();
        
		// Let's calculate the unique terms
		var theUris=[];
		var theUrisHash = {};
		localScope.samplesOnt.forEach(function(d) {
			if(!(d in theUrisHash)) {
				theUris.push(d);
				theUrisHash[d]=1;
			}
		});
		
		/*
		console.log("URIs");
		console.log(theUris);
		*/
		// Freeing the variable, as it is not needed, can cost time
		// theUrisHash=undefined;
        
		es.search({
			index: 'meta-model',
			type: 'cvterm',
			size: 10000,
			body: {
				query: {
					filtered: {
						query: {
							match_all: {}
						},
						filter: {
							and: {
								filters: [{
									//term: {
									//	ont: 'cv:CellOntology'
									//}
									terms: {
										ont: ['cv:CellOntology','cv:EFO','cv:CellLineOntology']
									}
								},{
									terms: {
										alt_id: theUris
									}
								}]
							}
						}
					}
				},
				fields: ['term','ancestors']
			}
		}, function(err,resp) {
			if(resp.hits.total > 0) {
				// Let's gather all the distinct terms
				var theTerms = [];
				var theTermsHash = {};
				
				var theExtendedTerms = [];
				var theExtendedTermsHash = {};
				
				var maxDepth=0;
				resp.hits.hits.forEach(function(v) {
					var d = v.fields;
					var theTerm = d.term[0];
					if(!(theTerm in theTermsHash)) {
						theTerms.push(theTerm);
						theTermsHash[theTerm] = null;

						if(!(theTerm in theExtendedTermsHash)) {
							theExtendedTerms.push(theTerm);
							theExtendedTermsHash[theTerm]=null;
						}
						// There could be terms without ancestors
						var depth = 1;
						if(d.ancestors) {
							depth += d.ancestors.length;

							d.ancestors.forEach(function(term) {
								if(!(term in theExtendedTermsHash)) {
									theExtendedTerms.push(term);
									theExtendedTermsHash[term]=null;
								}
							});
						}
						if(depth > maxDepth) {
							maxDepth = depth;
						}
					}
				});
				localScope.depth = maxDepth;
				
				/*
				console.log("Terms");
				console.log(theTerms);
				*/
				
				// Now, send the query to fetch all of them
				es.search({
					index: 'meta-model',
					type: 'cvterm',
					size: 10000,
					body: {
						query: {
							filtered: {
								query: {
									match_all: {}
								},
								filter: {
									terms: {
										term: theExtendedTerms
									}
								}
							}
						},
						fields: ['term','term_uri','name','parents','ont']
					}
				}, function(err, resp) {
					if(resp.hits.total > 0) {
						// And rebuild the tree!
						var fetchedNodes = {};
						var treeNodes = {};
						
						var termNodes = [];
						var termNodesOnce = {};
						var termNodesHash = {};
						
						// Roots are the nodes with no parent
						var roots = [];
						
						// First pass, the nodes
						var rawnodes = resp.hits.hits.map(function(v) {
							var n = v.fields;
							var treeNode = {
								name: n.name[0],
								o: n.term[0],
								o_uri: n.term_uri[0],
								ont: n.ont[0],
							};
							
							treeNodes[treeNode.o] = treeNode;
							fetchedNodes[treeNode.o] = n;
							
							return treeNode;
						});
						
						// Sorting by ontology, so we discard cv:EFO terms in case they are already defined in cv:CellOntology or cv:CellLineOntology
						rawnodes.sort(function(a,b) {
							return a.ont.localeCompare(b.ont);
						});
						
						rawnodes.forEach(function(treeNode) {
							// This is needed later
							if(treeNode.o in theTermsHash) {
								if(!(treeNode.o in termNodesOnce)) {
									termNodesOnce[treeNode.o]=null;
									termNodes.push(treeNode);
									termNodesHash[treeNode.o_uri] = treeNode;
								}
							}
						});
						
						rawnodes = undefined;
						
						// Giving it a reproducible order
						termNodes.sort(function(a,b) {
							return a.o.localeCompare(b.o);
						});
						
						/*
						console.log("Extended terms");
						console.log(theExtendedTerms);
						console.log("Fetched Nodes");
						console.log(fetchedNodes);
						console.log("Tree Nodes");
						console.log(treeNodes);
						*/
						
						// Second pass, the parent-child relationships
						for(var theTerm in fetchedNodes) {
							var n = fetchedNodes[theTerm];
							var tn = treeNodes[theTerm];
							if(! tn.visited) {
								if(n.parents) {
									var added = 0;
									n.parents.forEach(function(p) {
										// Skipping multi-parenting cases, to artificially prune the DAG into a tree
										if(p in treeNodes) {
											var ptn = treeNodes[p];
											if(added===0) {
												if(! ptn.children) {
													ptn.children = [];
												}
												
												ptn.children.push(tn);
											} else {
												if(! ptn.links) {
													ptn.links = [];
												}
												
												ptn.links.push(tn);
											}
											added++;
										}
									});
								} else {
									// This is a root
									roots.push(tn);
								}
								tn.visited = true;
							}
						}
						
						// Due the artificial translation into a tree, there are many dead branches
						// Now, let's see the involved nodes
						var nowNodes = [].concat(roots);
						var leafDeadNodes = [];
						while(nowNodes.length > 0) {
						 	var nextNodes = [];
						 	nowNodes.forEach(function(t) {
						 		if(t.children && t.children.length > 0) {
						 			nextNodes = nextNodes.concat(t.children);
						 		} else if(!(t.o in theTermsHash)) {
									leafDeadNodes.push(t);
								}
						 	});
						 	nowNodes = nextNodes;
						}
						
						// And let's prune the tree
						var rounds = 0;
						while(leafDeadNodes.length > 0) {
							// Debugging
							/*
							var lonames = [];
							var loterms = [];
							leafDeadNodes.forEach(function(lo) {
								lonames.push(lo.name);
								loterms.push(lo.o);
							});
							console.log("Round "+rounds);
							console.log(lonames);
							console.log(loterms);
							*/
							rounds++;
                                                        
                                                        // Now, remove the dead nodes
							var nextDeadNodes = [];
							leafDeadNodes.forEach(function(lo) {
								var l = fetchedNodes[lo.o];
								l.parents.some(function(po) {
									if(po in treeNodes) {
										var p=treeNodes[po];
										if(p.children && p.children.length>0) {
											var pl=-1;
											p.children.some(function(child,iCh) {
												if(child.o==lo.o) {
													pl=iCh;
													return true;
												}
												return false;
											});
											if(pl!==-1) {
												p.children.splice(pl,1);
												if(!(p.o in theTermsHash) && p.children.length===0) {
													delete(p.children);
													nextDeadNodes.push(p);
												}
											/*
											} else {
												console.log("Raro "+lo.o);
												console.log(p);
											*/
											}
										}
										return true;
									}
									return false;
								});
							});
							leafDeadNodes = nextDeadNodes;
						}
						
						// Sort by root uri
						localScope.fetchedTreeData = roots.sort(function(a,b) { return a.o_uri.localeCompare(b.o_uri); });
						
						// Preparing the color range
						var cc = d3.scale.category20();
						
						// Coloring the cell types
						termNodes.forEach(function(termNode,i) {
							var theColor = cc(i);
							termNode.color = theColor;
							termNode.termHidden = false;
						});
						
						// This is needed for the data model
						localScope.termNodes = termNodes;
						
						// And now, the colors for the AVG_SERIES
						localScope.AVG_SERIES = angular.copy(AVG_SERIES);
						var AVG_SERIES_COLORS = {};
						localScope.AVG_SERIES.forEach(function(meanSeriesDesc, i) {
							meanSeriesDesc.color = cc(i+termNodes.length);
							AVG_SERIES_COLORS[meanSeriesDesc.seriesId] = meanSeriesDesc;
						});
						
						localScope.AVG_SERIES_COLORS = AVG_SERIES_COLORS;
						
						// At last, linking analysis to their corresponding cell types and the mean series
						localScope.samples.forEach(function(sample) {
							var term = termNodesHash[sample.ontology];
							sample.experiments.forEach(function(experiment) {
								experiment.analyses.forEach(function(analysis) {
									var meanSeries;
									switch(analysis._type) {
										case PDNA_CONCEPT_M:
											var isNarrow = analysis.analysis_id.indexOf('_broad_')===-1;
											if(isNarrow) {
												meanSeries = PDNA_NARROW_SERIES;
											} else {
												meanSeries = PDNA_BROAD_SERIES;
											}
											break;
										case EXP_CONCEPT_M:
											meanSeries = EXP_ANY_SERIES;	// It is truly resolved later to EXPG_SERIES or EXPT_SERIES
											break;
										case DLAT_CONCEPT_M:
											switch(analysis.mr_type) {
												case 'hyper':
													meanSeries = DLAT_HYPER_SERIES;
													break;
												case 'hypo':
													meanSeries = DLAT_HYPO_SERIES;
													break;
											}
											break;
										case RREG_CONCEPT_M:
											meanSeries = RREG_SERIES;
											break;
									}
									//if(!meanSeries) {
									//	console.log("BUG "+analysis.analysis_id+' ('+analysis._type+')');
									//}
									analysis.meanSeries = meanSeries;
									analysis.cell_type = term;
								});
							});
						});
						
						deferred.resolve(localScope);
					} else {
						return deferred.reject(err);
					}
				});
			} else {
				return deferred.reject(err);
			}
		});
		return deferred.promise;
	};

	var topFeatures = {
		'gene': null,
		'reaction': null,
		'pathway': null
	};

	var my_feature_ranking = {
		gene: 1,
		pathway: 2,
		transcript: 3,
		exon: 4,
		reaction: 5,
		CDS: 6,
		UTR: 7,
		start_codon: 8,
		stop_codon: 9,
		Selenocysteine: 10
	};
	
	var preprocessQuery = function(localScope) {
		console.log('Running preprocessQuery');
		var deferred = $q.defer();
		var promise = deferred.promise;
		var acceptedUpdate=true;
		
		if(localScope.suggestedQuery) {
			localScope.ensemblGeneId = localScope.suggestedQuery.feature_cluster_id;
			localScope.currentQuery = localScope.suggestedQuery.term;
			localScope.currentQueryType = localScope.suggestedQuery.feature;
			if(!(localScope.suggestedQuery.feature in topFeatures)) {
				localScope.currentQueryType += ' from gene,';
			}
			var featureLabel = chooseLabelFromSymbols(localScope.suggestedQuery.symbols);
			var isReactome = ( localScope.currentQueryType === 'reaction' || localScope.currentQueryType === 'pathway');
			localScope.suggestedQuery.coordinates.forEach(function(range) {
				var theRange = { chr: range.chromosome , start: range.chromosome_start, end: range.chromosome_end };
				
				theRange.label = isReactome ? range.feature_id : featureLabel;
				localScope.rangeQuery.push(theRange);
			});
			acceptedUpdate = updateChromosomes(localScope);
		} else {
			var q = localScope.query.trim();
			var queryType;
			var colonPos = q.indexOf(':');
			var m;
			if(colonPos!==-1) {
				var possibleQueryType = q.substring(0,colonPos);
				if(possibleQueryType in my_feature_ranking) {
					queryType = possibleQueryType;
					q = q.substring(colonPos+1);
				} else {
					m = q.match('^(?:chr)?([^:-]+):([1-9][0-9]*)-([1-9][0-9]*)$');
				}
			}
			
			//range query
			localScope.currentQuery = q;
			if(m) {
				if(m[1] === 'M') {
					// Normalizing mitochondrial chromosome name
					m[1] = 'MT';
				}
				localScope.rangeQuery.push({chr: m[1], start: m[2], end: m[3]});
				localScope.currentQueryType = 'range';
				// localScope.rangeQuery.chr   = m[1];
				// localScope.rangeQuery.start = m[2];
				// localScope.rangeQuery.end   = m[3];
				// localScope.found = "Displaying information from region: chr"+localScope.rangeQuery[0].chr+":"+localScope.rangeQuery[0].start+"-"+localScope.rangeQuery[0].end;
				acceptedUpdate = updateChromosomes(localScope);
			} else {
				localScope.currentQueryType = queryType;
				promise = promise.then(getRanges);
			}
		}
		
		if(acceptedUpdate) {
			deferred.resolve(localScope);
		} else {
			openModal('Query rejected (too large)','Chromosomical range of query '+localScope.currentQuery+' is larger than '+CHR_SEGMENT_LIMIT+"bp",function() {
				localScope.query='';
				deferred.reject('Too large query '+localScope.currentQuery);
			});
		}
		
		return promise;
	};

    $scope.resultsSearch = [];
    
	$scope.search = function(theSuggest){
		if(!$scope.queryInProgress) {
			$scope.queryInProgress = true;
			$scope.found = "";
			$scope.suggestedQuery = theSuggest;
			$scope.resultsSearch = [];
			
			$scope.rangeQuery = [];
			$scope.ensemblGeneId = null;
			$scope.currentQuery = null;
			$scope.currentQueryType = null;
			$scope.featureLabel = null;
			
			$scope.searchButtonText = SEARCHING_LABEL;

			var deferred = $q.defer();
			var promise = deferred.promise;
			promise = promise.then(preprocessQuery)
				.then(launch(getGeneLayout),function(err) {
					openModal('Data error','Error while fetching gene layout');
					console.error('Gene layout');
					console.error(err);
				});
			
			deferred.resolve($scope);
		}
	};
	
	$scope.doReflow = function() {
		setTimeout(function() {
			$scope.$broadcast('highchartsng.reflow');
		},10);
	};
		
	$scope.doRefresh = function(rangeData) {
		if(rangeData.toBeFetched) {
			rangeData.fetching = true;
			rangeData.toBeFetched = false;
			
			$scope.queryInProgress = true;
			$scope.searchButtonText = SEARCHING_LABEL;
                        
			var deferred = $q.defer();
			var promise = deferred.promise;
			promise = promise
				.then(rangeLaunch(getGeneLayout,rangeData))
				.then(rangeLaunch(getChartData,rangeData), function(err) {
					openModal('Data error','Error while fetching gene layout');
					console.error('Gene layout');
					console.error(err);
				})
				// Either the browser or the server gets too stressed with this concurrent query
				//.then($q.all([launch(getWgbsData),launch(getRnaSeqGData),launch(getRnaSeqTData),launch(getChipSeqData),launch(getDnaseData)]))
				.then(rangeLaunch(getWgbsStatsData,rangeData), function(err) {
					if(typeof err === "string") {
						openModal(err,'There is no data stored for '+$scope.currentQuery);
					} else {
						openModal('Data error','Error while fetching chart data');
						console.error('Chart data');
						console.error(err);
					}
				})
				.then(rangeLaunch(getRnaSeqGStatsData,rangeData), function(err) {
					openModal('Data error','Error while computing WGBS stats');
					console.error('WGBS stats data');
					console.error(err);
				})
				.then(rangeLaunch(getRnaSeqTStatsData,rangeData), function(err) {
					openModal('Data error','Error while computing RNA-Seq (genes) stats');
					console.error('RNA-Seq gene stats data');
					console.error(err);
				})
				.then(rangeLaunch(getChipSeqStatsData,rangeData), function(err) {
					openModal('Data error','Error while computing RNA-Seq (transcripts) stats');
					console.error('RNA-Seq transcript stats data');
					console.error(err);
				})
				.then(rangeLaunch(getDnaseStatsData,rangeData), function(err) {
					openModal('Data error','Error while computing ChIP-Seq stats');
					console.error('ChIP-Seq stats data');
					console.error(err);
				})
				.then(rangeLaunch(initTree,rangeData), function(err) {
					openModal('Data error','Error while computing DNAse stats');
					console.error('DNAse stats data');
					console.error(err);
				}).
				catch(function(err) {
					openModal('Data error','Error while initializing stats tree');
					console.error('Stats tree');
					console.error(err);
				})
				.finally(function() {
					rangeData.fetching = false;
					$scope.queryInProgress = false;
					$scope.searchButtonText = SEARCH_LABEL;
				});
				 
			deferred.resolve($scope);
		}
		
		return '';
	};
	
	$scope.suggest = function() {
		if(!$scope.suggestInProgress) {
			$scope.resultsSearch = [];
			$scope.suggestedQuery = null;
			
			var query = $scope.query.trim().toLowerCase();
			var queryType;
			var colonPos = query.indexOf(':');
			if(colonPos!==-1) {
				queryType = query.substring(0,colonPos);
				query = query.substring(colonPos+1);
			}
			
			if(query.length >= 3 && (!queryType || (queryType in my_feature_ranking))) {
				$scope.suggestInProgress = true;
				var deferred = $q.defer();
				var promise = deferred.promise;
				promise.finally(function() {
					$scope.suggestInProgress = false;
				});
				
				//query = query.toLowerCase();
				var theFilter = {
					prefix: {
						symbol: query
					}
				};
				var sugLimit;
				if(queryType) {
					theFilter = {
						bool: {
							must: [
								{
									term: {
										feature: queryType
									}
								},
								theFilter
							]
						}
					};
					sugLimit = 20;
				} else {
					sugLimit = 4;
				}
				es.search({
					index: 'external',
					type: 'external.features',
					size: 5000,
					body: {
						query:{
							filtered: {
								query: {
									match_all: {}
								},
								filter: theFilter
							}
						},
					}
				},function(err,resp){
					var resultsSearch = [];
					
					resp.hits.hits.forEach(function(sug,i) {
						var theTerm;
						var theSecondTerm;
						var isFirst = 0;
						
						sug._source.symbol.forEach(function(term) {
							var termpos = term.toLowerCase().indexOf(query);
							if(termpos===0) {
								if(theTerm===undefined || term.length < theTerm.length) {
									theTerm = term;
								}
							} else if(termpos!==-1) {
								if(theSecondTerm===undefined || term.length < theSecondTerm.length) {
									theSecondTerm = term;
								}
							}
						});
						
						// A backup default
						if(theTerm===undefined) {
							if(theSecondTerm !== undefined) {
								isFirst = 1;
								theTerm = theSecondTerm;
							} else {
								isFirst = 2;
								theTerm = sug._source.symbol[0];
							}
						}
						var feature = sug._source.feature;
						var featureScore = (feature in my_feature_ranking) ? my_feature_ranking[feature] : 255;
						resultsSearch.push({term:theTerm, pos:i, isFirst: isFirst, fullTerm: theTerm+' ('+sug._source.symbol.join(", ")+')', id:sug._id, coordinates:sug._source.coordinates, feature:feature,featureScore:featureScore, feature_cluster_id:sug._source.feature_cluster_id, symbols: sug._source.symbol});
					});
					
					resultsSearch.sort(function(a,b) {
						var retval = a.featureScore - b.featureScore;
						if(retval===0) {
							retval = a.isFirst - b.isFirst;
							if(retval===0) {
								retval = a.term.length - b.term.length;
								if(retval===0) {
									retval = a.term.localeCompare(b.term);
								}
							}
						}
						
						return retval;
					});
					
					var curFeat = '';
					var numFeat = 0;
					resultsSearch.forEach(function(r) {
						if(r.feature != curFeat) {
							curFeat = r.feature;
							numFeat = 0;
						}
						if(numFeat<sugLimit) {
							$scope.resultsSearch.push(r);
							numFeat++;
						}
					});
					
					deferred.resolve();
				});
			}
		}
	};
	
	$scope.enterSearch = function(keyEvent) {
		if(!$scope.suggestInProgress && keyEvent.which === 13) {
			//if($scope.resultsSearch.length > 0) {
			//	$scope.search($scope.resultsSearch[0]);
			//} else {
			if($scope.query.length > 0) {
				$scope.search();
			}
			keyEvent.preventDefault();
		}
	};
	
	$scope.switchTermNode = function(event,termNode,rangeData) {
		if(event.ctrlKey) {
			rangeData.termNodes.forEach(function(termNode) {
				termNode.termHidden = true;
			});
			termNode.termHidden = false;
		} else {
			termNode.termHidden = !termNode.termHidden;
		}
		
		redrawCharts(rangeData.charts);
	};
	
	$scope.showAllSeries = function(rangeData) {
		rangeData.termNodes.forEach(function(termNode) {
			termNode.termHidden = false;
		});
		
		redrawCharts(rangeData.charts);
	};

	$scope.hideAllSeries = function(rangeData) {
		rangeData.termNodes.forEach(function(termNode) {
			termNode.termHidden = true;
		});
		
		redrawCharts(rangeData.charts);
	};
	
	$scope.getDataDesc = function() {
		return $interpolate($scope.dataDesc)($scope);
	};
	
	function init($q) {
		var deferred = $q.defer();
		var promise = deferred.promise;
		promise = promise.then(function(localScope) { return $q.all([getDonors(localScope),getSpecimens(localScope),getAnalyses(localScope)]); })
				.then(getLabs)
				.then(getSamples)
				.then(fetchCellTerms);
		
		if('q' in $location.search()) {
			var query = $location.search().q;
			promise = promise.then(function(localScope) {
				localScope.query = query;
				localScope.search();
			});
		}
		
		deferred.resolve($scope);
		$scope.$on('$locationChangeStart', function(event) {
			//console.log("He visto algo");
			if($scope.searchInProgress) {
				event.preventDefault();
			}
		});
		$scope.$on('$locationChangeSuccess', function(event) {
			//console.log("Lo vi!!!!!");
			if('q' in $location.search()) {
				var query = $location.search().q;
				$scope.query = query;
				$scope.search();
			}
		});
	}
	
	init($q);
}]);
