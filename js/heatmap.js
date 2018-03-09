function heatmap(csv) {

//useful var defs

var categories = ["General", "Traffic", "Fire", "EMS"],
    primaryColors = ["white","#ffff99","green","black"];

var width = 760,
    height = 100,
    cellSize = 13,
    formatPercent = d3.format(".1%"),
    delayFill = transitionTime/(2*365), //factor of fill propagation (0 = instant)
    legLength = 450, //width of legend
    offset = 2*cellSize; //offset of legend from the time map



//building time map

var svg = d3.select("#heat")
  .selectAll("svg")
  .data(d3.range(2016, 2018))
  .enter().append("svg")
    .attr("width", width)
    .attr("height", height)
  .append("g")
    .attr("transform", "translate(" + ((width - cellSize * 53) / 2) + "," + (height - cellSize * 7 - 1) + ")");

svg.append("text")
    .attr("transform", "translate(-6," + cellSize * 3.5 + ")rotate(-90)")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("text-anchor", "middle")
    .text(function(d) { return d; });

//each rect is a day, x is the week, y is the day of week (top to bottom)
var rect = svg.append("g")
    .attr("fill", "none")
    .attr("stroke", "#ccc")
  .selectAll("rect")
  .data(function(d) { return d3.timeDays(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
  .enter().append("rect")
    .attr("width", cellSize)
    .attr("height", cellSize)
    .attr("x", function(d) { return d3.timeWeek.count(d3.timeYear(d), d) * cellSize; })
    .attr("y", function(d) { return d.getDay() * cellSize; })
    .datum(d3.timeFormat("%Y-%m-%d"));

//underlining month on the time map
svg.append("g")
    .attr("fill", "none")
    .attr("stroke", "black")
  .selectAll("path")
  .data(function(d) { return d3.timeMonths(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
  .enter().append("path")
    .attr("d", pathMonth);


//legend

var defs = svg.append("defs");
var linearGradient = defs.append("linearGradient")
    .attr("id", "linear-gradient");

linearGradient
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "100%")
    .attr("y2", "0%");

var colorPick = {
    "General" : [0, 0.3, 0.6, 1],
    "EMS" : [0, 0.6, 0.9, 1],
    "Traffic" : [0, 0.1, 0.5, 1],
    "Fire" : [0, 0.2, 0.5, 1],
}

var color = d3.scaleLinear()
    .domain(colorPick["General"])
    .range(primaryColors);

getGradient("General");

//appending legend to the last year time map
var legend = d3.select("svg:last-of-type")
        .attr("height", 180)
	.append("g")
        .attr("width", legLength)
        .attr("transform", "translate(" + ((-legLength+width)/2) + "," + cellSize * 9 + ")")

legend.append("rect")
        .attr("stroke", "#ccc")
	.attr("width", legLength-50)
	.attr("height", cellSize)
	.style("fill", "url(#linear-gradient)")
    .attr("transform", "translate(25," + (offset) + ")");

//tooltip on day hover showing date and call number
gtooltip = legend.append("g").attr("class","toolcl")
    .attr("transform", "translate(25," + (cellSize) + ")")
    
tooltip = gtooltip.append("text")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("text-anchor", "middle")
    .text("0");

tooltip2 = gtooltip.append("text")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("text-anchor", "middle")
    .attr("transform","translate(0,-15)")
    .text("Hover the grid!");

gtooltip.append("g").attr("id","arrowtool");

var polyarrow = '<g transform="scale(0.2) translate(-50,-9)"> <polygon points="75,40.034 70.758,35.794 49.958,56.558 29.158,35.794 24.916,40.034 49.926,64.999 49.958,64.968 49.99,64.999 "></polygon></g>';

document.getElementById("arrowtool").innerHTML = polyarrow;

//minimum set to 0
legend.append("text")
    .attr("transform", "translate(25," + (offset + cellSize*2) + ")")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("text-anchor", "middle")
    .text("0");

//maximum to be set to the current maximum number of calls
var maxLeg = legend.append("text")
    .attr("transform", "translate(" + (legLength-25) + "," + (cellSize*2 + offset) + ")")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("text-anchor", "middle")


//defining general behaviour

//initializing view on "General" category
fillIn("General",csv);

//listening to a catEvent
document.addEventListener("catEvt", function(e) {
    console.log("updating heatmap to", e.detail)
    fillIn(e.detail.data.key,csv)
});

//listening to a reset event
document.addEventListener("resetEvt", function(e) {
    if (e.detail != "day") {
        console.log("reseting heat to", e.detail); 
        fillIn("General",csv);
    };
});


//-----------
//FUNCTIONS

//pathMonth outputs a string to define month path on the time map
function pathMonth(t0) {
  var t1 = new Date(t0.getFullYear(), t0.getMonth() + 1, 0),
      d0 = t0.getDay(), w0 = d3.timeWeek.count(d3.timeYear(t0), t0),
      d1 = t1.getDay(), w1 = d3.timeWeek.count(d3.timeYear(t1), t1);
  return "M" + (w0 + 1) * cellSize + "," + d0 * cellSize
      + "H" + w0 * cellSize + "V" + 7 * cellSize
      + "H" + w1 * cellSize + "V" + (d1 + 1) * cellSize
      + "H" + (w1 + 1) * cellSize + "V" + 0
      + "H" + (w0 + 1) * cellSize + "Z";
}

//getGradient redefines legend gradient based on category $c
function getGradient(c) {
    linearGradient.selectAll("stop").remove();

    colorPick[c].forEach( function(v,k) {
        var offset = String(v*100)+"%";
        linearGradient.append("stop") 
            .attr("offset", offset)   
            .attr("stop-color", primaryColors[k]);
        });
};

//fillIn injects data in the canvas, filtering on $category
function fillIn(category,csv) {

    color.domain(colorPick["General"]);
    getGradient("General");

    switch (categories.indexOf(category)) {
        case -1:
            csv = csv.filter(function(o) { return o.description === category; });
            break;
        case 0:
            break;
        default:
            csv = csv.filter(function(o) { return o.category === category; });
            color.domain(colorPick[category]);
            getGradient(category);
    };

    var data = d3.nest()
        .key(function(d) { return d.date; })
        .rollup(function(day) { return day.length })
        .entries(csv)

    var maxcalls = 0;

    data.forEach(function(day) {
        if (day.value > maxcalls) {maxcalls = day.value;}
    });

    console.log(maxcalls);
    console.log(d3.mean(data, function(d) { return d.value }));

    maxLeg.text(maxcalls);
    
    rect.classed("clikable", true)
        .transition()
        .delay(function(d,i) {return i*delayFill;})
        .attr("fill", function(d) { 
            var colorto;
            data.forEach(function(day) {
                if (day.key === d) {colorto = color(day.value/maxcalls);}
            })
            return colorto; })
        
        rect.on("mouseover", function(d) {
            var ncall = 0;
            data.forEach(function(day) {
                if (day.key === d) {ncall = day.value}
            });

            tooltip2.text(d);
            tooltip.text(ncall);
            
            gtooltip.transition()
                .attr("transform", "translate(" + (25 + ncall/maxcalls*(legLength-50)) + "," + (cellSize) + ")")
            
            d3.select(this).classed("hover",true);
            })
        .on('mouseout', function() {
            d3.select(this).classed("hover",false);
            })
        .on('click', function(day) {
            var dayEvent = new CustomEvent('dayEvt', { detail : day });
            //sending dayEvent to other viz
            document.dispatchEvent(dayEvent);
        });
};
}
