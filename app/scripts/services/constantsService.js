'use strict';

/*jshint camelcase: false , quotmark: false */

angular.
module('blueprintApp').
factory('ConstantsService',function() {
	var DEFAULT_SEARCH_URI = 'http://www.ensembl.org/Human/Search/Results?site=ensembl;facet_species=Human;q=';
	var REGION_SEARCH_URI = 'http://www.ensembl.org/Homo_sapiens/Location/View?r=';
	var SEARCH_URIS = {
		gene: 'http://www.ensembl.org/Homo_sapiens/Gene/Summary?db=core&g=',
		pathway: 'http://www.reactome.org/content/detail/',
		transcript: 'http://www.ensembl.org/Homo_sapiens/Transcript/Summary?db=core&t=',
		reaction: 'http://www.reactome.org/content/detail/',
		region: REGION_SEARCH_URI,
	};
	
	return {
		DEFAULT_FLANKING_WINDOW_SIZE: 500,
		CHR_SEGMENT_LIMIT: 2500000,	// A bit larger than largest gene
		
		METADATA_MODEL_INDEX: 'meta-model',
		METADATA_DATA_INDEX: 'metadata',
		PRIMARY_DATA_INDEX: 'primary',
		SAMPLE_TRACKING_DATA_INDEX: 'sample-tracking-data',
		EXTERNAL_DATA_INDEX: 'external',
		
		DONOR_CONCEPT: 'sdata.donor',
		SPECIMEN_CONCEPT: 'sdata.specimen',
		SAMPLE_CONCEPT: 'sdata.sample',
		
		CVTERM_CONCEPT: 'cvterm',
		
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
		EXPERIMENT_TYPE_HISTONE_MARK: 'Histone ',
		
		DEFAULT_SEARCH_URI: DEFAULT_SEARCH_URI,
		REGION_SEARCH_URI: REGION_SEARCH_URI,
		SEARCH_URIS: SEARCH_URIS,
		
		isReactome: function(queryType) {
			return ( queryType === 'reaction' || queryType === 'pathway');
		}
	};
});
