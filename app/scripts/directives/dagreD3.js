(function () {
	'use strict';
/* jshint camelcase: false , quotmark: false */

angular.module('blueprintApp.dagre-d3',[])
	.factory('dagre-d3',[
		function(){
			// Got rid of internal, static, d3 library
			return window.dagreD3;
		}
	])
	.directive('dagreD3', ['d3','dagre-d3',function(d3,dagreD3) {
		// This function is an evolution from the one available here
		// http://bl.ocks.org/mbostock/7555321
		function wrap(text, width) {
			text.each(function() {
				var text = d3.select(this);
				
				if(text.node().getComputedTextLength() > width) {
					var words = text.text().split(/\s+/).reverse(),
						lineNumber = 0,
						lineHeight = 1.1, // ems
						x = text.attr("x"),
						y = text.attr("y"),
						dy = text.attr("dy");
					
					if(x===null) {
						x = 0;
					}
					if(y===null) {
						y = 0;
					}
					if(dy!==null) {
						dy = parseFloat(dy);
					} else {
						dy = 0.0;
					}
					text.text(null);
					
					var tspan;
					var currLine;
					var word = words.pop();
					do {
						var nextCurrLine;
						if(!tspan) {
							nextCurrLine = word;
							tspan = text
								.append("tspan")
								.attr("x", x)
								.attr("y", y)
								.attr("dy", lineNumber * lineHeight + dy + "em");
							lineNumber++;
						} else {
							nextCurrLine = currLine+' '+word;
						}
						tspan.text(nextCurrLine);
						
						if (tspan.node().getComputedTextLength() > width) {
							// A multi-word line
							if(currLine) {
								// Return to previous state
								tspan.text(currLine);
							} else {
								// Keep the too-long word
								word = words.pop();
							}
							currLine = undefined;
							tspan = undefined;
						} else {
							word = words.pop();
							currLine = nextCurrLine;
						}
					} while(word || words.length > 0);
				}
			});
		}
		
		function link(scope, iElement/*, iAttrs*/) {
			var svg = d3.select(iElement[0])
				.append("svg:svg")
				.attr("width", "100%");
			
			// Create the renderer only once
			var renderFunc = new dagreD3.render();
			
			// on window resize, re-render d3 canvas
			window.onresize = function() {
				return scope.$apply();
			};
			scope.$watch(function() {
				return angular.element(window)[0].innerWidth;
			}, function() {
				if(typeof(scope.data)==="object"){   
					return scope.render(scope.data);
				}
			});
			
			// watch for data changes and re-render
			scope.$watchCollection('data', function(newVals) {
				return scope.render(newVals);
			}, true);

			// define render function
			scope.render = function(data){
				// remove all previous items before render
				svg.selectAll("*").remove();
				
				var svgGroup = svg.append("svg:g");
				
				// Create the input graph
				var graph = new dagreD3.graphlib.Graph();
				graph.setGraph({});
				graph.setDefaultEdgeLabel(function() { return {}; });
				
				// TODO: fill-in the data
				
				// The nodes
				data.graphNodes.forEach(function(node) {
					graph.setNode(node.o,{label: node.name, nodeData:node,style:"fill: "+((node.color!==undefined) ? node.color : 'white')});
				});
				
				// The edges
				data.graphEdges.forEach(function(edge) {
					graph.setEdge(edge.parent,edge.child);
				});
				
				// Round the corners of the nodes
				graph.nodes().forEach(function(v) {
					var node = graph.node(v);
					if(node!==undefined) {
						// Round the corners of the nodes
						node.rx = node.ry = 5;
					}
				});
				
				// And render!!!!
				svgGroup.call(renderFunc, graph);
				
				// Center the graph
				//var bbox = svg[0][0].getBBox();
				//var xCenterOffset = (bbox.width - graph.graph().width) / 2;
				//svgGroup.attr("transform", "translate(" + xCenterOffset + ", 20)");
				svg.attr("viewBox", "0 0 "+graph.graph().width+" "+graph.graph().height);
			};

		}
		
		return {
			restrict: 'EA',
			scope: {
				style:"=",
				data: "=",
				label: "@",
				onClick: "&"
			},
			link: link
		};
	}]);

}());
