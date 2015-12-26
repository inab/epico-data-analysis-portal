'use strict';

/*jshint camelcase: false , quotmark: false */

angular.
module('blueprintApp').
factory('QueryService',['$q','es','portalConfig','ConstantsService','ChartService',function($q,es,portalConfig,ConstantsService,ChartService) {
	
	// Labels for the search button
	var FETCHING_LABEL = "Fetching...";
	var PLOTTING_LABEL = "Plotting...";
	
	var chipSeqWindow = ConstantsService.DEFAULT_FLANKING_WINDOW_SIZE;
	
	function getSampleTrackingData(localScope) {
		if(localScope.donors!==undefined && localScope.donors.length!==0) {
			return localScope;
		}
		
		localScope.donors = [];
		localScope.specimens = [];
		localScope.samples = [];
		localScope.labs = [];
		localScope.experimentsMap = {};
		
		return es.search({
			index: ConstantsService.SAMPLE_TRACKING_DATA_INDEX,
			size: 100000,
			body:{},
		}).then(function(resp){
			if(typeof(resp.hits.hits) !== undefined) {
				var subtotalsData = [];
				
				ChartService.assignSeriesDataToChart(localScope.subtotals,subtotalsData);

				var histones = [];
				var histoneMap = {};
				
				var samplesMap = {};
				var specimensMap = {};
				var donorsMap = {};
				
				var numDonors = 0;
				var numPooledDonors = 0;
				var numCellularLines = 0;
				var numSamples = 0;
				var numOther = 0;
				resp.hits.hits.forEach(function(d) {
					switch(d._type) {
						case ConstantsService.DONOR_CONCEPT:
							var donor = d._source;
							switch(donor.donor_kind) {
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
							localScope.donors.push(donor);
							donorsMap[donor.donor_id] = donor;
							
							break;
							
						case ConstantsService.SPECIMEN_CONCEPT:
							var specimen = d._source;
							localScope.specimens.push(specimen);
							specimensMap[specimen.specimen_id] = specimen;
						
							break;
							
						case ConstantsService.SAMPLE_CONCEPT:
							var s = {
								analyzed_sample_type_other: d._source.analyzed_sample_type_other,
								sample_id: d._source.sample_id,
								specimen_id: d._source.specimen_id,
								ontology: d._source.purified_cell_type,
								markers: d._source.markers,
								experiments: [],
							};
							
							localScope.samples.push(s);
							samplesMap[s.sample_id] = s;
							numSamples++;
							
							break;
						
						default:
							if(d._source.experiment_id!==undefined && d._source.experiment_type!==undefined) {
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
								lab_experiment.analyses = [];
								
								// Linking everything
								//lab_experiment.analyses = (lab_experiment.experiment_id in localScope.experiment2AnalysisHash) ? localScope.experiment2AnalysisHash[lab_experiment.experiment_id] : [];
								//lab_experiment.analyses.forEach(function(analysis) {
								//	analysis.lab_experiment = lab_experiment;
								//});
								localScope.labs.push(lab_experiment);
								localScope.experimentsMap[lab_experiment.experiment_id] = lab_experiment;
							}
							
							break;
					}
				});
				
				// Initial pie chart data
				subtotalsData.push(
					['Donors', numDonors],
					['Cellular Lines', numCellularLines],
					['Pooled Donors', numPooledDonors],
					['Samples', numSamples]
				);
				localScope.numCellularLines = numCellularLines;
				
				if(numOther>0) {
					subtotalsData.push(['Other kind of donors', numOther]);
				}
				
				//console.log(localScope.donors);
				
				
				// Linking everything
				localScope.specimens.forEach(function(specimen) {
					if(specimen.donor_id in donorsMap) {
						specimen.donor = donorsMap[specimen.donor_id];
					}
				});
				
				localScope.samples.forEach(function(sample) {
					if(sample.specimen_id in specimensMap) {
						sample.specimen = specimensMap[sample.specimen_id];
					}
				});
				
				localScope.labs.forEach(function(lab_experiment) {
					if(lab_experiment.sample_id in samplesMap) {
						samplesMap[lab_experiment.sample_id].experiments.push(lab_experiment);
						lab_experiment.sample = samplesMap[lab_experiment.sample_id];
					}
				});
				
				// Sorting histones by name
				histones.sort(function(a,b) { return a.histoneName.localeCompare(b.histoneName); });
				localScope.numHistones = histones.length;
				localScope.histoneMap = histoneMap;
				localScope.histones = histones;
				
				ChartService.initializeAvgSeries(localScope,histones);
			}
			
			return localScope;
		});
	}
	
	function getAnalysisMetadata(localScope) {
		if(localScope.analyses!==undefined && localScope.analyses.length !== 0) {
			return localScope;
		}
		
		localScope.analyses = [];
		localScope.analysesHash = {};
		
		return es.search({
			size: 10000000,
			index: ConstantsService.METADATA_DATA_INDEX,
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
						case ConstantsService.DLAT_CONCEPT_M:
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
						case ConstantsService.PDNA_CONCEPT_M:
							if(analysis.analysis_id.indexOf('_broad_')!==-1) {
								analysis.isBroad = true;
								numCSbroad++;
							} else {
								analysis.isBroad = false;
								numCSnarrow++;
							}
							break;
						case ConstantsService.EXP_CONCEPT_M:
							numExpG++;
							numExpT++;
							break;
						case ConstantsService.RREG_CONCEPT_M:
							numRReg++;
							break;
						default:
							numAnOther++;
					}
					localScope.analyses.push(analysis);
					localScope.analysesHash[analysis.analysis_id] = analysis;
					
					// Linking everything
					if(analysis.experiment_id in localScope.experimentsMap) {
						var lab_experiment = localScope.experimentsMap[analysis.experiment_id];
						
						lab_experiment.analyses.push(analysis);
						analysis.lab_experiment = lab_experiment;
					}
				});
				
				var analysisSubtotals = [];
				
				ChartService.assignSeriesDataToChart(localScope.analysisSubtotals,analysisSubtotals);
				
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
	}
	
	function fetchCellTerms(localScope) {
		if(localScope.fetchedTreeData!==undefined) {
			return localScope;
		}
		
		
		var deferred = $q.defer();
        
		// Let's calculate the unique terms
		var theUris=[];
		var theUrisHash = {};
		localScope.samples.forEach(function(s) {
			var d = s.ontology;
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
			index: ConstantsService.METADATA_MODEL_INDEX,
			type: ConstantsService.CVTERM_CONCEPT,
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
					index: ConstantsService.METADATA_MODEL_INDEX,
					type: ConstantsService.CVTERM_CONCEPT,
					size: 100000,
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
						
						ChartService.assignColorMap(localScope,termNodes);
						
						// At last, linking analysis to their corresponding cell types and the mean series
						localScope.samples.forEach(function(sample) {
							var term = termNodesHash[sample.ontology];
							sample.cell_type = term;
							sample.experiments.forEach(function(experiment) {
								experiment.analyses.forEach(function(analysis) {
									analysis.cell_type = term;
									ChartService.linkMeanSeriesToAnalysis(analysis,experiment);
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
	}
	
	function getHistoneStatsData(lab_experiment,stats,range){
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
	}
	
	function populateBasicTree(o,samples,clonedExperimentLabels,experimentLabelsHash,rangeData,isDetailed) {
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
				numNodes += populateBasicTree(child,samples,clonedExperimentLabels,experimentLabelsHash,rangeData,isDetailed);
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
			var percentFixupIndexes = [];
			clonedExperimentLabels.forEach(function(experimentLabel,iExp) {
				aggregated_statistics.push(0.0);
				childrens.push(0);
				if(experimentLabel.doPercentFixup) {
					percentFixupIndexes.push(iExp);
				}
			});
			samples.forEach(function(s) {
				if(s.ontology === o.o_uri) {
				//if(s.ontology === o.o_uri || (s.cell_type.parents && s.cell_type.parents.some(function(op) { return op === o.o_uri; }))) {
					o.analyzed = true;
					var statistics = clonedExperimentLabels.map(function() {
						return 0.0;
					});
					s.experiments.forEach(function(lab_experiment){
						//console.log(d);
						var theStat = 0.0;
						var experimentLabel;
						var experimentIndex;
						var experimentStats;
						if(lab_experiment.experiment_type in experimentLabelsHash) {
							experimentLabel = experimentLabelsHash[lab_experiment.experiment_type];
							experimentIndex = experimentLabel[0].pos;
							experimentStats = stats[experimentLabel[0].feature];
						}
						switch(lab_experiment.experiment_type) {
							case ConstantsService.EXPERIMENT_TYPE_DNA_METHYLATION:
								var methExp = 0;
								lab_experiment.analyses.forEach(function(analysis) {
									var v = analysis.analysis_id;
									if(v in experimentStats) {
										var a = experimentStats[v];
										theStat += a.stats_meth_level.avg;
										methExp++;
									}
								});
								if(methExp > 0.0){
									theStat = theStat/methExp;
									childrens[experimentIndex]++;
									experimentLabel[0].visible = true;
								} else {
									theStat = NaN;
								}
								statistics[experimentIndex] = theStat;
								break;
							case ConstantsService.EXPERIMENT_TYPE_CHROMATIN_ACCESSIBILITY:
								var dnaseSeqExp = 0;
								lab_experiment.analyses.forEach(function(analysis) {
									var v = analysis.analysis_id;
									if(v in experimentStats) {
										var a = experimentStats[v];
										theStat += a.peak_size.value;
										dnaseSeqExp++;
									}
								});
								if(dnaseSeqExp > 0) {
									var region = range.end - range.start + 1;
									theStat = theStat/region;
									childrens[experimentIndex]++;
									experimentLabel[0].visible = true;
								} else {
									theStat = NaN;
								}
								statistics[experimentIndex] = theStat;
								break;
							case ConstantsService.EXPERIMENT_TYPE_MRNA_SEQ:
								experimentLabel.forEach(function(expLabel) {
									// Expression at Gene or Transcript levels
									var rnaSeqExp = 0;
									var expIndex = expLabel.pos;
									var expStats = stats[expLabel.feature];
									theStat = 0.0;
									
									lab_experiment.analyses.forEach(function(analysis) {
										var v = analysis.analysis_id;
										if(v in expStats) {
											var a = expStats[v];
											theStat += a.stats_normalized_read_count.avg;
											rnaSeqExp++;
										}
									});
									if(rnaSeqExp > 0) {
										theStat = theStat/rnaSeqExp;
										childrens[expIndex]++;
										expLabel.visible = true;
									} else {
										theStat = NaN;
									}
									statistics[expIndex] = theStat;
								});
								break;
							default:
								if(lab_experiment.experiment_type.indexOf(ConstantsService.EXPERIMENT_TYPE_HISTONE_MARK)===0) {
									if(lab_experiment.histone!==undefined) {
										var histone = lab_experiment.histone;
										var expIdx = histone.histoneIndex;
										
										var histoneStats = getHistoneStatsData(lab_experiment,stats,range);
										
										statistics[expIdx] = histoneStats.broad;
										if(statistics[expIdx]>0) {
											childrens[expIdx]++;
											clonedExperimentLabels[expIdx].visible = true;
										//} else {
										//	statistics[expIdx] = NaN;
										}
											
										statistics[expIdx+1] = histoneStats.notBroad;
										if(statistics[expIdx+1]>0) {
											childrens[expIdx+1]++;
											clonedExperimentLabels[expIdx+1].visible = true;
										//} else {
										//	statistics[expIdx+1] = NaN;
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
					percentFixupIndexes.forEach(function(statsI) {
						if(!isNaN(statistics[statsI]) && statistics[statsI]!==-1) {
							statistics[statsI] *= 100.0;
						}
					});
					
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
	}

	function initTree(localScope,rangeData){
		if(localScope===undefined) {
			return undefined;
		}
		
		console.log("initializing tree");
		
		var lastSearchMode = localScope.display;
		if(lastSearchMode!=='none') {
			var isDetailed = lastSearchMode==='detailed';
			
			var clonedTreeData = angular.copy(localScope.fetchedTreeData);
			var clonedExperimentLabels = angular.copy(localScope.experimentLabels);
			
			var experimentLabelsHash = {};
			clonedExperimentLabels.forEach(function(expLabel,iExpLabel) {
				expLabel.pos = iExpLabel;
				if(!(expLabel.experiment_type in experimentLabelsHash)) {
					experimentLabelsHash[expLabel.experiment_type] = [ expLabel ];
				} else {
					experimentLabelsHash[expLabel.experiment_type].push(expLabel);
				}
			});
			
			rangeData.treedata = [];
			clonedTreeData.forEach(function(cloned) {
				var numNodes = populateBasicTree(cloned,localScope.samples,clonedExperimentLabels,experimentLabelsHash,rangeData,isDetailed);
				rangeData.treedata.push({root: cloned, numNodes: numNodes, depth:(isDetailed?localScope.depth+1:localScope.depth), experiments: clonedExperimentLabels});
			});
		}
	}

	var genShouldQuery = function(rangeData,prefix) {
		// We transform it into an array, in case it is not yet
		var flankingWindowSize = (rangeData.flankingWindowSize !== undefined) ? rangeData.flankingWindowSize : 0;
		
		var rangeQueryArr = rangeData.range;
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
			var qStart = q.start-flankingWindowSize;
			var qEnd = q.end+flankingWindowSize;
			
			var termQuery = {};
			termQuery[chromosome_name] = q.chr;
			
			var commonRange = {
				gte: qStart,
				lte: qEnd
			};
			
			var chromosome_start_range = {};
			chromosome_start_range[chromosome_start_name] = commonRange;
			
			var chromosome_end_range = {};
			chromosome_end_range[chromosome_end_name] = commonRange;
			
			var chromosome_start_lte_range = {};
			chromosome_start_lte_range[chromosome_start_name] = {
				lte: qEnd
			};
			
			var chromosome_end_gte_range = {};
			chromosome_end_gte_range[chromosome_end_name] = {
				gte: qStart
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
	
	function launch() {
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
	}
	
	function rangeLaunch(theFunc,rangeData) {
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
	}
	
	function getGeneLayout(localScope,rangeData) {
		if(localScope===undefined || rangeData.regionLayout!==undefined) {
			return localScope;
		}
		rangeData.regionLayout = null;
		
		var deferred = $q.defer();
		var nestedShouldQuery = genShouldQuery(rangeData,'coordinates');
		
		localScope.searchButtonText = FETCHING_LABEL;
		es.search({
			size: 10000,
			index: ConstantsService.EXTERNAL_DATA_INDEX,
			type: ConstantsService.EXTERNAL_FEATURES_CONCEPT,
			body: {
				query: {
					filtered: {
						filter: {
							bool: {
								must: [
									{
										terms: {
											feature: ChartService.REGION_FEATURES
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
				ChartService.doChartLayout(localScope,rangeData,resp.hits.hits);
				deferred.resolve(localScope);
			} else {
				deferred.reject(err);
			}
		});
		
		return deferred.promise;
	}
	
	function getChartData(localScope,rangeData) {
		var deferred = $q.defer();
		var shouldQuery = genShouldQuery(rangeData);
		var range_start = rangeData.range.start;
		var range_end = rangeData.range.end;
		
		if(rangeData.flankingWindowSize!==undefined) {
			range_start -= rangeData.flankingWindowSize;
			range_end += rangeData.flankingWindowSize;
		}
		
		var total = 0;
		//var totalPoints = 0;
		localScope.searchButtonText = FETCHING_LABEL;
		localScope.maxResultsFetched = 0;
		localScope.resultsFetched = 0;

		var scrolled = false;
		es.search({
			size: 10000,
			index: ConstantsService.PRIMARY_DATA_INDEX,
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
			if(resp!==undefined) {
				if(resp.hits!==undefined) {
					localScope.maxResultsFetched = resp.hits.total;
					
					ChartService.processChartData(localScope,rangeData,range_start,range_end,resp.hits.hits);
					total += resp.hits.hits.length;
					
					// Now, updating the graphs
					localScope.searchButtonText = PLOTTING_LABEL;
					localScope.resultsFetched = total;
					//var xRange = [rangeData.range.start,rangeData.range.end];
					
					// Re-drawing charts
					var stillLoading = resp.hits.total > total;
					ChartService.redrawCharts(rangeData,true,stillLoading);
					
					// Is there any more data?
					if(stillLoading) {
						var percent = 100.0 * total / resp.hits.total;
						
						localScope.searchButtonText = "Loaded "+percent.toPrecision(2)+'%';
						
						//console.log("Hay "+total+' de '+resp.hits.total);
						scrolled = true;
						es.scroll({
							index: ConstantsService.PRIMARY_DATA_INDEX,
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
					deferred.reject(resp);
				}
			} else {
				console.log("DEBUG Total "+total);
				console.log(resp);
				console.log("DEBUG Total err "+total);
				console.log(err);
				
				deferred.reject(err);
			}
		});
		
		return deferred.promise;
	}
	
	function getWgbsStatsData(localScope,rangeData) {
		var deferred = $q.defer();
		var shouldQuery = genShouldQuery(rangeData);
		
		//rangeData.stats.bisulfiteSeq = [];
		rangeData.stats.bisulfiteSeqHash = {};
		es.search({
			size:10000000,
			index: ConstantsService.PRIMARY_DATA_INDEX,
			type: ConstantsService.DLAT_CONCEPT,
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
					//rangeData.stats.bisulfiteSeq.push(d);
					rangeData.stats.bisulfiteSeqHash[d.key] = d;
				});
				deferred.resolve(localScope);
			} else {
				return deferred.reject(err); 
			}
		});
		
		return deferred.promise;
	}
	
	function getRnaSeqGStatsData(localScope,rangeData) {
		var deferred = $q.defer();
		var shouldQuery = genShouldQuery(rangeData);
		
		//rangeData.stats.rnaSeqG = [];
		rangeData.stats.rnaSeqGHash = {};
		es.search({
			size:10000000,	
			index: ConstantsService.PRIMARY_DATA_INDEX,
			type: ConstantsService.EXPG_CONCEPT,
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
					//rangeData.stats.rnaSeqG.push(d);
					rangeData.stats.rnaSeqGHash[d.key] = d;
				});
				deferred.resolve(localScope);
			} else {
				return deferred.reject(err); 
			}
		});
		
		return deferred.promise;
	}

	function getRnaSeqTStatsData(localScope,rangeData) {
		var deferred = $q.defer();
		var shouldQuery = genShouldQuery(rangeData);
		
		//rangeData.stats.rnaSeqT = [];
		rangeData.stats.rnaSeqTHash = {};
		es.search({
			size:10000000,	
			index: ConstantsService.PRIMARY_DATA_INDEX,
			type: ConstantsService.EXPT_CONCEPT,
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
					//rangeData.stats.rnaSeqT.push(d);
					rangeData.stats.rnaSeqTHash[d.key] = d;
				});
				deferred.resolve(localScope);
			} else {
				return deferred.reject(err); 
			}
		});
		
		return deferred.promise;
	}

	function getDnaseStatsData(localScope,rangeData) {
		var deferred = $q.defer();
		var shouldQuery = genShouldQuery(rangeData);
		
		//rangeData.stats.dnaseSeq = [];
		rangeData.stats.dnaseSeqHash = {};
		es.search({
			size:10000000,	
			index: ConstantsService.PRIMARY_DATA_INDEX,
			type: ConstantsService.RREG_CONCEPT,
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
					//rangeData.stats.dnaseSeq.push(d);
					rangeData.stats.dnaseSeqHash[d.key] = d;
				});
				deferred.resolve(localScope);
			}else{
				return deferred.reject(err); 
			}
		});
		
		return deferred.promise;
	}
	
	function getChipSeqStatsData(localScope,rangeData) {			
		var deferred = $q.defer();
		var shouldQuery = genShouldQuery(rangeData);
		
		rangeData.stats.chipSeq = [];
		rangeData.stats.chipSeqHash = {};
		es.search({
			size:10000000,	
			index: ConstantsService.PRIMARY_DATA_INDEX,
			type: ConstantsService.PDNA_CONCEPT,
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
	}
	
	var DEFAULT_QUERY_TYPES = ["gene","pathway","reaction"];
	
	function scheduleGetRanges(currentQueries,parentProcessRangeMatchNoResults,parentPromise) {
		currentQueries.forEach(function(currentQuery) {
			if(!currentQuery.gotRanges) {
				parentPromise = parentPromise.then(function(localScope) {
					var deferred = $q.defer();
					var promise = deferred.promise;
					
					var queryTypes = currentQuery.queryType!==undefined ? [currentQuery.queryType] : DEFAULT_QUERY_TYPES;
					var query = currentQuery.query;
					es.search({
						index: ConstantsService.EXTERNAL_DATA_INDEX,
						type: ConstantsService.EXTERNAL_FEATURES_CONCEPT,
						size: 1000,
						body: {
							query:{
								filtered:{
									filter: {
										bool: {
											must: [
												{
													terms: {
														feature: queryTypes
													}
												},
												{
													bool: {
														should: [
															{
																term: {
																	feature_id: query
																}
															},
															{
																query: {
																	match: {
																		symbol: query 
																	}
																}
															}
														]
													}
												}
											]
										}
									}
								}
							}
						}
					},function(err,resp){
						if(typeof(resp.hits.hits) !== undefined){
							var theTerm = query.toUpperCase();
							var theMatch;
							resp.hits.hits.some(function(match) {
								var found = match._source.coordinates.some(function(coords) {
									if(coords.feature_id.toUpperCase() === theTerm) {
										return true;
									}
									
									return false;
								}) || match._source.symbol.some(function(symbol) {
									if(symbol.toUpperCase() === theTerm) {
										return true;
									}
									
									return false;
								});
								
								if(found) {
									theMatch=match;
								}
								
								return found;
							});
							
							if(theMatch!==undefined) {
								currentQuery.gotRanges = true;
								currentQuery.queryType = theMatch._source.feature;
								currentQuery.queryTypeStr = theMatch._source.feature;
								currentQuery.ensemblGeneId = theMatch._source.feature_cluster_id;
								
								var featureLabel = currentQuery.featureLabel = ChartService.chooseLabelFromSymbols(theMatch._source.symbol);
								var isReactome = ConstantsService.isReactome(currentQuery.queryType);
								theMatch._source.coordinates.forEach(function(range) {
									var theRange = { feature_id: range.feature_id, currentQuery: currentQuery, chr: range.chromosome , start: range.chromosome_start, end: range.chromosome_end};
									
									theRange.label = isReactome ? range.feature_id : featureLabel;
									
									localScope.rangeQuery.push(theRange);
								});
								deferred.resolve(localScope);
							} else {
								parentProcessRangeMatchNoResults(localScope,currentQuery,queryTypes,deferred);
							}
						} else {
							deferred.reject(err);
						}
					});
					return promise;
				});
			}
		});
		
		return parentPromise;
	}
	
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
	
	function suggestSearch(typedQuery) {
		var query = typedQuery.trim().toLowerCase();
		var queryType;
		var colonPos = query.indexOf(':');
		if(colonPos!==-1) {
			queryType = query.substring(0,colonPos);
			query = query.substring(colonPos+1);
		}
		
		if(query.length >= 3 && (!queryType || (queryType in my_feature_ranking))) {
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
			return es.search({
				index: ConstantsService.EXTERNAL_DATA_INDEX,
				type: ConstantsService.EXTERNAL_FEATURES_CONCEPT,
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
			}).then(function(resp){
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
				
				
				var shownResultsSearch = [];
				
				var curFeat = '';
				var numFeat = 0;
				resultsSearch.forEach(function(r) {
					if(r.feature != curFeat) {
						curFeat = r.feature;
						numFeat = 0;
					}
					if(numFeat<sugLimit) {
						shownResultsSearch.push(r);
						numFeat++;
					}
				});
				
				return shownResultsSearch;
			});
		} else {
			return [];
		}
	}
	
	return {
		getSampleTrackingData: getSampleTrackingData,
		getAnalysisMetadata: getAnalysisMetadata,
		
		fetchCellTerms: fetchCellTerms,
		initTree: initTree,
		// The range query core
		genShouldQuery: genShouldQuery,
		// Methods to launch query methods on specific ranges
		launch: launch,
		rangeLaunch: rangeLaunch,
		// Query methods
		getGeneLayout: getGeneLayout,
		getChartData: getChartData,
		getWgbsStatsData: getWgbsStatsData,
		getRnaSeqGStatsData: getRnaSeqGStatsData,
		getRnaSeqTStatsData: getRnaSeqTStatsData,
		getDnaseStatsData: getDnaseStatsData,
		getChipSeqStatsData: getChipSeqStatsData,
		// Misc methods
		suggestSearch: suggestSearch,
		scheduleGetRanges: scheduleGetRanges,
		my_feature_ranking: my_feature_ranking,
	};
}]);
