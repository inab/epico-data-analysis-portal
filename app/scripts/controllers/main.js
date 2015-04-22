'use strict';

/**
 * @ngdoc function
 * @name blueprintApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the blueprintApp
 */
angular.module('blueprintApp')
  .controller('MainCtrl', function($rootScope,$scope,$q, es, esFactory) {

    var pageNum = 1;
    var perPage = 50;
    var treedata = {
      'name': 'Hematopoietic cell',
      'o': 'CL:0000988',
      'children': [{
        'name': 'Hematopoietic precursor cell',
        'o': 'CL:00080001',
        'children': [{
          'name': 'Hematopoietic multipotent progenitor cell',
          'o': 'CL:0000837'
        }, {
          'name': 'Hematopoietic oligopotent progenitor cell',
          'o': 'CL:0002032',
          'children': [{
            'name': 'Common lymphoid progenitor',
            'o': 'CL:0000051'
          }, {
            'name': 'Common myeloid progenitor',
            'o': 'CL:0000049'
          }]
        }, {
          'name': 'Haematopoietic Stem Cell',
          'o': 'CL:0000037'
        }]
      }, {
        'name': 'Leukocyte',
        'o': 'CL:0000738',
        'children': [{
          'name': 'Non granular Leukocyte',
          'o': 'CL:0002087',
          'children': [{
            'name': 'Monocyte',
            'o': 'CL:0000576',
            'children': [{
              'name': 'CD14-positive, CD16-negative classical monocyte',
              'o': 'CL:0002057'
            }]
          }]
        }, {
          'name': 'Lymphocyte',
          'o': 'CL:0000542',
          'children': [{
              'name': 'Lymphocyte of B linage',
              'o': 'CL:0000945',
              'children': [{
                'name': 'Antibody secreting cell',
                'o': 'Cl:0000946',
                'children':[
                  {'name':'Plasma cell','o':'CL:0000786'}
                ]
              }, {
                'name': 'B cell',
                'o': 'CL:0000236',
                'children': [{
                  'name': 'Mature B cell',
                  'o': 'CL:0000785',
                  'children': [{
                    'name': 'Germinal center B cell',
                    'o': 'CL:0000844'
                  }]
                }]
              }]
            },

            {
              'name': 'T cell',
              'o': 'CL:0000084',
              'children': [{
                'name': 'Mature T cell',
                'o': 'CL:0002419',
                'children': [{
                  'name': 'Mature alpha-beta T cell',
                  'o': 'CL:0000791',
                  'children': [{
                    'name': 'CD8-positive, alpha-beta T cell',
                    'o': 'CL:0000625'
                  },
                  {'name':'CD4-positive, alpha-beta T cell','o':'CL:0000624'}  
                  ]
                }]
              }]
            }


          ]
        }]
      }, {
        'name': 'Myeloid cell',
        'o': 'CL:0000763',
        'children': [{
          'name': 'Granulocyte monocyte progenitor cell',
          'o': 'CL:0000557'
        }, {
          'name': 'Erythroid linage cell',
          'o': 'CL:0000764',
          'children': [{
            'name': 'Erythroblast',
            'o': 'CL:0000765 '
          }]
        }, {
          'name': 'Megacaryocite',
          'o': 'CL:0000556',
          'children': [{
            'name': 'CD34-negative, CD41-positive, CD42-positive megakaryocyte cell',
            'o': 'CL:0002026'
          }]
        }, {
          'name': 'Myeloid leukocyte',
          'o': 'CL:0000766',
          'children': [{
            'name': 'Granulocyte',
            'o': 'CL:0000094',
            'children': [{
              'name': 'Neutrophil',
              'o': 'CL:0000775',
              'children': [{
                'name': 'Mature neutrophil',
                'o': 'CL:0000096'
              }]
            }]
          }, {
            'name': 'Macrophage',
            'o': 'CL:0000235',
            'children': [{
              'name': 'Elicited Macrophage',
              'o': 'CL:0000861',
              'children': [
              {
                'name': 'Alternatively activated Macrophage',
                'o': 'CL:0000890'
              },
              {
                'name': 'Inflammatory Macrophage',
                'o': 'CL:0000863'
              }]
            }]
          }]
        }]
      }]
    };


    $scope.info = '<p><a href="http://www.blueprint-epigenome.eu/"><img src="http://dcc.blueprint-epigenome.eu/img/blueprint.png" style="float:left;height:50px;margin-right:20px;"></a>BLUEPRINT is a high impact FP7 project aiming to produce a blueprint of haemopoetic epigenomes. Our goal is to apply highly sophisticated functional genomics analysis on a clearly defined set of primarily human samples from healthy and diseased individuals, and to provide at least 100 <a href="http://ihec-epigenomes.org/research/reference-epigenome-standards/" title="IHEC reference epigenome standards">reference epigenomes</a> to the scientific community. This resource-generating activity will be complemented by research into blood-based diseases, including common leukaemias and autoimmune disease (Type 1 Diabetes), by discovery and validation of epigenetic markers for diagnostic use and by epigenetic target identification.This may eventually lead to the development of novel and more individualised medical treatments. This website will provide links to the data &amp; primary analysis generated by the project.</p>'; 

    $scope.searchButtonText = "Search";
    $scope.found = "";
    $scope.samplesOnt = [];
    $scope.samples = [];
    $scope.labs = [];
    $scope.analyses = [];
    $scope.bisulfiteSeq = [];
    $scope.rnaSeq = [];
    $scope.chipSeq = [];
    $scope.dnaseSeq = [];
    $scope.treedata = null;
    $scope.rangeQuery = {};
    $scope.geneQuery = null;
    $scope.display = 'compact';
    $scope.chromosomes = [{n:1,c:"chr",f:"images/Chromosome_1.svg"},
                    {n:2,c:"chr",f:"images/Chromosome_2.svg"},
                    {n:3,c:"chr",f:"images/Chromosome_3.svg"},
                    {n:4,c:"chr",f:"images/Chromosome_4.svg"},
                    {n:5,c:"chr",f:"images/Chromosome_5.svg"},
                    {n:6,c:"chr",f:"images/Chromosome_6.svg"},
                    {n:7,c:"chr",f:"images/Chromosome_7.svg"},
                    {n:8,c:"chr",f:"images/Chromosome_8.svg"},
                    {n:9,c:"chr",f:"images/Chromosome_9.svg"},
                    {n:10,c:"chr",f:"images/Chromosome_10.svg"},
                    {n:11,c:"chr",f:"images/Chromosome_11.svg"},
                    {n:12,c:"chr",f:"images/Chromosome_12.svg"},
                    {n:13,c:"chr",f:"images/Chromosome_13.svg"},
                    {n:14,c:"chr",f:"images/Chromosome_14.svg"},
                    {n:15,c:"chr",f:"images/Chromosome_15.svg"},
                    {n:16,c:"chr",f:"images/Chromosome_16.svg"},
                    {n:17,c:"chr",f:"images/Chromosome_17.svg"},
                    {n:18,c:"chr",f:"images/Chromosome_18.svg"},
                    {n:19,c:"chr",f:"images/Chromosome_19.svg"},
                    {n:20,c:"chr",f:"images/Chromosome_20.svg"},
                    {n:"X",c:"chr",f:"images/Chromosome_X.svg"},
                    {n:"Y",c:"chr",f:"images/Chromosome_Y.svg"}
                  ];

    $scope.results = null;

    var getAnalyses = function() {

      var deferred = $q.defer();
      es.search({
        size:10000000,
        body:{
            query : {
              filtered : {
                  filter : {
                      bool:{
                        must:[
                            {exists : { field : 'experiment_id' }},
                            {missing : { field : 'experiment_type' }}
                        ]  
                      }
                      
                  }
              }
          }

        }
      },function(err,resp){

        if(typeof(resp.hits.hits) !== undefined){
          resp.hits.hits.forEach(function(d, i) {
            var  a = {};
            a.experiment_id = d._source.experiment_id;
            a.analysis_id = d._source.analysis_id;
            $scope.analyses.push(a)
          });
          deferred.resolve();
        }else{
          return deferred.reject(err);
        }

      });
      return deferred.promise;
    };

    var getLabs = function() {

      var deferred = $q.defer();
      es.search({
        size:1000,
        body:{
            query : {
              filtered : {
                  filter : {
                      bool:{
                        must:[
                            {exists : { field : 'experiment_id' }},
                            {exists : { field : 'experiment_type' }}
                        ]  
                      }
                      
                  }
              }
          }

        }
      },function(err,resp){

        if(typeof(resp.hits.hits) != 'undefined'){
          resp.hits.hits.forEach(function(d, i) {
            var  l = {};
            l.type  = d._type;
            l.sample_id = d._source.analyzed_sample_id;
            l.experiment_id = d._source.experiment_id;
            l.experiment_type = d._source.experiment_type;

            if(typeof(l.analyses) == 'undefined'){
              l.analyses = [];
              $scope.analyses.forEach(function(d,i){
                if (d.experiment_id == l.experiment_id){
                    l.analyses.push(d.analysis_id);
                }
              })
            }
            $scope.labs.push(l)
          });
          deferred.resolve();
        }else{
          return deferred.reject(err);
        }

      });
      return deferred.promise;
    };

    var getWgbsData = function() {      
      var deferred = $q.defer();
      es.search({
        size:10000000,  
        type: 'dlat.cpg',
        search_type: 'count',
        body: {
          query: {
            filtered: {
              filter: {
                bool: {
                  must: [{
                    term: {
                      chromosome: $scope.rangeQuery.chr
                    }
                  }, {
                    range: {
                      chromosome_start: {
                        gte:  $scope.rangeQuery.start
                      }
                    }
                  }, {
                    range: {
                      chromosome_start: {
                        lte:  $scope.rangeQuery.end 
                      }
                    }
                  }, ]
                }
              }
            }
          },
          aggs: {
            analyses: {
              terms: {
                field: 'analysis_id'
              },
              aggs: {
                ave_meth_level: {
                  avg: {
                    field: 'meth_level'
                  }
                }
              }
            }
          }
        }
      },function(err,resp) {
        if(typeof(resp.aggregations) !== undefined){  
          resp.aggregations.analyses.buckets.forEach(function(d, i) {
            $scope.bisulfiteSeq.push(d)
          });
          deferred.resolve();
        }else{
          return deferred.reject(err); 
        }
      });
      
      return deferred.promise;
    };

    var getRnaSeqData = function() {      
      var deferred = $q.defer();
      es.search({
        size:10000000,  
        type: 'exp.g',
        search_type: 'count',
        body: {
          query: {
            filtered: {
              filter: {
                bool: {
                  must: [{
                    term: {
                      chromosome: $scope.rangeQuery.chr
                    }
                  }, {
                    range: {
                      chromosome_start: {
                        gte:  $scope.rangeQuery.start
                      }
                    }
                  }, {
                    range: {
                      chromosome_end: {
                        lte:  $scope.rangeQuery.end 
                      }
                    }
                  }, ]
                }
              }
            }
          },
          aggs: {
            analyses: {
              terms: {
                field: 'analysis_id'
              },
              aggs: {
                ave_normalized_read_count: {
                  avg: {
                    field: 'normalized_read_count'
                  }
                }
              }
            }
          }
        }
      },function(err,resp) {
        if(typeof(resp.aggregations) !== undefined){  
          resp.aggregations.analyses.buckets.forEach(function(d, i) {
            $scope.rnaSeq.push(d)
          });
          deferred.resolve();
        }else{
          return deferred.reject(err); 
        }
      });
      
      return deferred.promise;
    };

    var getDnaseData = function() {      
      var deferred = $q.defer();
      es.search({
        size:10000000,  
        type: 'rreg.p',
        search_type: 'count',
        body: {
          query: {
            filtered: {
              filter: {
                bool: {
                  must: [{
                    term: {
                      chromosome: $scope.rangeQuery.chr
                    }
                  }, {
                    range: {
                      chromosome_start: {
                        gte:  $scope.rangeQuery.start
                      }
                    }
                  }, {
                    range: {
                      chromosome_end: {
                        lte:  $scope.rangeQuery.end 
                      }
                    }
                  }, ]
                }
              }
            }
          },
          aggs: {
            analyses:{
              terms:{
                field: 'analysis_id'
              },
              aggs:{
                peak_size: {
                  sum: {
                    script: "doc['chromosome_end'].value - doc['chromosome_start'].value" 
                  }
                }
              }
            }
          }


        }
      },function(err,resp) {
        if(typeof(resp.aggregations) !== undefined){  
          resp.aggregations.analyses.buckets.forEach(function(d, i) {
            $scope.dnaseSeq.push(d)
          });
          deferred.resolve();
        }else{
          return deferred.reject(err); 
        }
      });
      
      return deferred.promise;
    };

    var getChipSeqData = function() {      
      var deferred = $q.defer();
      es.search({
        size:10000000,  
        type: 'pdna.p',
        search_type: 'count',
        body: {
          query: {
            filtered: {
              filter: {
                bool: {
                  must: [{
                    term: {
                      chromosome: $scope.rangeQuery.chr
                    }
                  }, {
                    range: {
                      chromosome_start: {
                        gte:  $scope.rangeQuery.start-500
                      }
                    }
                  }, {
                    range: {
                      chromosome_end: {
                        lte:  $scope.rangeQuery.end+500 
                      }
                    }
                  }, ]
                }
              }
            }
          },
          aggs: {
            histones: {
              terms: {
                field: 'protein_stable_id'
              },
              aggs: {
                analyses:{
                  terms:{
                    field: 'analysis_id'
                  },
                  aggs:{
                    peak_size: {
                      sum: {
                        script: "doc['chromosome_end'].value - doc['chromosome_start'].value" 
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },function(err,resp) {
        if(typeof(resp.aggregations) !== undefined){  
          resp.aggregations.histones.buckets.forEach(function(d, i) {
            $scope.chipSeq.push(d)
          });
          deferred.resolve();
        }else{
          return deferred.reject(err); 
        }
      });
      
      return deferred.promise;
    };

    var getSamples = function() {

      var deferred = $q.defer();
      es.search({
        type: 'sdata.sample',
        size: 1000,
      },function(err,resp){

        if(typeof(resp.hits.hits) !== undefined){
          resp.hits.hits.forEach(function(d, i) {
            var s = {};
            s.analyzed_sample_type_other = d._source.analyzed_sample_type_other;
            s.sample_id = d._source.sample_id;
            s.ontology = d._source.purified_cell_type;
            s.markers = d._source.markers;
            s.experiments = [];
            $scope.labs.forEach(function(d,i){
               if(d.sample_id == s.sample_id){
                  s.experiments.push(d);
               } 
            });  
            $scope.samplesOnt.push(s.ontology);
            $scope.samples.push(s)
          });
          deferred.resolve();
          console.log($scope.samples);
        }else{
          return deferred.reject(err);
        }

      });
      return deferred.promise;
    };

    var getHistoneData = function(d,histone){
        
        var exp = 0;
        var value = 0;
        d.analyses.forEach(function(v,k){
            $scope.chipSeq.forEach(function(a,b){
              if(a.key == histone){
                //console.log(a);
                a.analyses.buckets.forEach(function(c,d){
                  if(c.key == v){
                      value += parseFloat(c.peak_size.value);
                      exp++;
                  }
                });
              }
            });
        });
        if(exp > 0){
         
          var region = ($scope.rangeQuery.end+500) - ($scope.rangeQuery.start-500);
           console.log(region);
          value = (((value/region)*100).toPrecision(2));
        }
        return value; 
    }

    var populateBasicTree = function(o) {
        for (var i in o) {
            if (typeof(o[i])=="object" && typeof(o[i].expData) == 'undefined') {
                var aggregated_statistics = [0,0,0,0,0,0,0,0,0,0,0,0];
                var childrens = [0,0,0,0,0,0,0,0,0,0,0,0];
                $scope.samples.forEach(function(s){
                    if(s.ontology == o[i].o){
                      o[i].analized = true;
                      var newNode = {};
                      var statistics = [0,0,0,0,0,0,0,0,0,0,0,0];
                      s.experiments.forEach(function(d,j){
                          //console.log(d);
                          if(d.experiment_type == 'DNA Methylation'){
                            var methExp = 0;
                            d.analyses.forEach(function(v,k){
                                $scope.bisulfiteSeq.forEach(function(a,b){
                                  if(a.key == v){
                                      statistics[0] += a.ave_meth_level.value;
                                      methExp++;
                                  }
                                });
                            });
                            if(methExp > 0){
                              statistics[0] = (((statistics[0]/methExp)*100).toPrecision(2));
                              childrens[0]++;
                            }else{
                              statistics[0] = -1;
                            }
                            
                          }
                          if(d.experiment_type == 'Chromatin Accessibility'){
                            var dnaseSeqExp = 0;
                            d.analyses.forEach(function(v,k){
                                $scope.dnaseSeq.forEach(function(a,b){
                                  if(a.key == v){
                                      statistics[1] += a.peak_size.value;
                                      dnaseSeqExp++;
                                  }
                                });
                            });
                            if(dnaseSeqExp > 0){
                              var region = $scope.rangeQuery.end - $scope.rangeQuery.start;
                              statistics[1] = (((statistics[1]/region)*100).toPrecision(2));
                              childrens[1]++;
                            }else{
                              statistics[1] = -1;
                            }
                          }
                          if(d.experiment_type == 'mRNA-seq'){
                            var rnaSeqExp = 0;
                            d.analyses.forEach(function(v,k){
                                $scope.rnaSeq.forEach(function(a,b){
                                  if(a.key == v){
                                      statistics[2] += parseFloat(a.ave_normalized_read_count.value).toPrecision(2);
                                      rnaSeqExp++;
                                  }
                                });
                            });
                            if(rnaSeqExp > 0){
                              statistics[2] = (statistics[2]/rnaSeqExp);
            
                              childrens[2]++;
                            }else{
                              statistics[2] = -1;
                            }
                          }
                          if(d.experiment_type == 'Histone H3K27ac'){
 
                            statistics[3] = getHistoneData(d,'H3K27ac');
                            if(statistics[3]>0){
                              childrens[3]++;
                            }else{
                              statistics[3] = -1;
                            }
                          }
                          if(d.experiment_type == 'Histone H3K27me3'){
                            
                            statistics[4] = getHistoneData(d,'H3K27me3');
                            if(statistics[4]>0){
                              childrens[4]++;
                            }else{
                              statistics[4] = -1;
                            }
                          }
                          if(d.experiment_type == 'Histone H3K4me1'){
                            
                            statistics[5] = getHistoneData(d,'H3K4me1');
                            if(statistics[5]>0){
                              childrens[5]++;
                            }else{
                              statistics[5] = -1;
                            }
                          }
                          if(d.experiment_type == 'Histone H3K4me3'){
                            
                            statistics[6] = getHistoneData(d,'H3K4me3');
                            if(statistics[6]>0){
                              childrens[6]++;
                            }else{
                              statistics[6] = -1;
                            }
                          }
                          if(d.experiment_type == 'Histone H3K9me3'){
                            
                            statistics[7] = getHistoneData(d,'H3K9me3');
                            if(statistics[7]>0){
                              childrens[7]++;
                            }else{
                              statistics[7] = -1;
                            }
                          }
                          if(d.experiment_type == 'Histone H3K36me3'){
                            
                            statistics[8] = getHistoneData(d,'H3K36me3');
                            if(statistics[8]>0){
                              childrens[8]++;
                            }else{
                              statistics[8] = -1;
                            }
                          }
                          if(d.experiment_type == 'Histone H2A.Zac'){
                            
                            statistics[9] = getHistoneData(d,'H2A_Zac');
                            if(statistics[9]>0){
                              childrens[9]++;
                            }else{
                              statistics[9] = -1;
                            }
                          }
                          if(d.experiment_type == 'Histone H3K9/14ac'){
                            
                            statistics[10] = getHistoneData(d,'H3K9/14ac');
                            if(statistics[10]>0){
                              childrens[10]++;
                            }else{
                              statistics[10] = -1;
                            }
                          }
                      })
                      newNode.expData =  statistics[0]+','+statistics[1]+','+statistics[2]+','+statistics[3]+','+statistics[4]+','+statistics[5]+','+statistics[6]+','+statistics[7]+','+statistics[8]+','+statistics[9]+','+statistics[10];
                      
                      if(statistics[0] != -1)
                        aggregated_statistics[0] += parseFloat(statistics[0]);
                      if(statistics[1] != -1)
                        aggregated_statistics[1] += parseFloat(statistics[1]);
                      if(statistics[2] != -1)
                        aggregated_statistics[2] += parseFloat(statistics[2]);
                      if(statistics[3] != -1)
                        aggregated_statistics[3] += parseFloat(statistics[3]);
                      if(statistics[4] != -1)
                        aggregated_statistics[4] += parseFloat(statistics[4]);
                      if(statistics[5] != -1)
                        aggregated_statistics[5] += parseFloat(statistics[5]);
                      if(statistics[6] != -1)
                        aggregated_statistics[6] += parseFloat(statistics[6]);
                      if(statistics[7] != -1)
                        aggregated_statistics[7] += parseFloat(statistics[7]);
                      if(statistics[8] != -1)
                        aggregated_statistics[8] += parseFloat(statistics[8]);
                      if(statistics[9] != -1)
                        aggregated_statistics[9] += parseFloat(statistics[9]);



                      newNode.name = s.sample_id;
                      newNode.experimentsCount = s.experiments.length;

                      if(typeof(o[i].children) == 'undefined'){
                        o[i].children = [];
                      }  
                      if($scope.display == 'detailed'){
                        o[i].children.push(newNode);
                      }
                    }
                });
                if(typeof(o[i].expData) == 'undefined'){
                  //console.log(o[i]);
                  o[i].expData = (aggregated_statistics[0]/childrens[0]).toPrecision(2)+','+(aggregated_statistics[1]/childrens[1]).toPrecision(2)+','+(aggregated_statistics[2]/childrens[2]).toPrecision(2)+','+(aggregated_statistics[3]/childrens[3]).toPrecision(2)+','+(aggregated_statistics[4]/childrens[4]).toPrecision(2)+','+(aggregated_statistics[5]/childrens[5]).toPrecision(2)+','+(aggregated_statistics[6]/childrens[6]).toPrecision(2)+','+(aggregated_statistics[7]/childrens[7]).toPrecision(2)+','+(aggregated_statistics[8]/childrens[8]).toPrecision(2)+','+(aggregated_statistics[9]/childrens[9]).toPrecision(2)+','+(aggregated_statistics[10]/childrens[20]).toPrecision(2);
                }
                populateBasicTree(o[i]);
            }
        }
        return o;
    } 

    var initTree = function(){
      console.log("initializing tree");
      $scope.treedata = populateBasicTree(treedata); 
      $scope.searchButtonText = "Search";
    }

    var updateChromosomes = function(){
        console.log('Updating chromosome data '+$scope.rangeQuery.chr);
        var chr = $scope.rangeQuery.chr;
        $scope.chromosomes.forEach(function(d,i){
            if(d.n == chr){
              d.c = "chr_active";
            }else{
              d.c = "chr";
            }  
        }) 

    }

    var getGeneRange = function(){
      var deferred = $q.defer();
      es.search({
        type: 'external.gencode',
        size: 1000,
        body: {
          query:{
            filtered:{
              query:{
                match: {
                  symbol:$scope.geneQuery 
                }
              },
              filter:{
                term:{
                  feature:"gene"
                }
              }
            }
          }
        }
      },function(err,resp){

        if(typeof(resp.hits.hits) !== undefined){
          $scope.rangeQuery.chr = resp.hits.hits[0]._source.chromosome;
          $scope.rangeQuery.start = resp.hits.hits[0]._source.chromosome_start;
          $scope.rangeQuery.end = resp.hits.hits[0]._source.chromosome_end;
          $scope.found = "Displaying information from region: Chr "+$scope.rangeQuery.chr+":"+$scope.rangeQuery.start+"-"+$scope.rangeQuery.end+ " (Gene: "+$scope.geneQuery+")";
          updateChromosomes();
          deferred.resolve();

        }else{
          return deferred.reject(err);
        }

      });
      return deferred.promise;
    }

    var preprocessQuery = function(){

      console.log('Runing preprocessQuery');
      var deferred = $q.defer();
      
      var q = $scope.query.trim();
      var m = q.match('chr(.*):(.*)-(.*)');
      var react = q.match('REACT_');

      //range query
      if(m){
          $scope.rangeQuery.chr   = m[1];
          $scope.rangeQuery.start = m[2];
          $scope.rangeQuery.end   = m[3];
          $scope.found = "Displaying information from region: Chr "+$scope.rangeQuery.chr+":"+$scope.rangeQuery.start+"-"+$scope.rangeQuery.end;
          updateChromosomes();
          deferred.resolve();
      }else if(react){

      }else{
        $scope.geneQuery = q;  
        var promise = deferred.promise;
        promise = promise.then(getGeneRange);
        deferred.resolve();
      } 
      return deferred.promise;
    }




    $scope.search = function(){

        $scope.found = "";
        $scope.samplesOnt = [];
        $scope.samples = [];
        $scope.labs = [];
        $scope.analyses = [];
        $scope.bisulfiteSeq = [];
        $scope.rnaSeq = [];
        $scope.chipSeq = [];
        $scope.dnaseSeq = [];
        $scope.treedata = null;
        $scope.rangeQuery = {};
        $scope.geneQuery = null;

        $scope.searchButtonText = "Searching...";

        var deferred = $q.defer();
        var promise = deferred.promise;
        promise = promise.then(preprocessQuery)
                         .then(getAnalyses)
                         .then(getLabs)
                         .then(getWgbsData)
                         .then(getRnaSeqData)
                         .then(getChipSeqData)
                         .then(getDnaseData)
                         .then(getSamples)
                         .then(preprocessQuery)
                         .then(initTree);
        deferred.resolve();
    }   
  });
