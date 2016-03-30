'use strict';

/*jshint camelcase: false , quotmark: false */

angular.
module('blueprintApp').
factory('ConstantsService',function() {
	var DEFAULT_SEARCH_URI = 'http://{{dataModel.annotations.EnsemblArchive}}.archive.ensembl.org/Human/Search/Results?site=ensembl;facet_species=Human;q=';
	var REGION_SEARCH_URI = 'http://{{dataModel.annotations.EnsemblArchive}}.archive.ensembl.org/Homo_sapiens/Location/View?r=';
	var REACTOME_SEARCH_URI = 'http://www.reactome.org/content/detail/';
	var SEARCH_URIS = {
		gene: 'http://{{dataModel.annotations.EnsemblArchive}}.archive.ensembl.org/Homo_sapiens/Gene/Summary?db=core&g=',
		transcript: 'http://{{dataModel.annotations.EnsemblArchive}}.archive.ensembl.org/Homo_sapiens/Transcript/Summary?db=core&t=',
		"direct_complex": REACTOME_SEARCH_URI,
		"indirect_complex": REACTOME_SEARCH_URI,
		reaction: REACTOME_SEARCH_URI,
		"neighbouring_reaction": REACTOME_SEARCH_URI,
		pathway: REACTOME_SEARCH_URI,
		region: REGION_SEARCH_URI,
	};
	
	var REGION_FEATURE_GENE = 'gene';
	var REGION_FEATURE_TRANSCRIPT = 'transcript';
	var REGION_FEATURE_EXON = 'exon';
	var REGION_FEATURE_START_CODON = 'start_codon';
	var REGION_FEATURE_STOP_CODON = 'stop_codon';
	var REGION_FEATURE_REACTION = 'reaction';
	var REGION_FEATURE_PATHWAY = 'pathway';
	var REGION_FEATURE_NEIGHBOURING_REACTION = 'neighbouring_reaction';
	var REGION_FEATURE_INDIRECT_COMPLEX = 'indirect_complex';
	var REGION_FEATURE_DIRECT_COMPLEX = 'direct_complex';
	
	var REGION_FEATURES = [ REGION_FEATURE_GENE , REGION_FEATURE_TRANSCRIPT, REGION_FEATURE_EXON, REGION_FEATURE_START_CODON, REGION_FEATURE_STOP_CODON ];
	
	var REACTOME_FEATURES = {};
	REACTOME_FEATURES[REGION_FEATURE_REACTION] = null;
	REACTOME_FEATURES[REGION_FEATURE_PATHWAY] = null;
	REACTOME_FEATURES[REGION_FEATURE_NEIGHBOURING_REACTION] = null;
	REACTOME_FEATURES[REGION_FEATURE_INDIRECT_COMPLEX] = null;
	REACTOME_FEATURES[REGION_FEATURE_DIRECT_COMPLEX] = null;
	
	return {
		DEFAULT_FLANKING_WINDOW_SIZE: 500,
		CHR_SEGMENT_LIMIT: 2500000,	// A bit larger than largest gene
		
		METADATA_MODEL_INDEX: 'meta-model',
		METADATA_DATA_INDEX: 'metadata',
		PRIMARY_DATA_INDEX: 'primary',
		SAMPLE_TRACKING_DATA_INDEX: 'sample-tracking-data',
		EXTERNAL_DATA_INDEX: 'external',
		
		DATA_MODEL_CONCEPT: 'model',
		CV_CONCEPT: 'cv',
		CVTERM_CONCEPT: 'cvterm',
		
		DONOR_CONCEPT: 'sdata.donor',
		SPECIMEN_CONCEPT: 'sdata.specimen',
		SAMPLE_CONCEPT: 'sdata.sample',
		
		EXTERNAL_FEATURES_CONCEPT: 'external.features',
		
		DLAT_CONCEPT_M: 'dlat.m',
		PDNA_CONCEPT_M: 'pdna.m',
		EXP_CONCEPT_M: 'exp.m',
		RREG_CONCEPT_M: 'rreg.m',
		
		DLAT_CONCEPT: 'dlat.mr',
		PDNA_CONCEPT: 'pdna.p',
		EXPG_CONCEPT: 'exp.g',
		EXPT_CONCEPT: 'exp.t',
		RREG_CONCEPT: 'rreg.p',
		
		EXPERIMENT_TYPE_DNA_METHYLATION: 'DNA Methylation',
		EXPERIMENT_TYPE_CHROMATIN_ACCESSIBILITY: 'Chromatin Accessibility',
		EXPERIMENT_TYPE_MRNA_SEQ: 'mRNA-seq',
		EXPERIMENT_TYPE_CHIPSEQ_INPUT: 'ChIP-Seq Input',
		EXPERIMENT_TYPE_HISTONE_MARK: 'Histone ',
		
		LAB_WGBS_CONCEPT: 'lab.wgbs',
		LAB_MRNA_CONCEPT: 'lab.mrna',
		LAB_CHRO_CONCEPT: 'lab.chro',
		LAB_CS_CONCEPT: 'lab.cs',
		
		STATE_INITIAL: 'initial',
		STATE_SELECT_CELL_TYPES: 'selectCellTypes',
		STATE_SELECT_CHARTS: 'selectCharts',
		STATE_SHOW_DATA: 'showData',
		STATE_END: 'end',
		STATE_ERROR: 'error',
		
		FETCH_STATE_INITIAL: 'fetch_initial',
		FETCH_STATE_FETCHING: 'fetching',
		FETCH_STATE_NO_DATA: 'no_data',
		FETCH_STATE_ERROR: 'fetch_error',
		FETCH_STATE_END: 'fetch_end',
		
		TREE_STATE_INITIAL: 'tree_initial',
		TREE_STATE_FETCHING: 'tree_fetching',
		TREE_STATE_ERROR: 'tree_error',
		TREE_STATE_END: 'tree_end',
		
		DEFAULT_SEARCH_URI: DEFAULT_SEARCH_URI,
		REGION_SEARCH_URI: REGION_SEARCH_URI,
		SEARCH_URIS: SEARCH_URIS,
		
		REGION_FEATURE_GENE: REGION_FEATURE_GENE,
		REGION_FEATURE_TRANSCRIPT: REGION_FEATURE_TRANSCRIPT,
		REGION_FEATURE_START_CODON: REGION_FEATURE_START_CODON,
		REGION_FEATURE_STOP_CODON: REGION_FEATURE_STOP_CODON,
		
		REGION_FEATURE_REACTION: REGION_FEATURE_REACTION,
		REGION_FEATURE_PATHWAY: REGION_FEATURE_PATHWAY,
		REGION_FEATURE_DIRECT_COMPLEX: REGION_FEATURE_DIRECT_COMPLEX,
		REGION_FEATURE_INDIRECT_COMPLEX: REGION_FEATURE_INDIRECT_COMPLEX,
		REGION_FEATURE_NEIGHBOURING_REACTION: REGION_FEATURE_NEIGHBOURING_REACTION,
		
		REGION_FEATURES: REGION_FEATURES,
		
		isReactome: function(queryType) {
			return ( queryType in REACTOME_FEATURES);
		}
	};
});
