d3.csv("911_clean.csv", function(error, csv) {
    if (error) throw error;

    var data = d3.nest()
        .key(function(d) { return d.date; })
        .rollup(function(day) { return day.length })
        .entries(csv)

    console.log(data[0].key);

    var maxcalls = 0;
	var mincalls = 500;
	var callsDist = [];

        data.forEach(function(day) {
            if (day.value > maxcalls) {maxcalls = day.value;}
        });

        data.forEach(function(day) {
			callsDist.push(day.value);
        });


	var data = callsDist;
console.log(data);
   
var formatCount = d3.format(",.0f");

var svg = d3.select("svg"),
    margin = {top: 10, right: 30, bottom: 30, left: 30},
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom,
    g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var x = d3.scaleLinear().domain([0,maxcalls])
    .rangeRound([0, width]);

var bins = d3.histogram()
    .thresholds(x.ticks(30))
    (data);

console.log(bins);

var y = d3.scaleLinear()
    .domain([0, d3.max(bins, function(d) { return d.length; })])
    .range([height, 0]);

var bar = g.selectAll(".bar")
  .data(bins)
  .enter().append("g")
    .attr("class", "bar")
    .attr("transform", function(d) { return "translate(" + x(d.x0) + "," + y(d.length) + ")"; });

bar.append("rect")
    .attr("x", 1)
    .attr("width", x(bins[0].x1) - x(bins[0].x0) - 1)
    .attr("height", function(d) { return height - y(d.length); });

bar.append("text")
    .attr("dy", ".75em")
    .attr("y", 6)
    .attr("x", (x(bins[0].x1) - x(bins[0].x0)) / 2)
    .attr("text-anchor", "middle")
    .text(function(d) { return formatCount(d.length); });

g.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));


});
