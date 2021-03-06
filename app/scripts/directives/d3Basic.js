(function () {
  'use strict';
/* jshint camelcase: false , quotmark: false */

  angular.module('EPICOApp.d3',[])
    .factory('d3',[function(){
	// Got rid of internal, static, d3 library
	return window.d3;
    }])



    .directive('d3Bars', ['d3',function(d3) {
      return {
        restrict: 'EA',
        scope: {
          data: "=",
          label: "@",
          onClick: "&"
        },
        link: function(scope, iElement/*, iAttrs*/) {
          var svg = d3.select(iElement[0])
              .append("svg:svg")
              .attr("width", "100%");

          // on window resize, re-render d3 canvas
          window.onresize = function() {
            return scope.$apply();
          };
          scope.$watch(function(){
              return angular.element(window)[0].innerWidth;
            }, function(){
              return scope.render(scope.data);
            }
          );

          // watch for data changes and re-render
          scope.$watch('data', function(newVals) {
            return scope.render(newVals);
          }, true);

          // define render function
          scope.render = function(data){
            // remove all previous items before render
            svg.selectAll("*").remove();

            // setup variables
            var width, height, max;
            width = d3.select(iElement[0])[0][0].offsetWidth - 20;
              // 20 is for margins and can be changed
            height = scope.data.length * 35;
              // 35 = 30(bar height) + 5(margin between bars)
            max = 98;
              // this can also be found dynamically when the data is not static
              // max = Math.max.apply(Math, _.map(data, ((val)-> val.count)))

            // set the height based on the calculations above
            svg.attr('height', height);

            //create the rectangles for the bar chart
            svg.selectAll("svg:rect")
              .data(data)
              .enter()
                .append("svg:rect")
                .on("click", function(d/*, i*/){return scope.onClick({item: d});})
                .attr("height", 30) // height of each bar
                .attr("width", 0) // initial width of 0 for transition
                .attr("x", 10) // half of the 20 side margin specified above
                .attr("y", function(d, i){
                  return i * 35;
                }) // height + margin between bars
                .transition()
                  .duration(1000) // time of duration
                  .attr("width", function(d){
                    return d.score/(max/width);
                  }); // width based on scale

            svg.selectAll("svg:text")
              .data(data)
              .enter()
                .append("svg:text")
                .attr("fill", "#fff")
                .attr("y", function(d, i){return i * 35 + 22;})
                .attr("x", 15)
                .text(function(d){return d[scope.label];});

          };
        }
      };
    }])


    .directive('d3Tree', ['d3',function(d3) {
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
	
      return {
        restrict: 'EA',
        scope: {
          treeStyle:"=",
          data: "=",
          label: "@",
          onClick: "&"
        },
        link: function(scope, iElement/*, iAttrs*/) {

          var svg = d3.select(iElement[0])
              .append("svg:svg")
              .attr("width", "100%");
          
          // These are global settings
          var svgMargin = 20;
          var expDataWidth = 60;
          var sepFromTree = 145;
          var expRadius = 15;
          var clRadius = 10;
          var expHeight = expRadius*2+10;
          var expLabelWH = 130;
          var labelsHeight = expLabelWH+20;
          
          // These are global variables
          var width, height;    
          var tree = d3.layout.tree();    
          var root;
          var vis;
          var i;
          var diagonal = d3.svg.diagonal();
          var treew;
          
          var treeDepth;
          var numNodes;
          
          var experimentsDescs;

          // on window resize, re-render d3 canvas
          window.onresize = function() {
            return scope.$applyAsync();
          };
          scope.$watch(function(){
              return angular.element(window)[0].innerWidth;
            }, function(){
              if(typeof(scope.data)==="object"){   
                return scope.render(scope.data);
              }
            }
          );

          // watch for data changes and re-render
          scope.$watchCollection('data', function(newVals) {
            if(typeof(newVals)==="object"){ 
              return scope.render(newVals);
            }
          });

          //define toogle function
          scope.toggle = function toggle(d) {
            if (d.children) {
              d.termHidden = true;
              d._children = d.children;
              d.children = null;
            } else {
              d.termHidden = false;
              d.children = d._children;
              d._children = null;
            }
          };

          //define toogleAll function
          scope.toggleAll = function toggleAll(d) {
            if (d.children) {
              d.children.forEach(toggleAll);
              scope.toggle(d);
            }
          };

          //define update function
          scope.update =  function(source,duration){
		if(duration===undefined) {
			duration = d3.event && d3.event.altKey ? 5000 : 500;
		}

            // Compute the new tree layout.
            var nodes = tree.nodes(root).reverse();

            // Update the nodes…
            var node = vis.selectAll("g.node")
                .data(nodes, function(d) { return d.id  || (d.id = ++i); });

            // Normalize for treew/depth.
            var ystep = treew/treeDepth;
            nodes.forEach(function(d) {d.y = d.depth*ystep; d.x = height-d.id*expHeight; });

            

            // Enter any new nodes at the parent's previous position.
            var nodeEnter = node.enter().append("svg:g")
                .classed({node:true})
                .attr("transform", "translate(" + source.y0 + "," + source.x0 + ")");

            //Display node horizontal lines
            nodeEnter.append("svg:line")
                         .attr("x1", function(d) { return d.children || d._children ? 30 : 30; })
                         // .attr("y1", 0)
                         .attr("y1", 20)
                         .attr("x2", width-source.y0)
                         // .attr("y2", 0)
                         .attr("y2", 20)
                         .attr("stroke-width", 1)
                         .style("display",function(d){ return (typeof(d.experimentsCount) !== 'undefined')?"inherit":  "none";})
                         .attr("stroke", function(d){return (typeof(d.experimentsCount) !== 'undefined')?"#EEE":  "#FFF";});
            
            nodeEnter.append("svg:circle")
                .attr("r", 1e-6)
                .attr('title',function(d) { return d.name+' ('+d.o+')'; })
		.attr("stroke-width", function(d) { return d.wasSeen ? 2 : 3; })
                .style("fill", function(d) {return d.color ? ( d.wasSeen ? d.color: "#EEE") : "#CCC"; })
                .style("stroke", function(d) {return d.analyzed ? ( d.color ? d.color: "rgb(232,0,0)") : ((typeof(d.experimentsCount) !== 'undefined')?"#4c00e2":  "#CCC"); })
		.on("click", function(d) { scope.toggle(d); scope.update(d); });

		
              //console.time("Jarl");
		nodeEnter.append("svg:a")
			.attr("xlink:href",function(d) { return d.o_uri; })
			.attr("target","_blank")
			.append("svg:text")
			.attr("x", function(d) { return d.children || d._children ? 30 : 30; })
			// .attr("y",-10)
			.attr("y",0)
			.attr("dy", ".35em")
			.classed({label:true})
			.attr("text-anchor", function(d) { return d.children || d._children ? "start" : "start"; })
			.text(function(d) { return d.name; })
			.style("fill-opacity", 1e-6)
			.style("font-style", function(d) { return d.color ? 'normal': 'italic'; })
			.each(function(de) {
				//console.log("Jarl: "+(treew+sepFromTree-d.y-(svgMargin/2)-30));
				wrap(d3.select(this), treew+sepFromTree-de.y-svgMargin-30);
			});

		// Display node data
		
		
		//console.log(nodeEnter);
		//nodeData.forEach(function(v,i){
		//});
		nodeEnter.each(function(de) {
			if(de.expData) {
				var thisnode = d3.select(this);
				var nodeData = de.expData; 
				
				var trueI = 0;
				nodeData.forEach(function(v,i) {
					var experimentDesc = experimentsDescs[i];
					if(experimentDesc.visible) {
						var theText = (!isNaN(v) && isFinite(v) && v !== -1)?(v===0?'0':(v<0.01?v.toExponential(1):v.toPrecision(3))):"--";
						var theX = treew+sepFromTree-de.y-(svgMargin/2)+expDataWidth*trueI;

						thisnode.append("svg:text")
							.attr("x", theX)
							.attr("y",0)
							// .attr("y",-15)
							.attr("dy", ".35em")
							.attr("text-anchor", "start")
							.text(theText)
							.style("fill", "rgb(0,0,0)");
						
						trueI++;
					}
				});

			}
		});
		// console.timeEnd("Jarl");
            


            // Transition nodes to their new position.
            var nodeUpdate = node.transition()
                .duration(duration)
                .attr("transform", function(d) {return "translate(" + d.y + "," + d.x + ")"; });

            nodeUpdate.select("circle")
                .attr("r", function(d){ return (d.experimentsCount && d.experimentsCount >0) ? expRadius: clRadius; });

            nodeUpdate.select("text")
                .style("fill-opacity", 1);

            // Transition exiting nodes to the parent's new position.
            var nodeExit = node.exit().transition()
                .duration(duration)
                .attr("transform", "translate(" + source.y + "," + source.x + ")")
                .remove();

            nodeExit.select("circle")
                .attr("r", 1e-6);

            nodeExit.select("text")
                .style("fill-opacity", 1e-6);

            // Update the links…
            var link = vis.selectAll("path.link")
                .data(tree.links(nodes), function(d) { return d.target.id; });

            // Enter any new links at the parent's previous position.
            var oDiag0 = {x: source.x0, y: source.y0};
            var diag0 = diagonal({source: oDiag0, target: oDiag0});
            link.enter().insert("svg:path", "g")
                .classed({link:true})
                .attr("d", diag0)
              .transition()
                .duration(duration)
                .attr("d", diagonal);

            // Transition links to their new position.
            link.transition()
                .duration(duration)
                .attr("d", diagonal);

            // Transition exiting nodes to the parent's new position.
            link.exit().transition()
                .duration(duration)
                .attr("d", diag0)
                .remove();

            // Stash the old positions for transition.
            nodes.forEach(function(d) {
              d.x0 = d.x;
              d.y0 = d.y;
            });
          };

          // define render function
          scope.render = function(data){
            // remove all previous items before render
            svg.selectAll("*").remove();

            //Draw headers
            if(data && data.depth){
		// setup variables
		experimentsDescs = data.experiments;
		var experimentTypes = [];
		experimentsDescs.forEach(function(experimentDesc) {
			if(experimentDesc.visible) {
				experimentTypes.push(experimentDesc.label);
			}
		});
		root = data.root;
		treeDepth = data.depth;
		numNodes = data.numNodes;
		// This has to be resetted with each tree
		i=0;
		
		//treew = width*0.27;
		treew = treeDepth*(expRadius*2)/3;
		width = treew+sepFromTree+expDataWidth*experimentTypes.length;
		if(width < d3.select(iElement[0])[0][0].offsetWidth) {
			width = d3.select(iElement[0])[0][0].offsetWidth;
		}
		
		height = labelsHeight+numNodes*expHeight;
		
		//height = (scope.style === 'detailed')?6000:1840;
              
		var gExp = svg.selectAll("g.experiment")
			.data(experimentTypes)
			.enter()
			.append("svg:g")
			.classed({experiment:true})
			.attr("transform", function(d,i) { return "translate(" + (treew+sepFromTree+i*expDataWidth ) + "," + expLabelWH + ")";});
		
		//gExp.append("svg:foreignObject")
		//	.attr("width",expLabelWH)
		//	.attr("height","50")
		//	.attr("transform","rotate(-70)")
		//	.append("xhtml:body")
		//	//.attr("style","background:transparent")
		//	//.html(function() { return '<p>'+d+'</p>'; });
		//	.style("background","transparent")
		//	.append("xhtml:p")
		//	.text(function(d) { return d; });
		gExp.append("svg:text")
			.attr("transform","translate(20,0) rotate(-70)")
			.text(function(d) { return d; })
			.call(wrap,expLabelWH);
		
		gExp.append("svg:line")
			.attr("x1", 0)
			.attr("y1", 10)
			.attr("x2", 0)
			.attr("y2", height-expLabelWH)
			.attr("stroke-width", 1)
			.attr("stroke", "#EEE");
			
		// If we activate this, in Firefox it slows down a LOT due garbage collection
		// gExp = undefined;
		
		/*	
              experimentTypes.forEach(function(d,i){
                  svg.append("svg:g")
                    .attr("transform", "translate(" + (treew+sepFromTree+i*expDataWidth ) + "," + 100 + ")") 
                    .append("svg:foreignObject")
                    .attr("width",expLabelWH)
                    .attr("height","50")
                    .attr("transform","rotate(-70)")
                    .append("xhtml:body")
                    //.attr("style","background:transparent")
                    //.html(function() { return '<p>'+d+'</p>'; });
                    .style("background","transparent")
                    .append("xhtml:p")
                    .text(d);


                  //Display headers vertical lines
                  svg.append("svg:line")
                           .attr("x1", treew+sepFromTree+i*expDataWidth)
                           .attr("y1", 200)
                           .attr("x2", treew+sepFromTree+i*expDataWidth)
                           .attr("y2", height)
                           .attr("stroke-width", 1)
                           .attr("stroke", function(d){return "#EEE"; });  
              });
		*/


              //margins
              var m = [svgMargin, svgMargin, svgMargin, svgMargin],
              w = width - m[1] - m[3],
              h = height - m[0] - m[2];

              root.x0 = h / 2;
              root.y0 = 0;

              vis = svg.attr("width", w + m[1] + m[3])
                .attr("height", h + m[0] + m[2])
                .append("svg:g")
                .attr("transform", "translate(" + m[3] + ","+m[0]+")");    

              diagonal.projection(function(d) { return [d.y, d.x]; });

              //create the graph
              tree.size([h, w]);
              tree.separation(function(a,b){
                return (a.parent && b.parent && a.parent === b.parent) ? 1 : 2;
              });

              // Initialize the display to show a few nodes.
              // root.children.forEach(scope.toggleAll);
              // scope.toggle(root.children[1]);
              // scope.toggle(root.children[1].children[2]);
              // scope.toggle(root.children[9]);
              // scope.toggle(root.children[9].children[0]);  

              scope.update(root,0);  

            }

            

          };
        }
      };
    }]);

}());
