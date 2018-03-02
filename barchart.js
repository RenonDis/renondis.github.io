function barchart(csv) {

//Spot the current state of the chart
var barday="";
var barstate="General";
var barsubstate="General";


function filterDate(csv, date){
  
  if(date || date=="") //? don't understand why second condition is needed
  {
    barday=date;
  }

  if (date && date!="") {
      barday=date;
      csv = csv.filter(function(o) { return o.date === date; });
  };
  return (csv)
}

function getdata(csv,category, subcategory){ //subcategory filled only if category filled

  stackeddata=[]
  if(category || category=="")
  {
    barstate=category
  }
  if(subcategory || subcategory=="")
  {
    barsubstate=subcategory
  }

  for(i=0;i<24;i++)
    {
     stackeddata[i] = {}
    }

  if (category && category!="General"){
    csv = csv.filter(function(o) { return o.category === category; });
  
    if(subcategory && subcategory!="General") //subcategory -> filter on desc
    { 
      console.log('subcat filter')
      console.log(subcategory)
      csv = csv.filter(function(o) { return o.description === subcategory; });
    }
    csv.forEach(function(item, index) {
      if(stackeddata[item.hour][item.description]){
          stackeddata[item.hour][item.description] = stackeddata[item.hour][item.description]+1
      }
      else{
          stackeddata[item.hour][item.description] = 1
      }
    })

  }
  else{
    csv.forEach(function(item, index) {
      if(stackeddata[item.hour][item.category]){
          stackeddata[item.hour][item.category] = stackeddata[item.hour][item.category]+1
      }
      else{
          stackeddata[item.hour][item.category] = 1
      }
    })
  }

  function getUniqueKeys(stacked){
    var keys=["hour"];
    for(i=0;i<24;i++)
    {
      keyarr=Object.keys(stacked[i])
      for(idx in keyarr)
      {
        if(keys.includes(keyarr[idx]))
        {

        }
        else
        {
          keys.push(keyarr[idx])
        }
      }
    }

    keys.splice(0,1) //remove hour
    return(keys)
  }

  keys=getUniqueKeys(stackeddata)


  var finaldata=stackeddata.map(function(data,i){
    return keys.map(function(d,j){
        var yval = 0;
        if(data[d]){yval=data[d]};
        return +yval;
      })
  })

  return(finaldata)
}

function initbarSpace(){

  var margin = {top: 20, right: 20, bottom: 30, left: 40}
  var width = 440 - margin.left-margin.right;
  var height = 350 - margin.top-margin.bottom;

  svg = d3.select("#barchart")
        .append("svg")
        .attr('class','barsvg')
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)

  ybar = d3.scaleLinear()
      .domain([0,2000])
      .rangeRound([height, 0])

  xbar = d3.scaleBand()
      .rangeRound([0, width])
      .paddingInner(0.05)
      .align(0.1)
      .domain(d3.range(24));
}

function initAxis(){
    
  var margin = {top: 20, right: 20, bottom: 30, left: 40}
  var width = 440 - margin.left-margin.right;
  var height = 350 - margin.top-margin.bottom;


  svg.append("g") 
      .attr("class", "Xbaraxis")
      .attr("transform", "translate(" + margin.left + "," + (margin.top+height) + ")")
      .call(d3.axisBottom(xbar))
      .append("text")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("x", 190)
      .attr("dy", "2.5em")
      .attr("text-anchor", "middle")
      .attr("fill", "#000")
      .text("Hour of the day")


  svg.append("g")
      .attr("class", "Ybaraxis")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .call(d3.axisLeft(ybar))
      .append("text")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("x", 2)
      .attr("dy", "-0.2em")
      .attr("text-anchor", "start")
      .attr("fill", "#000")
      .text("Number of calls")
}

