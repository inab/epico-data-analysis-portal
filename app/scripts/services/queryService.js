'use strict';

/*jshint camelcase: false , quotmark: false */

angular.
module('blueprintApp').
factory('QueryService',['$q','es','portalConfig','ConstantsService','ChartService',function($q,es,portalConfig,ConstantsService,ChartService) {
	
	// Labels for the search button
	var FETCHING_LABEL = "Fetching...";
	var PLOTTING_LABEL = "Plotting...";
	
	var chipSeqWindow = ConstantsService.DEFAULT_FLANKING_WINDOW_SIZE;
	
	// This is here to fix a problem parsing the donor_disease field when the database was created
	var Disease2Ont = {
		'Acute lymphocytic leukemia': 'http://ncimeta.nci.nih.gov/ncimbrowser/ConceptReport.jsp?dictionary=NCI%20MetaThesaurus&code=C0023449',
		'Acute Myeloid Leukemia': 'http://ncimeta.nci.nih.gov/ncimbrowser/ConceptReport.jsp?dictionary=NCI%20MetaThesaurus&code=C0023467',
		'Acute promyelocytic leukemia': 'http://ncimeta.nci.nih.gov/ncimbrowser/ConceptReport.jsp?dictionary=NCI%20MetaThesaurus&code=C0023487',
		'Chronic lymphocytic leukemia': 'http://ncimeta.nci.nih.gov/ncimbrowser/ConceptReport.jsp?dictionary=NCI%20MetaThesaurus&code=C0023434',
		'Germinal Center B-Cell-Like Diffuse Large B-Cell Lymphoma': 'http://ncimeta.nci.nih.gov/ncimbrowser/ConceptReport.jsp?dictionary=NCI%20MetaThesaurus&code=C1333295',
		'Mantle cell lymphoma': 'http://ncimeta.nci.nih.gov/ncimbrowser/ConceptReport.jsp?dictionary=NCI%20MetaThesaurus&code=C0334634',
		'Multiple myeloma': 'http://ncimeta.nci.nih.gov/ncimbrowser/ConceptReport.jsp?dictionary=NCI%20MetaThesaurus&code=C0026764',
		'None': 'http://purl.obolibrary.org/obo/PATO_0000461',
		'Sporadic Burkitt lymphoma': 'http://ncimeta.nci.nih.gov/ncimbrowser/ConceptReport.jsp?dictionary=NCI%20MetaThesaurus&code=C1336077',
		'T-cell acute leukemia': 'http://ncimeta.nci.nih.gov/ncimbrowser/ConceptReport.jsp?dictionary=NCI%20MetaThesaurus&code=C0023449',
	};
	
	function DataModel(theDataModel,theCVHash) {
		// Risky, but it is so easier to get the domains and other data
		angular.extend(this,theDataModel);
		
		this.cvHash = theCVHash;
	}
	
	// Method 
	DataModel.prototype.getColumn = function(conceptDomainName, conceptName, columnName) {
		var column;
		
		// First, get the column metadata
		if(conceptDomainName in this.domains) {
			var conceptDomain = this.domains[conceptDomainName];
			if(conceptName in conceptDomain.concepts) {
				var concept = conceptDomain.concepts[conceptName];
				if(columnName in concept.columns) {
					column = concept.columns[columnName];
				}
			}
		}
		
		return column;
	};
	
	DataModel.prototype.getCVIds = function(column) {
		var retval = [];
		
		if(column!==undefined) {
			if(('restrictions' in column) && ('cv' in column.restrictions)) {
				var cv = this.cvHash[column.restrictions.cv];
				
				if('includes' in cv) {
					retval = cv.includes;
				} else {
					retval.push(column.restrictions.cv);
				}
			}
		}
		
		return retval;
	};
	
	
	DataModel.prototype.fetchCVTermsForColumn = function(localScope,conceptDomainName,conceptName,columnName, dest, /*optional*/callback) {
		if(dest in localScope) {
			return localScope;
		}
		
		var column = this.getColumn(conceptDomainName,conceptName,columnName);
		var conceptNamePlural = conceptName + 's';
		
		// Let's calculate the unique terms
		var theUris=[];
		var theUrisHash = {};
		localScope[conceptNamePlural].forEach(function(conceptInstance) {
			var d = conceptInstance[columnName];
			if(!(d in theUrisHash)) {
				theUris.push(d);
				theUrisHash[d]=1;
			}
		});
		
		var theCVs = this.getCVIds(column);
		//var diseaseCVs = ['cv:PATO','cv:EFO','cv:NCIMetathesaurus'];
		
		var deferred = $q.defer();
        
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
										ont: theCVs
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
				fields: ['term','term_uri','name','ont']
			}
		}, function(err,resp) {
			if(resp.hits.total > 0) {
				localScope[dest] = resp.hits.hits.map(function(v) {
					var n = v.fields;
					var theNode = {
						name: n.name[0],
						o: n.term[0],
						o_uri: n.term_uri[0],
						ont: n.ont[0],
					};
					
					return theNode;
				});
				
				if(typeof(callback) === 'function') {
					return callback(localScope,deferred);
				} else {
					deferred.resolve(localScope);
				}
			} else {
				return deferred.reject(err);
			}
		});
		return deferred.promise;
	};
	
	function getDataModel(localScope) {
		if(localScope.dataModel!==undefined) {
			return localScope;
		}
		
		return es.search({
			index: ConstantsService.METADATA_MODEL_INDEX,
			type: [ConstantsService.DATA_MODEL_CONCEPT,ConstantsService.CV_CONCEPT],
			size: 1000,
			body: {},
		}).then(function(resp) {
			if(typeof(resp.hits.hits) !== undefined) {
				var cvHash = {};
				var theDataModel;
				resp.hits.hits.forEach(function(entry) {
					switch(entry._type) {
						case ConstantsService.DATA_MODEL_CONCEPT:
							theDataModel = entry._source;
							break;
						case ConstantsService.CV_CONCEPT:
							var cventry = entry._source;
							cventry._id = entry._id;
							cvHash[cventry._id] = cventry;
							break;
					}
				});
				
				// These are needed to seek in the model
				localScope.dataModel = new DataModel(theDataModel,cvHash);
			}
			
			return localScope;
		});
	}
	
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
							// Fixing this problem
							if(specimen.donor_disease===null) {
								if(specimen.donor_disease_text in Disease2Ont) {
									specimen.donor_disease = Disease2Ont[specimen.donor_disease_text];
								} else {
									console.log('Unknown disease: '+specimen.donor_disease_text);
								}
							}
							localScope.specimens.push(specimen);
							specimensMap[specimen.specimen_id] = specimen;
						
							break;
							
						case ConstantsService.SAMPLE_CONCEPT:
							var s = d._source;
							// They are the same
							s.ontology = s.purified_cell_type;
							s.experiments = [];
							
							localScope.samples.push(s);
							samplesMap[s.sample_id] = s;
							numSamples++;
							
							break;
						
						default:
							if(d._source.experiment_id!==undefined && d._source.experiment_type!==undefined) {
								var lab_experiment = d._source;
								lab_experiment._type	= d._type;
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
					['Pooled Donors', numPooledDonors]
					//,
					//['Samples', numSamples]
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
					if(lab_experiment.analyzed_sample_id in samplesMap) {
						lab_experiment.sample = samplesMap[lab_experiment.analyzed_sample_id];
						lab_experiment.sample.experiments.push(lab_experiment);
					}
				});
				
				// Sorting histones by name
				histones.sort(function(a,b) { return a.histoneName.localeCompare(b.histoneName); });
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

					// This is a quirk
					if(analysis.analysis_id.indexOf('_wiggler')===-1) {
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
								if(analysis.analysis_id.indexOf('_gq_')!==-1) {
									numExpG++;
								} else {
									numExpT++;
								}
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
	
	function fetchDiseaseTerms(localScope) {
		return localScope.dataModel.fetchCVTermsForColumn(localScope,'sdata','specimen','donor_disease','diseaseNodes');
	}
	
	function fetchTissueTerms(localScope) {
		return localScope.dataModel.fetchCVTermsForColumn(localScope,'sdata','specimen','specimen_term','tissueNodes');
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
			var d = s.purified_cell_type;
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
		
		// var cellTermsCVs = ['cv:CellOntology','cv:EFO','cv:CellLineOntology'];
		var cellTermsCVs = localScope.dataModel.getCVIds(localScope.dataModel.getColumn('sdata','sample','purified_cell_type'));
		
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
										ont: cellTermsCVs
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
						// Sorting by ontology, so we discard cv:EFO terms in case they are already defined in cv:CellOntology or cv:CellLineOntology
						var rawnodes = resp.hits.hits.sort(function(a,b) {
							return a.fields.ont[0].localeCompare(b.fields.ont[0]);
						}).map(function(v) {
							var n = v.fields;
							n._id = v._id;
							
							var treeNode = {
								name: n.name[0],
								o: n.term[0],
								o_uri: n.term_uri[0],
								ont: n.ont[0],
							};
							
							if(treeNode.o in treeNodes) {
								// This is for nodes with the same name
								// but different unique id, so we don't have stale references
								if(fetchedNodes[treeNode.o]._id !== n._id) {
									fetchedNodes[treeNode.o].parents = fetchedNodes[treeNode.o].parents.concat(n.parents);
								}
								
							} else {
								treeNodes[treeNode.o] = treeNode;
								fetchedNodes[treeNode.o] = n;
							}
							
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
						
						/* This code was intended to be for dagre-d3 usage. Disable it for now
						
						var ontologies = [];
						var ontsVisited = {};
						var graphVisited = {};
						var nowGraphNodes = termNodes.map(function(tn) {
							return tn.o;
						});
						var rootOntologies = [];
						var knownRootOntologies = {};
						while(nowGraphNodes.length > 0) {
							var nextGraphNodes = [];
							nowGraphNodes.forEach(function(term) {
								if(!(term in graphVisited)) {
									graphVisited[term] = null;
									
									var fn = fetchedNodes[term];
									var tn = treeNodes[term];
									
									var ontology;
									if(tn.ont in ontsVisited) {
										ontology = ontsVisited[tn.ont];
									} else {
										ontology = {
											graphNodes: [],
											graphEdges: []
										};
										ontologies.push(ontology);
										ontsVisited[tn.ont] = ontology;
									}
									
									ontology.graphNodes.push(tn);
									if(fn.parents) {
										var isDead = true;
										fn.parents.forEach(function(p_term) {
											if(p_term in treeNodes) {
												isDead = false;
												nextGraphNodes.push(p_term);
												ontology.graphEdges.push({parent: p_term, child: term});
											}
										});
									} else if(!(tn.ont in knownRootOntologies)) {
										rootOntologies.push(ontology);
										knownRootOntologies[tn.ont] = null;
									}
								}
							});
							
							nowGraphNodes = nextGraphNodes;
						}
						localScope.fetchedGraphData = rootOntologies.sort(function(a,b) { return a.graphNodes.length - b.graphNodes.length; });
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
						
						// Resetting on first usage
						ChartService.resetColorMap();
						ChartService.assignCellTypesColorMap(localScope,termNodes);
						ChartService.assignMeanSeriesColorMap(localScope);
						// Diseases
						ChartService.assignTermsColorMap(localScope.diseaseNodes);
						// Tissues
						ChartService.assignTermsColorMap(localScope.tissueNodes);
						
						// At last, linking analysis to their corresponding cell types and the mean series
						localScope.samples.forEach(function(sample) {
							var term = termNodesHash[sample.purified_cell_type];
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
		//var histone = lab_experiment.histone;
		
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
	
	function prepareTermNodesInTree(o,termNodesHash,nodesReport) {
		if(nodesReport===undefined) {
			nodesReport = {
				parentNodes: [],
				wereSeenNodes: []
			};
		}
		
		if(o.wasSeen) {
			nodesReport.wereSeenNodes.push(o);
		}
		
		if(o.children) {
			nodesReport.parentNodes.push(o);
			
			var children;
			var changed = false;
			
			// First, replace those nodes which are termNodes
			children = o.children.map(function(child) {
				if(child.o_uri && (child.o_uri in termNodesHash)) {
					child = termNodesHash[child.o_uri];
					changed = true;
				}
				
				return child;
			});
			
			if(changed) {
				o.children = children;
			}
			
			// Then, populate them!
			o.children.forEach(function(child) {
				prepareTermNodesInTree(child,termNodesHash,nodesReport);
				
				// For reverse lookups
				child.parent = o;
			});
		}
		
		return nodesReport;
	}
	
	function populateBasicTree(o,samples,ontology,rangeData) {
		var numNodes = 1;
		// First, the children
		if(o.children) {
			// Then, populate them!
			o.children.forEach(function(child) {
				numNodes += populateBasicTree(child,samples,ontology,rangeData);
			});
		} else {
			o.children = [];
		}
		
		// And now, me!
		if(o.o_uri) {
			var clonedExperimentLabels = ontology.experiments;
			var experimentLabelsHash = ontology.experimentLabelsHash;
			var isDetailed = ontology.isDetailed;
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
			var sampleChildren = isDetailed ? [] : undefined;
			samples.forEach(function(s) {
				if(s.purified_cell_type === o.o_uri) {
				//if(s.purified_cell_type === o.o_uri || (s.cell_type.parents && s.cell_type.parents.some(function(op) { return op === o.o_uri; }))) {
					var statistics = clonedExperimentLabels.map(function() {
						return NaN;
					});
					if(s.sample_id in rangeData.uniqueSamplesInRangeHash) {
						o.analyzed = true;
					
						s.experiments.forEach(function(lab_experiment){
							//console.log(d);
							var theStat = 0.0;
							var experimentLabel;
							var experimentIndex;
							var experimentStats;
							if(lab_experiment._type in experimentLabelsHash) {
								experimentLabel = experimentLabelsHash[lab_experiment._type];
								experimentIndex = experimentLabel[0].pos;
								experimentStats = stats[experimentLabel[0].feature];
							}
							
							switch(lab_experiment._type) {
								case ConstantsService.LAB_WGBS_CONCEPT:
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
								case ConstantsService.LAB_CHRO_CONCEPT:
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
								case ConstantsService.LAB_MRNA_CONCEPT:
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
								case ConstantsService.LAB_CS_CONCEPT:
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
									} else if(lab_experiment.experiment_type !== ConstantsService.EXPERIMENT_TYPE_CHIPSEQ_INPUT) {
										console.log("Unmanaged ChIP-Seq experiment type: ["+lab_experiment._type+"] "+lab_experiment.experiment_type);
									}
									break;
								default:
									console.log("Unmanaged experiment type: ["+lab_experiment._type+"] "+lab_experiment.experiment_type);
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
					}
					
					if(isDetailed){
						var newNode = {
							expData: statistics,
							name: s.sample_name+' ('+s.sample_id+')',
							experimentsCount: s.experiments.length
						};
						
						sampleChildren.push(newNode);
						numNodes++;
					}
				}
			});
			// Samples go before anything
			if(isDetailed) {
				o.children = sampleChildren.concat(o.children);
			}
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
		
		console.log("initializing stats tree");
		
		var lastSearchMode = rangeData.ui.treeDisplay;
		if(lastSearchMode!=='none') {
			var isDetailed = lastSearchMode==='detailed';
			
			//var availableSamples = localScope.samples.filter(function(sample) {
			//	return sample.sample_id in rangeData.uniqueSamplesInRangeHash;
			//});
			
			rangeData.treedata.forEach(function(ontology) {
				ontology.isDetailed = isDetailed;
				var numNodes = populateBasicTree(ontology.root,localScope.samples,ontology,rangeData);
				ontology.numNodes = numNodes;
				ontology.depth = isDetailed?localScope.depth+1:localScope.depth;
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
											feature: ConstantsService.REGION_FEATURES
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
				ChartService.doRegionFeatureLayout(rangeData,resp.hits.hits,localScope);
				deferred.resolve(localScope);
			} else {
				deferred.reject(err);
			}
		});
		
		return deferred.promise;
	}
	
	function getChartStats(localScope,rangeData) {
		var deferred = $q.defer();
		var shouldQuery = genShouldQuery(rangeData);
		
		localScope.searchButtonText = FETCHING_LABEL;
		var total = 0;
		es.search({
			size: 10000000,
			index: ConstantsService.PRIMARY_DATA_INDEX,
			//scroll: '60s',
			search_type: 'count',
			query_cache: 'true',
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
				aggregations: {
					analyses: {
						terms: {
							field: 'analysis_id',
							size: 0
						},
					},
				}
			}
		}, function(err,resp) {
			if(resp!==undefined) {
				if(resp.aggregations!==undefined) {
					if(resp.aggregations.analyses.buckets.length > 0) {
						var table = [];
						var metaDataGrid = {
							title: 'Results metadata',
							columns: [
								'donor_id',
								'donor_kind',
								
								'specimen_id',
								'tissue_type',
								'tissue_type_term',
								'donor_disease',
								'donor_disease_term',
								
								'sample_id',
								'sample_name',
								'purified_cell_type_term',
								'sample_desc',
								
								'experiment_id',
								'experiment_type',
								'experiment_ega_id',
								
								'analysis_id',
								'analysis_type',
								'analysis_num_results',
							],
							table: table,
						};
						
						// These are the analysis in the query region
						var uniqueSamplesInRangeHash = {};
						resp.aggregations.analyses.buckets.forEach(function(analysisStat) {
							var analysis_id = analysisStat.key;
							
							if(analysis_id in localScope.analysesHash) {
								ChartService.recordAnalysisOnCellType(rangeData,analysis_id,analysisStat.doc_count);
								// We are saving selected data
								var analysis = localScope.analysesHash[analysis_id];
								var lab_experiment = analysis.lab_experiment;
								var sample = lab_experiment.sample;
								var specimen = sample.specimen;
								var donor = specimen.donor;
								var row = [
									donor.donor_id,
									donor.donor_kind,
									
									specimen.specimen_id,
									specimen.tissue_type,
									specimen.specimen_term,
									specimen.donor_disease_text,
									specimen.donor_disease,
									
									sample.sample_id,
									sample.sample_name,
									sample.purified_cell_type,
									sample.analyzed_sample_type_other,
									
									lab_experiment.experiment_id,
									lab_experiment.experiment_type,
									lab_experiment.raw_data_accession.accession,
									
									analysis.analysis_id,
									analysis._type,
									analysisStat.doc_count
								];
								uniqueSamplesInRangeHash[sample.sample_id] = null;
								table.push(row);
							}
						});
						rangeData.uniqueSamplesInRangeHash = uniqueSamplesInRangeHash;
						rangeData.ui.metaDataGrid = metaDataGrid;
						
						// Postprocessing
						rangeData.termNodes.forEach(function(term) {
							if(term.analysisInRange!==undefined && term.analysisInRange.length >0) {
								term.analysisInRangeHtml = term.analysisInRange.map(function(an) {
									return an.analysis_id;
								}).join("<br>");
								
								var uniqueSampleNames = [];
								var uniqueSamples = [];
								var uniqueSamplesHash = {};
								term.analysisInRange.forEach(function(an) {
									var sample = an.lab_experiment.sample;
									if(!(sample.sample_id in uniqueSamplesHash)) {
										uniqueSamples.push(sample);
										uniqueSampleNames.push(sample.sample_name);
										uniqueSamplesHash[sample.sample_id] = null;
									}
								});
								term.samplesInRange = uniqueSamples;
								term.samplesInRangeHtml = uniqueSampleNames.sort().join("<br>");
							}
							
						});
						
						rangeData.ui.numAnalysesInRange = resp.aggregations.analyses.buckets.length;
						
						var clonedTreeData = angular.copy(localScope.fetchedTreeData);
						var clonedExperimentLabels = angular.copy(localScope.experimentLabels);
						
						var experimentLabelsHash = {};
						clonedExperimentLabels.forEach(function(expLabel,iExpLabel) {
							expLabel.pos = iExpLabel;
							if(!(expLabel.conceptType in experimentLabelsHash)) {
								experimentLabelsHash[expLabel.conceptType] = [ expLabel ];
							} else {
								experimentLabelsHash[expLabel.conceptType].push(expLabel);
							}
						});
						
						rangeData.treedata = [];
						rangeData.ui.numCellTypesInRange = 0;
						rangeData.treedata = clonedTreeData.map(function(cloned) {
							// Patching the tree
							var nodesReport = prepareTermNodesInTree(cloned,rangeData.termNodesHash);
							rangeData.ui.numCellTypesInRange += nodesReport.wereSeenNodes.length;
							return {
								root: cloned,
								experiments: clonedExperimentLabels,
								experimentLabelsHash: experimentLabelsHash,
								selectedNodes: [],
								expandedNodes: nodesReport.parentNodes,
							};
						});
						
						deferred.resolve(localScope);
					} else {
						deferred.reject('No data returned');
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
					
					ChartService.storeFetchedData(rangeData,range_start,range_end,resp.hits.hits);
					total += resp.hits.hits.length;
					
					// Re-drawing charts
					var stillLoading = resp.hits.total > total;

					// Now, updating the graphs
					rangeData.numFetchEntries = total;
					rangeData.numFetchTotal = resp.hits.total;
					
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
							if(rangeData.state===ConstantsService.STATE_SHOW_DATA) {
								localScope.searchButtonText = PLOTTING_LABEL;
								localScope.resultsFetched = total;
								//var xRange = [rangeData.range.start,rangeData.range.end];
								
								// Using the default view
								ChartService.uiFuncs.redrawCharts(rangeData,true,stillLoading);
							}
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
	
	function getStatsData(localScope,rangeData) {
		var deferred = $q.defer();
		var shouldQuery = genShouldQuery(rangeData);
		
		var total = 0;
		es.search({
			size: 10000000,
			index: ConstantsService.PRIMARY_DATA_INDEX,
			search_type: 'count',
			query_cache: 'true',
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
				aggregations: {
					Wgbs: {
						filter: {
							term: {
								_type: ConstantsService.DLAT_CONCEPT
							}
						},
						aggregations: {
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
					},
					RnaSeqG: {
						filter: {
							term: {
								_type: ConstantsService.EXPG_CONCEPT
							}
						},
						aggregations: {
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
					},
					RnaSeqT: {
						filter: {
							term: {
								_type: ConstantsService.EXPT_CONCEPT
							}
						},
						aggregations: {
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
					},
					Dnase: {
						filter: {
							term: {
								_type: ConstantsService.RREG_CONCEPT
							}
						},
						aggregations: {
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
					},
					ChipSeq: {
						filter: {
							term: {
								_type: ConstantsService.PDNA_CONCEPT
							}
						},
						aggregations: {
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
				}
			}
		}, function(err,resp) {
			if(resp!==undefined) {
				if(resp.aggregations!==undefined) {
					// Wgbs
					//rangeData.stats.bisulfiteSeq = [];
					rangeData.stats.bisulfiteSeqHash = {};
					resp.aggregations.Wgbs.analyses.buckets.forEach(function(d) {
						//rangeData.stats.bisulfiteSeq.push(d);
						rangeData.stats.bisulfiteSeqHash[d.key] = d;
					});
					
					// RnaSeqG
					//rangeData.stats.rnaSeqG = [];
					rangeData.stats.rnaSeqGHash = {};
					resp.aggregations.RnaSeqG.analyses.buckets.forEach(function(d) {
						//rangeData.stats.rnaSeqG.push(d);
						rangeData.stats.rnaSeqGHash[d.key] = d;
					});
					
					// RnaSeqT
					//rangeData.stats.rnaSeqT = [];
					rangeData.stats.rnaSeqTHash = {};
					resp.aggregations.RnaSeqT.analyses.buckets.forEach(function(d) {
						//rangeData.stats.rnaSeqT.push(d);
						rangeData.stats.rnaSeqTHash[d.key] = d;
					});
					
					// Dnase
					//rangeData.stats.dnaseSeq = [];
					rangeData.stats.dnaseSeqHash = {};
					resp.aggregations.Dnase.analyses.buckets.forEach(function(d) {
						//rangeData.stats.dnaseSeq.push(d);
						rangeData.stats.dnaseSeqHash[d.key] = d;
					});
					
					// ChIP-Seq
					rangeData.stats.chipSeq = [];
					rangeData.stats.chipSeqHash = {};
					resp.aggregations.ChipSeq.analyses.buckets.forEach(function(d) {
						rangeData.stats.chipSeq.push(d);
						rangeData.stats.chipSeqHash[d.key] = d;
					});

					deferred.resolve(localScope);
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
	
	var DEFAULT_QUERY_TYPES = [ConstantsService.REGION_FEATURE_GENE,ConstantsService.REGION_FEATURE_PATHWAY,ConstantsService.REGION_FEATURE_REACTION];
	
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
																nested: {
																	path: "symbol",
																	filter: {
																		term: {
																			"symbol.value": query
																		}
																	}
																}
															},
															//{
															//	nested: {
															//		path: "symbol",
															//		query: {
															//			match: {
															//				"symbol.value": query
															//			}
															//		}
															//	}
															//},
															{
																query: {
																	match: {
																		keyword: query 
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
									return symbol.value.some(function(symbolValue) {
										if(symbolValue.toUpperCase() === theTerm) {
											return true;
										}
										
										return false;
									});
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
								currentQuery.ensemblGeneId = theMatch._source.feature_cluster_id[theMatch._source.feature_cluster_id.length-1];
								
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
	
	var my_feature_ranking = {};
	my_feature_ranking[ConstantsService.REGION_FEATURE_GENE] = 1;
	my_feature_ranking[ConstantsService.REGION_FEATURE_PATHWAY] = 2;
	my_feature_ranking[ConstantsService.REGION_FEATURE_DIRECT_COMPLEX] = 3;
	my_feature_ranking[ConstantsService.REGION_FEATURE_INDIRECT_COMPLEX] = 4;
	my_feature_ranking[ConstantsService.REGION_FEATURE_TRANSCRIPT] = 5;
	my_feature_ranking[ConstantsService.REGION_FEATURE_EXON] = 6;
	my_feature_ranking[ConstantsService.REGION_FEATURE_REACTION] = 7;
	my_feature_ranking[ConstantsService.REGION_FEATURE_NEIGHBOURING_REACTION] = 8;
	my_feature_ranking[ConstantsService.REGION_FEATURE_START_CODON] = 9;
	my_feature_ranking[ConstantsService.REGION_FEATURE_STOP_CODON] = 10;
	my_feature_ranking[ConstantsService.REGION_FEATURE_SELENOCYSTEINE] = 11;
	my_feature_ranking[ConstantsService.REGION_FEATURE_UTR] = 12;
	my_feature_ranking[ConstantsService.REGION_FEATURE_CDS] = 13;
	
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
					keyword: query
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
					
					sug._source.symbol.forEach(function(symbol) {
						symbol.value.forEach(function(term) {
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
					});
					
					// A backup default
					if(theTerm===undefined) {
						if(theSecondTerm !== undefined) {
							isFirst = 1;
							theTerm = theSecondTerm;
						} else {
							isFirst = 2;
							theTerm = sug._source.symbol[0].value[0];
						}
					}
					var feature = sug._source.feature;
					var featureScore = (feature in my_feature_ranking) ? my_feature_ranking[feature] : 255;
					resultsSearch.push({term:theTerm, pos:i, isFirst: isFirst, fullTerm: theTerm+' ('+sug._source.symbol.map(function(symbol) { return symbol.value[0]; }).join(", ")+')', id:sug._id, coordinates:sug._source.coordinates, feature:feature, feature_id: sug._source.feature_id, featureScore:featureScore, feature_cluster_id:sug._source.feature_cluster_id, symbols: sug._source.symbol});
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
		getDataModel: getDataModel,
		getSampleTrackingData: getSampleTrackingData,
		getAnalysisMetadata: getAnalysisMetadata,
		
		fetchCellTerms: fetchCellTerms,
		fetchDiseaseTerms: fetchDiseaseTerms,
		fetchTissueTerms: fetchTissueTerms,
		initTree: initTree,
		// The range query core
		genShouldQuery: genShouldQuery,
		// Methods to launch query methods on specific ranges
		launch: launch,
		rangeLaunch: rangeLaunch,
		// Query methods
		getGeneLayout: getGeneLayout,
		getChartStats: getChartStats,
		getChartData: getChartData,
		getStatsData: getStatsData,
		// Misc methods
		suggestSearch: suggestSearch,
		scheduleGetRanges: scheduleGetRanges,
		my_feature_ranking: my_feature_ranking,
	};
}]);
