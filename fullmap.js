function map(csv) {
  // parameters
var width = 960;
var height = 500;

var colormap={'EMS':'rgb(74, 189, 172)','Traffic':'rgb(255, 66, 26)','Fire':'rgb(251, 147, 33)'}
//Create SVG element and append map to the SVG
var svg = d3.select("#map")
      .append("svg")
      .attr("width", width)
      .attr("height", height);
        
var g = svg
      .append("g")
      .call(d3.zoom()
        .scaleExtent([1, 8])
        .on("zoom", zoom))

// Load GeoJSON data 
d3.json("montgomery.json", function(json) {

var center = d3.geoCentroid(json.features[0])
var scale  = 45000;
var offset = [width/2, height/2];
var rotation = [26.5,24.3,12.9];

var projection = d3.geoMercator().scale(scale).center(center)
    .rotate(rotation)
    .translate(offset);

console.log(projection);

var path = d3.geoPath()              
             .projection(projection);        
// Bind the data to the SVG and create one path per GeoJSON feature
g.selectAll("path")
  .data(json.features)
  .enter()
  .append("path")
  .attr("d", path)
  .style("stroke", "black")
  .style("stroke-width", "1")
  .attr('fill','None')
  //.attr('transform',function(d) {var t = path.centroid(d.geometry);return "translate(" + [-t[0]/2,t[1]/2] + ")"} );

// add data points


  console.log(csv);
    
  var bucket = d3.shuffle(csv);
  var sampledCsv = []

  while(sampledCsv.length < 3000) {
    sampledCsv.push(bucket.pop());
  }

  console.log(sampledCsv);

  g.selectAll('dots')
     .data(sampledCsv)
     .enter()
     .append('circle')
     .attr("r", 2)
     .attr("transform", function(d) {
        return "translate(" + projection([d.lng,d.lat]) + ")"
        })
     .style("fill", function(d) { return colormap[d.category]; });

    //dots.append("title")
    //.text(function(d) {
    //        return(d.date+' '+d.time+' '+d.category+': '+d.description)
    //        });
});  


function zoom() {
  g.attr("transform", d3.event.transform);
}
}
