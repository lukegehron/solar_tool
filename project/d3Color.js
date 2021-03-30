	//D3 COLOR CHART

  let timeStepValue = 4;
  let ppdValue1 = 4;

  d3.select("#visualization").append('svg').attr("height", 40).attr("width", 327)
  var vis = d3.select("svg")
  var arr = d3.range(13 * timeStepValue)
  var ColorScaleArray = [];
  var dataset = [0, 2, 4, 6, 8, 10, 12];

  //position scale
  var xScale = d3.scale.linear().domain([0, 13]).range([0, 325])

  //The mystical polylinear color scale
  // var colorScale = d3.scale.linear().domain([0, 2, 3, 5, 12])
  //     .range([d3.rgb(255,255,255), d3.rgb(255,222,60), d3.rgb(218,93,127), d3.rgb(220,26,85), d3.rgb(220,26,85)])
  var colorScale = d3.scale.linear().domain([0, 6, 13])
    .range(["#ffffff", "#e2706a", "#893132"])

  vis.selectAll('rect').data(arr).enter()
    .append('rect')
    .attr({
      x: function (d) {
        return xScale(d) + 1
      },
      y: 16,
      height: 12,
      width: 25,
      stroke: d3.rgb(0, 0, 0),
      fill: function (d) {
        ColorScaleArray.push(d3.rgb(colorScale(d)));
        return colorScale(d)
      }
    });


  vis.selectAll("text") // <-- Note "text", not "circle" or "rect"
    .data(dataset)
    .enter()
    .append("text") // <-- Same here!
    .text(function (d) {
      return d;
    })
    .attr("text-anchor", "middle")
    .attr("font-family", "sans-serif")
    .attr("font-size", "9px")
    .attr({
      x: function (d) {
        return xScale(d) + 12
      },
      y: 40
    });

  vis.append("text")
    .attr("x", 0)
    .attr("y", 12)
    .text("Heatmap Legend")
    .attr("font-family", "sans-serif")
    .attr("font-size", "12px")