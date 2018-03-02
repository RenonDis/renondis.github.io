function map(csv) {
  // parameters
var width = 800;
var height = 350;
var mapday="";
var mapstate="General";
var mapsubstate="General";
var colormap={'EMS':'rgb(74, 189, 172)','Traffic':'rgb(255, 66, 26)','Fire':'rgb(251, 147, 33)'};
var transtime=500;
var maxLength=3000;
var mapzoom='inactive';
var globalDiff=78;
//Create SVG element and append map to the SVG

//d3.xml("thinnerGreyMap.svg").mimeType("image/svg+xml").get(function(error, xml) {
//  if (error) throw error;
//  var m = d3.select('#map')
//  console.log(m._groups[0][0])
//  m._groups[0][0].appendChild(xml.documentElement);
//});


function filterDate(csv, date){
  
  if(date || date=="") //? don't understand why second condition is needed
  {
    mapday=date;
  }

  if (date && date!="") {
      barday=date;
      csv = csv.filter(function(o) { return o.date === date; });
  };
  return (csv)
}

function getdata(csv,category, subcategory){ //subcategory filled only if category filled

  if(category || category=="")
  {
    mapstate=category
  }
  if(subcategory || subcategory=="")
  {
    mapsubstate=subcategory
  }


  if (category && category!="General"){
    csv = csv.filter(function(o) { return o.category === category; });
  
    if(subcategory && subcategory!="General") //subcategory -> filter on desc
    { 
      console.log('map subcat filter')
      console.log(subcategory)
      csv = csv.filter(function(o) { return o.description === subcategory; });
    }
  }
  return(csv)
}

var g;
var svg;

function initMapSpace()
  {
    svg = d3.select("#map")
          .append("svg")
          .attr("width", width)
          .attr("height", height);

    g = svg.append("g")

    d3.csv("data/roads.txt", function(data) {

    var scale  = 45000;
    var offset = [width/2, height/2];
    var rotation = [26.5,24.3,12.9];

    g.append('path')
        .attr('class','roads')
        .attr("d", data.columns[0])
        .style("stroke", "grey")
        .style("stroke-width", "0.75")
        .attr('fill','None')
        .attr('transform',"scale(0.8) translate(-"+137+","+25+") rotate(-"+36+")")


    });


    d3.json("data/montgomery.json", function(json) {

    var center = d3.geoCentroid(json.features[0])
    var scale  = 45000;
    var offset = [width/2, height/2+globalDiff];
    var rotation = [26.5,24.3,12.9];

    projection = d3.geoMercator().scale(scale).center(center)
        .rotate(rotation)
        .translate(offset);

    var path = d3.geoPath()              
                 .projection(projection);        
    // Bind the data to the SVG and create one path per GeoJSON feature
    g.selectAll(".data")
      .data(json.features)
      .enter()
      .append("path")
      .attr("d", path)
      .style("stroke", "grey")
      .style("stroke-width", "0.75")
      .attr('fill','None')
      //.attr('transform',function(d) {var t = path.centroid(d.geometry);return "translate(" + [-t[0]/2,t[1]/2] + ")"} );
    }); 
  }

function draw(csv){

  d3.json("data/montgomery.json", function(json) {

    var center = d3.geoCentroid(json.features[0])
    var scale  = 45000;
    var offset = [width/2, height/2+globalDiff];
    var rotation = [26.5,24.3,12.9];

    projection = d3.geoMercator().scale(scale).center(center)
        .rotate(rotation)
        .translate(offset);

    d3.selectAll('.dot').remove()
    
    var sampledCsv;

    if(csv.length>maxLength)
    {
      console.log('sampling');
      var bucket = d3.shuffle(csv);
      sampledCsv = []
        while(sampledCsv.length < maxLength) {
      sampledCsv.push(bucket.pop());
      }
    }
    else
    {
      console.log('no sampling')
      sampledCsv=csv
    }

    finalLength=sampledCsv.length;
    
    var dots =g.selectAll('dots')
               .data(sampledCsv)
               .enter()
               .append('circle')
               .attr('class','dot')
               .attr("r", 3)
               .attr("transform", function(d) {
                  return "translate(" + projection([d.lng,d.lat]) + ")"
                  })
               .style('fill','None')


      dots.transition()
          .duration(transtime)
          .delay(function(d,i) { return i*Math.floor(transtime/finalLength) })
          .style("fill", function(d) { return colormap[d.category]; });

      dots.append("title")
      .text(function(d) {
              return(d.date+' '+d.time+' '+d.category+': '+d.description)
              });

  });


}

 //grid for zoom on click  
function buildGrid(gridData){

  d3.selectAll('.row').remove()

  var row = g.selectAll(".row")
    .data(gridData)
    .enter().append("g")
    .attr("class", "row")


  //PUT MAP FIRST IN SKOL
  var column = row.selectAll(".square")
  .data(function(d) { return d; })
  .enter().append("rect")
  .attr("class","square")
  .attr("x", function(d) { return d.x; })
  .attr("y", function(d) { return d.y; })
  .attr("width", function(d) { return d.width; })
  .attr("height", function(d) { return d.height; })
  .style("fill", "white")
  .style('opacity','0')
  .style("stroke", "#222")
  .style("stroke-width", "0.75")
  .attr('transform',"scale(0.8) translate("+100+","+60+")") //GOOD
  .on('click', function(d) {
    var transform;
    k=2.5;
    center = {
      x: 0,
      y: 0
      };
    if(mapzoom='inactive')
    {
      center = {
      x: d.x + d.width / 2,
      y: d.y + d.height / 2
      };
      mapzoom='active'
      g.transition().duration(1000).attr("transform","translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -center.x + "," + -center.y + ")");
    }
    else
    {
      g.transition().duration(1000).attr("transform","translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -center.x + "," + -center.y + ")");
    }
    })
  .on('dblclick',function(){
    if(mapzoom='active')
    {
      g.transition().duration(1000).attr("transform","translate(" + -width / 2 + "," + -height / 2 + ")scale(" + 1 + ")translate(" + width/2 + "," + height/2 + ")");
    }
  }); 
}

function gridData() {
    var data = new Array();
    var xpos = 1; //starting xpos and ypos at 1 so the stroke will show when we make the grid below
    var ypos = 1;
    var ncase= 20;
    // iterate for rows 
    for (var row = 0; row < ncase; row++) {
        data.push( new Array() );

        // iterate for cells/columns inside rows
        for (var column = 0; column < ncase; column++) {
            data[row].push({
                x: xpos,
                y: ypos,
                width: width/ncase,
                height: height/ncase
            })
            // increment the x position. I.e. move it over by 50 (width variable)
            xpos += width/ncase;
        }
        // reset the x position after a row is complete
        xpos = 1;
        // increment the y position for the next row. Move it down 50 (height variable)
        ypos += height/ncase; 
    }
    return data;
}
    
var gridData = gridData(); 


initMapSpace();
buildGrid(gridData);
data=filterDate(csv);
data=getdata(data);
draw(data);





document.addEventListener("catEvt", function(e) {

    data=filterDate(csv,mapday)
    var cat;
    var subcat;

    if(e.detail.parent)
    {
      if(e.detail.parent.data.key!="General")
      {
        cat=e.detail.parent.data.key
        subcat=e.detail.data.key
      }
      else{
        cat=e.detail.data.key
        subcat="General"
      }
    }
    else{
      cat=e.detail.data.key
      subcat="General"
    }
    data=getdata(data,cat,subcat) 
    //console.log(data)
    draw(data)

    //console.log(mapstate,mapsubstate)
});

document.addEventListener("dayEvt", function(e) {
    console.log('map dayEvt')
    data=filterDate(csv,e.detail)
    data=getdata(data,mapstate,mapsubstate)
    draw(data)
});

document.addEventListener("resetEvt", function(e) {
  console.log('reset evt')
  if(mapzoom='active')
    {
      g.transition().duration(1000).attr("transform","translate(" + -width / 2 + "," + -height / 2 + ")scale(" + 1 + ")translate(" + width/2 + "," + height/2 + ")");
    }
});


}
