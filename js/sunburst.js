function sunburst(csv) {

//defining useful var

var width = 400,
    height = 280,
    widthOff = width - height,
    radius = (Math.min(width, height) / 2),
    radiusOff = 0.2,
    formatNumber = d3.format(",d"),
    partition = d3.partition(),
    flatData, //keeping track of updated flattened data
    currentCategory = [], //key and value of current cat, for toggle check
    totalCalls, //total calls in the data, for reset purposes
    isDate; //boolean to check if a date is set or not

var x = d3.scaleLinear().range([0, 2 * Math.PI]),
    y = d3.scaleSqrt().range([0, radius]);

//building color scales for each category

var color = d3.scaleOrdinal()
  .domain(categories)
  .range(primaryColors);

//core structural defs

var arc = d3.arc()
    .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x0))); })
    .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x1))); })
    .innerRadius(function(d) { return Math.max(0, y(d.y0))-40; })
    .outerRadius(function(d) { return Math.max(0, y(d.y1))-30; });

//svgGlob is pointing at the global svg (sunburst+legend+focus)
var svgGlob = d3.select("#sunburst").append("svg")
    .attr("width", width)
    .attr("height", height);

//svg is pointing at the sunburst itself
var svg = svgGlob.append("g")
    .attr("transform", "translate(" + (width - widthOff)/2 + "," + (height / 2) + ")");

//info focus

var ingFocus = svgGlob.append("g")
    .attr("transform", "translate(" + (width*5)/8 + "," + (5*height/6) + ")");

var inFocus = ingFocus.append("text")
    .text("All time")
    .attr("font-family", "sans-serif")
    .attr("font-size", 14)
    .attr("text-anchor", "start");

var descFocus = ingFocus.append("text")
    .attr("transform", "translate(0," + (-height/14) + ")")
    .text("")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("text-anchor", "start");

//reset focus

var resgFocus = ingFocus.append("g")
    .classed("resFocus", true)
    .attr("transform", "translate(0," + (height/20) + ")")
    .attr("opacity", ".5")
    .attr("visibility", "hidden")
    .on("hover", function() { d3.select(this).transition().attr("opacity",1) })
    .on("click", function() {
        //reseting day with dayEvt ""
        var dayEvent = new CustomEvent('dayEvt', { detail : "" });
        //sending dayEvent to other viz
        document.dispatchEvent(dayEvent);

        inFocus.text("All time");
        d3.select(this).attr("visibility", "hidden");
    });

resgFocus.append("rect") 
    .attr("stroke-width", "2px")
    .attr("stroke", "black")
    .attr("fill", "#eee")
    .attr("width", width/8)
    .attr("height", height/10);

resgFocus.append("text")
    .attr("transform", "translate("+ width/16 + "," + (height/20 + 4) + ")")
    .text("reset")
    .attr("font-family", "sans-serif")
    .attr("font-size", 14)
    .attr("text-anchor", "middle");

//legend

var gLegend = svgGlob.append("g")
    .attr("transform", "translate(" + (width*5)/7 + "," + (height/20) + ")")

var gLegendColor = ["General"];

primaryColors.forEach( function(disColor,key) {
    if (disColor != "white") {
    
    var categoryIn = categories[key];
    var gColor = gLegend.append("g")
        .attr("transform", "translate(0," + ((key-1) * height/7) + ")")
        .attr("opacity", 1)

    gColor.append("rect")
        .attr("width", width/8)
        .attr("height", height/10)
        .attr("fill",disColor);

    gColor.append("text").text(categoryIn)
        .attr("transform", "translate(" + width/7 + "," + (height/14) + ")")
        .attr("font-family", "sans-serif")
        .attr("font-size", 14)
        .attr("text-anchor", "start");

    gLegendColor.push(gColor);
    }
});

//defining general behaviour

//initializing view on "General" category, all time
UpdateSun();

//listening to a dayEvent
document.addEventListener("dayEvt", function(e) {
    console.log("updating sunburst to", e.detail); 
    UpdateSun(e.detail, true);
    inFocus.text(e.detail);
    resgFocus.attr("visibility", "");
});


//----------
//FUNCTIONS