function barchart(stacked) { //TODO :  reset  


  var margin = {top: 20, right: 20, bottom: 30, left: 40}
  var width = 440 - margin.left-margin.right;
  var height = 350 - margin.top-margin.bottom;
  //Create SVG element and append map to the SVG

  d3.selectAll('.barrect').remove()

  // add data points
  var cat = keys.length;
  var hours=24;
  var m = 0

  //compute the max by categories in order to have the same colorscale than on the sunburst 
  var sumByCat;
  var catmax;

  if(barstate!="General")
  {
    sumByCat = stacked.reduce(function(a,b) {
    return (a.map(function(d,i){return d+b[i]})
      );
   });
   catmax=sumByCat.reduce(function(a,b){return Math.max(a,b)})
  }


  for(i=0;i<hours;i++)
      {
       m = d3.max([d3.sum(stacked[i]),m])
      }


  ybar.domain([0,m+0.1*m])
  svg.select(".Ybaraxis")
        .transition()
        .duration(1000)
        .call(d3.axisLeft(ybar))
  
  var colorRanges = {} //dict avec "categorie"=>"fctScale"

 var categories = ["General", "Traffic", "Fire", "EMS"];
 var primaryColors = ["white","rgb(255, 66, 26)", "rgb(251, 147, 33)" , "rgb(74, 189, 172)"];

  primaryColors.forEach( function(disColor,key) {
      colorRanges[categories[key]] = d3.scaleLinear()
          .domain([-0.6, 1])
          .range(["white", disColor]);
      });


  var z = d3.scaleLinear()
            .range(['white','black'])
            .domain([0,cat])

  var g=svg.append("g").selectAll("g")
            .data(d3.stack().keys(d3.range(cat))(stacked)) 
            .enter().append("g").attr('class','bar')
            //.style("fill", function(d,i) {var c=colorThat(d,i);return c;})
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
           

  var rect=  g.selectAll("rect")
              .data(function(d) {return d;})
              .enter().append("rect")
              .attr('class','barrect')
              .attr("x", function(d, i) {return xbar(i);})
              .attr("height", height )
              //.attr("y", height + margin.top )
              .attr("y", 0 )
              .attr("width", xbar.bandwidth())

  function colorThat(data,i){
    if(barstate=="General")
    {
      //return primaryColors[categories.indexOf(keys[data.key])]
      return primaryColors[categories.indexOf(keys[Math.floor(i/hours)])]
    }
    else
    {
      var locMax = sumByCat[Math.floor(i/hours)];
      if(catmax==0)
      {
        return colorRanges[barstate](0)
      }
      else
      {
        return colorRanges[barstate](locMax/catmax)
      }
    }
  }

  d3.selectAll('.barrect').style("fill", function(d,i) {var c=colorThat(d,i);return c;})

  d3.selectAll('.barrect').append("title")
      .text(function(d,i) {
                          var count= d[1]-d[0]
                          cat = keys[Math.floor(i/hours)]
                          return(cat+' '+count)
                          });

  //bars          
  rect.transition()
      .duration(1000)
      .delay(function(d, i) { return 800 - i * 80; })
      .attr("y", function(d) {return ybar(d[1]);})
      .attr("height", function(d) {return ybar(d[0]) - ybar(d[1]);})
}


function click(d) {
  //isDate is true (and existing) if a day is currently selected
  var previousCategory = currentCategory;

  //if click on same, toggle and go back to general view
  d = (JSON.stringify(previousCategory) == JSON.stringify([d.data.key,d.data.value]) && !isDate) ? flatData[0] : d

  //send category event
  var catEvent = new CustomEvent('catEvt', { detail : d.data.key });
  //sending catEvent to other viz
  document.dispatchEvent(catEvent);
}

stacked=filterDate(csv)
stacked=getdata(stacked)

initbarSpace();
barchart(stacked)
initAxis() //call after barchart() so that axis are in front

//listening to a catEvent
document.addEventListener("catEvt", function(e) {
    console.log('catEvt');
    console.log(e.detail);

    stacked=filterDate(csv,barday)
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
    stacked=getdata(stacked,cat,subcat) 
    barchart(stacked)
    console.log(barstate,barsubstate)


});


document.addEventListener("dayEvt", function(e) {
    console.log('dayEvt')
    console.log(e.detail)
    stacked=filterDate(csv,e.detail)
    console.log(barstate,barsubstate)
    stacked=getdata(stacked,barstate,barsubstate)
    barchart(stacked)

});



}