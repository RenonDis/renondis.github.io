function map(csv) {
  // parameters
var width = 800;
var height = 500;
var mapday="";
var mapstate="General";
var mapsubstate="General";
var maxLength=3000;


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

function initMapSpace()
{
  var svg = d3.select("#map")
        .append("svg")
        .attr("width", width)
        .attr("height", height);
          
  g = svg
      .append("g")
      .call(d3.zoom()
      .scaleExtent([1, 8])
      .on("zoom", zoom))

  var scale  = 50000;

  d3.csv("roads.txt", function(data) {

  var offset = [width/2, height/2];
  var rotation = [26.5,24.3,12.9];


  console.log(data)
  g.append('path')
      .attr('class','roads')
      .attr("d", data.columns[0])
      .style("stroke", "grey")
      .style("stroke-width", "0.75")
      .attr('fill','None')
      .attr('transform',"scale(0.89) translate(-"+189+",-"+8+") rotate(-"+36+")")


  });


  d3.json("montgomery.json", function(json) {

  var center = d3.geoCentroid(json.features[0])
  var offset = [width/2, height/2];
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

  d3.json("montgomery.json", function(json) {

    var center = d3.geoCentroid(json.features[0])
    var scale  = 50000;
    var offset = [width/2, height/2];
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
          .delay(function(d,i) { return i*0.6*(transitionTime/finalLength) })
          .style("fill", function(d) { 
            return primaryColors[categories.indexOf(d.category)]; 
            });

      dots.append("title")
      .text(function(d) {
              return(d.date+' '+d.time+' '+d.category+': '+d.description)
              });
  });

}

initMapSpace();
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





function zoom() {
  g.attr("transform", d3.event.transform);
}

}
