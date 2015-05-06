(function () {
  'use strict';
/* jshint camelcase: false , quotmark: false */
/* global d3 */

  angular.module('blueprintApp.d3',[])
    .factory('d3',[function(){
	// Got rid of internal, static, d3 library
	return d3;
    }])



    .directive('d3Bars', ['d3',function(d3) {
      return {
        restrict: 'EA',
        scope: {
          data: "=",
          label: "@",
          onClick: "&"
        },
        link: function(scope, iElement, iAttrs) {
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
          scope.$watch('data', function(newVals, oldVals) {
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
                .on("click", function(d, i){return scope.onClick({item: d});})
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
      return {
        restrict: 'EA',
        scope: {
          style:"=",
          data: "=",
          label: "@",
          onClick: "&"
        },
        link: function(scope, iElement, iAttrs) {

          var svg = d3.select(iElement[0])
              .append("svg:svg")
              .attr("width", "100%");  
          var width, height, max;    
          var tree = d3.layout.tree();    
          var root;
          var vis;
          var i = 0;
          var diagonal = d3.svg.diagonal();
          var treew;
          var matirxw;

          // on window resize, re-render d3 canvas
          window.onresize = function() {
            return scope.$apply();
          };
          scope.$watch(function(){
              return angular.element(window)[0].innerWidth;
            }, function(){
              if(typeof(scope.data)=="object"){   
                return scope.render(scope.data);
              }
            }
          );

          // watch for data changes and re-render
          scope.$watch('data', function(newVals, oldVals) {
            if(typeof(newVals)=="object"){ 
              return scope.render(newVals);
            }
          });

          //define toogle function
          scope.toggle = function toggle(d) {
            if (d.children) {
              d._children = d.children;
              d.children = null;
            } else {
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
          scope.update =  function(source){

            var duration = d3.event && d3.event.altKey ? 5000 : 500;

            // Compute the new tree layout.
            var nodes = tree.nodes(root).reverse();

            // Update the nodes…
            var node = vis.selectAll("g.node")
                .data(nodes, function(d) { return d.id  || (d.id = ++i); });

            // Normalize for treew/depth.
            var ystep = treew/11;
            nodes.forEach(function(d) {d.y = d.depth*ystep; d.x = height-d.id*40; });

            

            // Enter any new nodes at the parent's previous position.
            var nodeEnter = node.enter().append("svg:g")
                .attr("class", "node")
                .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
                .on("click", function(d) { scope.toggle(d); scope.update(d); });

            //Display node horizontal lines
            nodeEnter.append("svg:line")
                         .attr("x1", 0)
                         .attr("y1", 0)
                         .attr("x2", 2500)
                         .attr("y2", 0)
                         .attr("stroke-width", 1)
                         .attr("stroke", function(d){return (typeof(d.experimentsCount) != 'undefined')?"#EEE":  "#FFF";});
            
            nodeEnter.append("svg:circle")
                .attr("r", 1e-6)
                .style("fill", function(d) {return d.analized ? "rgb(232,0,0)" : ((typeof(d.experimentsCount) != 'undefined')?"#FFF":  "#CCC"); })
                .style("stroke", function(d) {return d.analized ? "rgb(232,0,0)" : ((typeof(d.experimentsCount) != 'undefined')?"#4c00e2":  "#CCC"); });

            nodeEnter.append("svg:text")
                .attr("x", function(d) { return d.children || d._children ? 30 : 30; })
                .attr("y",-10)
                .attr("dy", ".35em")
                .attr("class", "label")
                .attr("text-anchor", function(d) { return d.children || d._children ? "start" : "start"; })
                .text(function(d) { return d.name; })
                .style("fill-opacity", 1e-6);

            // Display node data

           
            //console.log(nodeEnter);
            //nodeData.forEach(function(v,i){
            //});
              
            nodeEnter.each(function(de){
                  
                if (typeof de.expData != 'undefined') {


                var thisnode = d3.select(this);
                var nodeTextData = de.expData; 
                var nodeData = nodeTextData.split(",");
                
                nodeData.forEach(function(v,i){
                    thisnode.append("svg:text")
                    .attr("x", function(d) {return  treew+130-de.y+60*i; })
                    .attr("y",-15)
                    .attr("dy", ".35em")
                    .attr("text-anchor", function(d) { return "start"; })
                    .text(function(d) { return (v != -1 && v!='NaN' && v!='-Infinity')?v:"--";})
                    .style("fill", "rgb(0,0,0)"); 
                    });

              }
            });  
            


            // Transition nodes to their new position.
            var nodeUpdate = node.transition()
                .duration(duration)
                .attr("transform", function(d) {return "translate(" + d.y + "," + d.x + ")"; });

            nodeUpdate.select("circle")
                .attr("r", function(d){return (d.experimentsCount && d.experimentsCount >0) ? 15: 10; });

            nodeUpdate.select("text")
                .style("fill-opacity", 1);

            // Transition exiting nodes to the parent's new position.
            var nodeExit = node.exit().transition()
                .duration(duration)
                .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
                .remove();

            nodeExit.select("circle")
                .attr("r", 1e-6);

            nodeExit.select("text")
                .style("fill-opacity", 1e-6);

            // Update the links…
            var link = vis.selectAll("path.link")
                .data(tree.links(nodes), function(d) { return d.target.id; });

            // Enter any new links at the parent's previous position.
            link.enter().insert("svg:path", "g")
                .attr("class", "link")
                .attr("d", function(d) {
                  var o = {x: source.x0, y: source.y0};
                  return diagonal({source: o, target: o});
                })
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
                .attr("d", function(d) {
                  var o = {x: source.x, y: source.y};
                  return diagonal({source: o, target: o});
                })
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
            if(data){

              // setup variables
              width = d3.select(iElement[0])[0][0].offsetWidth;
              treew = width*0.27;
              height = (scope.style == 'detailed')?6000:1840;
              max = 98;
              root = data.root;
              var experiments = data.experiments;

              experiments.forEach(function(d,i){
                  svg.append("svg:g")
                    .attr("transform", "translate(" + (treew+165+i*60 ) + "," + 100 + ")") 
                    .append("svg:foreignObject")
                    .attr("width","150")
                    .attr("height","50")
                    .attr("transform","rotate(-70)")
                    .append("xhtml:body")
                    .attr("style","background:transparent")
                    .html(function() { return '<p>'+d+'</p>'; });


                  //Display headers vertical lines
                  svg.append("svg:line")
                           .attr("x1", treew+145+i*60)
                           .attr("y1", 200)
                           .attr("x2", treew+145+i*60)
                           .attr("y2", height)
                           .attr("stroke-width", 1)
                           .attr("stroke", function(d){return "#EEE"; });  
              });


              //margins
              var m = [20, 20, 20, 20],
              w = width - m[1] - m[3],
              h = height - m[0] - m[2];

              root.x0 = h / 2;
              root.y0 = 0;

              vis = svg.attr("width", w + m[1] + m[3])
                .attr("height", h + m[0] + m[2])
                .append("svg:g")
                .attr("transform", "translate(" + m[3] + ",-200)");    

              diagonal.projection(function(d) { return [d.y, d.x]; });

              //create the graph
              tree.size([h, w]);
              tree.separation(function(a,b){
                return a.parent == b.parent ? 1 : 2;
              });

              // Initialize the display to show a few nodes.
              // root.children.forEach(scope.toggleAll);
              // scope.toggle(root.children[1]);
              // scope.toggle(root.children[1].children[2]);
              // scope.toggle(root.children[9]);
              // scope.toggle(root.children[9].children[0]);  

              scope.update(root);  

            }

            

          };
        }
      };
    }]);

}());