//getFlatData filters and builds flattened data from $csv based on $date
function getFlatData(csv, date) { 

  if (date) {
      csv = csv.filter(function(o) { return o.date === date; });
  };

  var nestedData = d3.nest()
      .key(function(d) { return d.category; })
      .key(function(d) { return d.description; })
      .rollup(function(calls) { return calls.length; })
      .entries(csv)

  var maxV = {}

  nestedData.forEach(function(cat,key) {
    nestedData[key].values = cat.values.sort(function(a, b){ 
          return d3.descending(a.value, b.value); });
    maxV[cat.key] = Math.max.apply(Math, cat.values.map(function(o){return o.value}));
    });

  var nestedData = { key:"General", values:nestedData };

  var nestedData = JSON.parse(JSON.stringify(nestedData)
    .split('"values":')
    .join('"children":')
    );

  dataTree = d3.hierarchy(nestedData).sum(function(d) { return d.value; });

  return [partition(dataTree).descendants(),maxV];
}

//UpdateSun calls getFlatData to update the sunburst with new data
function UpdateSun(date, isHeat) {
  //isDate preventing zoom toggle from happening if day selected from heatmap
  isDate = !(isHeat == null)

  //reseting path for new data
  svg.selectAll("path").remove();

  var fullFlat = getFlatData(csv,date);
  flatData = fullFlat[0];
  var maxV = fullFlat[1];
  totalCalls = flatData[0].value;
  var arcos = svg.selectAll("path").data(flatData);

  //saving old category for same zoom, or initialize
  if (currentCategory.data != null) {
      var previousCategory = currentCategory;
  } else {
      currentCategory = flatData[0];
  };

  arcos.enter().append("path")
      .attr("stroke", "white")
      .attr("stroke-width", "3px")
      .style("fill", function(d) {
        if(d.children) {
            return color(d.data.key);
        } else {
            var parentColor = d.parent.data.key;
            var localMax = maxV[parentColor];
            
            return colorRanges[parentColor](d.value/localMax);
        }
      })
      .on("click", click)

  svg.selectAll("path").append("title")
      .text(function(d) { return d.data.key + "\n" + formatNumber(d.value); });

  var arcos = svg.selectAll("path").data(flatData)

  arcos.transition()
      .duration(transitionTime/8)
      .delay(function(d,i) {
          if (categories.indexOf(d.data.key) === -1) {
              return (((d.data.value/totalCalls)/2)+0.4)*transitionTime;
          } else {
              return (i-1)*transitionTime/7;
          }
      })
      .attrTween("d", arcTweenUpdate);

  //zooming back to the previousCategory
  if (previousCategory && previousCategory.data.key != "General") {
      if(date==="") { click(flatData[0]) } else {
      //the previous category now is a different object we must retrieve
      var categoryObject = flatData.filter(function(o) { 
        return o.data.key == previousCategory.data.key && o.parent.data.key == previousCategory.parent.data.key })[0];
      click(categoryObject);};
  };

  //binding interactive legend
  gLegendColor.forEach( function(cat,key) {
        if (key != 0) {
            var categoryObject = flatData.filter(function(o) { return o.data.key == categories[key] })[0];
            gLegendColor[key].on("click", function() {
                click(categoryObject);
            });
        }
  });

}

//click defines the behaviour when clicking on an element bound
//with data $d on the sunburst
function click(d) {
  //isDate is true (and existing) if a day is currently selected
  var previousCategory = currentCategory;

  //if click on same, toggle and go back to general view
  d = (previousCategory == d && !isDate) ? flatData[0] : d

  //send category event
  var catEvent = new CustomEvent('catEvt', { detail : d });
  //sending catEvent to other viz
  document.dispatchEvent(catEvent);

  currentCategory = d;

  //linking legend
  var indexCat = categories.indexOf(d.data.key);

  if (indexCat === -1) {
    descFocus.text(d.data.key);
    indexCat = categories.indexOf(d.parent.data.key)
  } else { descFocus.text(""); };

  if (indexCat === 0) { 
    //reset
    gLegend.selectAll("g").attr("opacity", 1);
  } else {
    gLegend.selectAll("g").attr("opacity", 0.2);
    gLegendColor[indexCat].attr("opacity", 1);
  }

  svg.transition()
      .duration(transitionTime/2)
      .tween("scale", function() {
        var xd = d3.interpolate(x.domain(), [d.x0, d.x1]),
            yd = d3.interpolate(y.domain(), [d.y0, 1]),
            yr = d3.interpolate(y.range(), [d.y0 ? 100 : 0, radius]);
        return function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); };
      })
    .selectAll("path")
      .attrTween("d", function(d) { return function() { return arc(d); }; });

  isDate = false;

//return d.data.key;
}

//arcTweenUpdate allows a smooth transition and building of sunburst
function arcTweenUpdate(a,i) {
    var oi = d3.interpolate({x0: 0, x1: 0}, a);  
    function tween(t) {
      var b = oi(t);
      return arc(b);
    }
      return tween;
}

}
