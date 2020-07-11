let chart1 = dc.rowChart("#chart1");
let chart2 = dc.rowChart("#chart2");
let chart = null;
let reds = d3.schemeReds[7];
let auxMap = d3.map();
let states;
let width = 400;
let dataMap;
let dataset;
let widthPc = 500;
let heightPc = 900;

function dataMapCallback(data){
    let rateMap = d3.map()
                data.forEach(function(d) {
                    if(rateMap.get(d.State) == undefined){
                    rateMap.set(d.State, 1)
                    }else{
                    rateMap.set(d.State, rateMap.get(d.State) + 1)
                    }
                })
    return rateMap
}

function statesCallback(data, rateMap){
    data.features.forEach(d => {
    if(rateMap.get(d.properties.NAME) == undefined){
        rateMap.set(d.properties.NAME, 0)
    }
    d.properties.cases = rateMap.get(d.properties.NAME)
    })

    return data   
}

function datasetCallback(data){
    data.forEach(function(r) {
        r.Year = r.Date.slice(-4);
        let obj = {};
        obj["Year"] = r.Year;
        if(r.Race == 'Asian American' || r.Race == 'Asian'){
            obj["Race"] = "Asian";
        }else if(r.Race == 'Black' || r.Race  == 'Black American or African American') { 
            obj["Race"] = "Black";
        }else if(r.Race == 'White' || r.Race == 'White American or European American'){
            obj["Race"] = "White";
        }else if (r.Race == "Unknown"){
            obj["Race"] = r.Race;
        }else{
            obj["Race"] = "Others";
        }
        auxMap.set(r.Id, obj);
    })
    return data
}
let statesPromise = states = d3.json("https://gist.githubusercontent.com/thaisnl/50af6062fdc7a2b5dedb18b89f478fe2/raw/185eef41661d40adb326873538fc12db0059bb58/statesgeojson.json");
let dataMapPromise = d3.csv("https://gist.githubusercontent.com/thaisnl/"+
                            "51f70f86be7ed828b95cbca7118cfb4a/raw/532d6ac2"+
                            "30db39b95e7a1d067850a9983df5782b/MassShootings.csv");
let datasetPromise = d3.csv("https://gist.githubusercontent.com/nandabezerran/ead62cdad2f5a94e50f6f9b3c5b33ce2/raw/395bcb12e698c9b3faecb06727200c8a8f48dfcb/MassShootings.csv");

let svg = d3.select("#pieChart").append("svg")
                .attr('class', 'pie')
                .attr("width", widthPc)
                .attr("height", heightPc)
                .append("g")
                .attr("transform", "translate(" + widthPc / 2 + "," + heightPc / 2 + ")");
                
Promise.all([statesPromise, dataMapPromise, datasetPromise])
       .then(function([statesR, dataMapR, datasetR]){
            dataMap = dataMapCallback(dataMapR);
            states = statesCallback(statesR, dataMap);
            dataset = datasetCallback(datasetR);
            let facts = crossfilter(dataset);
            let mapColorScale = d3.scaleQuantize()
                                  .domain([0, 20])
                                  .range(reds);
            
            let map = L.map('map').setView([39.3937622,-100.6949527], 4);
                L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png', {
                  attribution: `&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>,
               Map tiles by &copy; <a href="https://carto.com/attribution">CARTO</a>`,
                  maxZoom: 18
              }).addTo(map)
                L.geoJson().addTo(map);
            
            let stateDim = facts.dimension(d => d.State);
            let causeDim = facts.dimension(d => d.Cause);
            let targetDim = facts.dimension(d => d.Target);
            let causeGroup = causeDim.group();
            let targetGroup = targetDim.group().reduceSum(_ => 1);
            let idDimension = facts.dimension(d => d.Id);
            let idGrouping = idDimension.group();
            
            let nested_data = d3.nest()
            .key(function(e) {if(e.Race == 'Asian American' || e.Race == 'Asian'){return 'Asian'}
                             else if(e.Race == 'Black' || e.Race == 'Black American or African American'){return 'Black'}
                             else if(e.Race == 'White' || e.Race == 'White American or European American'){return 'White'}
                             else if(e.Race == 'Unknown'){return 'Unknown'}
                             else{return 'Others'}
                             })
            .rollup(function(v) {return v.length})  
            .entries(dataset); 
           
            nested_data = nested_data.filter(function (n){return n.value > 0;});
            let data = nested_data.sort(function(a, b){return a.value - b.value})    
            
            let pie = d3.pie()
                        .padAngle(0.005)
                        .sort(null)
                        .value(d => d.value);
            
            let marginPie = 40;
            
            let radius = widthPc/ 2 - marginPie;
            
            let biggerArc = d3.arc().outerRadius(radius - 110).innerRadius(radius - 20);
            
            let normalArc = d3.arc().outerRadius(radius - 30).innerRadius(radius - 100);

            let targetXScale = d3.scaleLinear()
                                 .domain([0, 25])
                                 .range([0, width - 100])
            
            let causeXscale = d3.scaleLinear()
                                 .domain([0, 30])
                                 .range([0, width - 100])
            
            let format = d3.format(".2f");
                        d3.select('#buttonReset').remove()

            let buttonReset = d3.select('#buttonSpace')
              .append('div')
              .attr('id', 'buttonReset')
              .attr('class', 'hidden')
              
              buttonReset.append('span').attr('class','material-icons').node().innerHTML = 'replay';    
                      
            function resetFilters(){
                chart.update(filterRaceData('all'));
                stateDim.filterFunction(function(d) {
                  return d;
                });
                dc.filterAll(); 
                map.setView([39.3937622,-100.6949527], 4)
                dc.redrawAll();
                hideButton()
            }
            function style(feature) {
                return {
                    fillColor: mapColorScale(feature.properties.cases),
                    weight: 2,
                    opacity: 1,
                    color: 'white',
                    dashArray: '3',
                    fillOpacity: 0.7
                };
            }  
            function hideButton() {
                const t = d3.select("#buttonReset");
                t.classed("hidden", true);
            }
            function showButton() {
                const t = d3.select("#buttonReset");
                console.log(t)
                t.classed("hidden", false);
              }

            document.getElementById("buttonReset").onclick = resetFilters;
            
            function onlyUnique(value, index, self) { 
                return self.indexOf(value) === index;
            }
            function updateFilters(e){ 
                let state = e.target.feature.properties.NAME;

                
                chart.update(filterRaceData(state));
                
                stateDim.filterFunction(function(d) {
                    return d == state;
                });
                map.fitBounds(e.target.getBounds());
                dc.redrawAll();
                showButton();

            }              
            function getFilteredData() {
                let ids = idGrouping.all()
                let todisplay = new Array(ids.length);
                let c = 0;
                for (let i = 0; i < ids.length; i++){
                  let tId = ids[i];
                  if(tId.value > 0){
                    todisplay[c] = auxMap.get(tId.key)
                    c = c + 1
                  }
                }
                todisplay.length = c;
                let pieData = d3.nest()
                    .key(e => e.Race)
                    .rollup(d => d3.sum(d, function(e) {return 1}))
                    .entries(todisplay)
                pieData.sort((a,b) => a.value - b.value); 
                return pieData;
            }
            function updateFiltersDc(){
                chart.update(getFilteredData());
                showButton();
             }
            function filterRaceData(s){
                let nested = d3.nest()
                 .key(function(e) {if(e.Race == 'Asian American' || e.Race == 'Asian'){return 'Asian'}
                                  else if(e.Race == 'Black' || e.Race == 'Black American or African American'){return 'Black'}
                                  else if(e.Race == 'White' || e.Race == 'White American or European American'){return 'White'}
                                  else if(e.Race == 'Unknown'){return 'Unknown'}
                                  else{return 'Others'}
                                  })
                 .rollup(function(v) {if(s!= 'all'){return v.filter(function (n){return n.State===s;}).length;} else {return v.length}})  
                 .entries(dataset, s); 
                
                nested = nested.filter(function (n){return n.value > 0;});
               return nested.sort(function(a, b){return a.value - b.value})
            }
            //Defining GeoJson
            function highlightFeature(e) {
                let layer = e.target;
            
                layer.setStyle({
                weight: 5,
                color: '#666',
                dashArray: '',
                fillOpacity: 0.7
            });
            
                if (!L.Browser.ie && !L.Browser.opera) {
                    layer.bringToFront();
                }
            
                info.update(layer.feature);
            }
            
            let geojson;
            
            function resetHighlight(e) {
                geojson.resetStyle(e.target);
                info.update();
            }
            
            function zoomToFeature(e) {
                map.fitBounds(e.target.getBounds());
            }
            
            function onEachFeature(feature, layer) {
                layer.on({
                            mouseover: highlightFeature,
                            mouseout: resetHighlight,
                            click: updateFilters
                        });
            }

            //Info Control
            let info = L.control()
            info.onAdd = function (map) {
                this._div = L.DomUtil.create('div', 'info');
                this.update();
                return this._div;
            }
            info.update = function (feat) {
                    this._div.innerHTML = '<h5>Número de tiroteios em massa</h5>' +  (feat ?
                        '<b>' + feat.properties.NAME + '</b><br />' + dataMap.get(feat.properties.NAME) + ' casos acumulados'
                        : 'Passe o mouse sobre um estado');
            }
            info.addTo(map);
            //Legend
            let legend= L.control({position: 'bottomright'});
            legend.onAdd = function (map) {
                let div = L.DomUtil.create('div', 'info legend'),
                    labels = [],
                    n = reds.length,
                    from, to;
            
                for (let i = 0; i < n; i++) {
                    let c = reds[i]
                    let fromto = mapColorScale.invertExtent(c);
            
                if(i < n-1){
                    labels.push(
                        '<i style="background:' + reds[i] + '"></i> ' +
                        d3.format("d")(fromto[0]) + (d3.format("d")(fromto[1]) ? '&ndash;' + d3.format("d")(fromto[1]) : '+'));
                }else{
                    labels.push(
                            '<i style="background:' + reds[i] + '"></i> ' +
                            d3.format("d")(fromto[0]) +(36 ? '&ndash;' + 36 : '+'));        
                    }
                }
            
                div.innerHTML = labels.join('<br>')
                return div
            }
            legend.addTo(map)
            
            geojson = L.geoJson(states, {
                style: style,
                onEachFeature: onEachFeature
            }).addTo(map)
            //Configuring graphs
            console.log(data);
            chart1.width(1200)
                .height(500)
                .x(causeXscale)
                .dimension(causeDim)
                .group(causeGroup)
                .colors("#ef3b2c") 
                .valueAccessor(function(p) { return format(p.value / 316 * 100)})
                .title(d => format(d.value / 316 * 100) + '%')
                .xAxis().ticks(9)
            //MUDANCA
            chart1.on("filtered", function() {
                updateFiltersDc();
            })

            chart2.width(800)
                .height(500)
                .x(targetXScale)
                .dimension(targetDim)
                .group(targetGroup)
                .colors("#ef3b2c") 
                .valueAccessor(function(p) { return format(p.value / 316 * 100)})
                .title(d => format(d.value / 316 * 100) + '%')
                .xAxis().ticks(15)

            chart2.on("filtered", function() {
                updateFiltersDc();

            })

            let arcs = pie(data);
    
            var total = data.reduce((accum,item) => accum + item.value, 0)
            
            var lastSelected = "";
            var firstSelected = "";
            
            var uniqueValues = data.map(d => d.value).filter(onlyUnique)
            
            var colorPie = d3.scaleOrdinal()
                  .domain(uniqueValues)
                  .range(d3.schemeReds[5])
            
            var centralText = svg.append("text")
                  .attr("font-family", "Arial")
                  .attr("font-size", "28px")
                  .attr("text-anchor", "middle")
                  .style("fill", "white")
                  .text(d3.format(".1%")(data[0].value / total));
                  
            var pathPie = svg.selectAll("path")
              .data(arcs)
              .join("path")
              .attr("fill", d => colorPie(d.value))
              .attr("d", normalArc)
              .attr("stroke", "black")
              .style("stroke-width", "2px")
              .attr('d', function(d, index) {
                  if (index === 0) {
                      firstSelected = this;
                      return biggerArc(d);
                  } else {
                      return normalArc(d);
                  }
                }).on("click", function(d) {
                    centralText.text(d3.format(".1%")(d.value / total));
                    if (firstSelected) {
                        d3.select(firstSelected).attr("d", normalArc)
                        firstSelected = false;
                    }
                    if (lastSelected) {
                        d3.select(lastSelected).attr("d", normalArc)
                    }
                    d3.select(this).attr("d", biggerArc)
                    lastSelected = this;
                })
              .append("title")
              .text(d => `${d.data.key}: ${d.value.toLocaleString()}`)
          
           let gg = svg.append("g")
                .attr("font-family", "sans-serif")
                .attr("font-size", 12)
                .attr("text-anchor", "middle")
                .selectAll("text")
                .data(arcs)
                .join("text")
                .attr("transform", d => `translate(${normalArc.centroid(d)})`)
                .call(text => text.append("tspan")
                .attr("y", "-0.4em")
                .attr("font-weight", "bold")
                .text(d => d.data.key))
                .call(text => text.filter(d => (d.endAngle - d.startAngle)).append("tspan")
                .attr("x", 0)
                .attr("y", "0.7em")
                .attr("fill-opacity", 0.7)
                .text(d => d.value.toLocaleString()));
           
            chart = Object.assign(svg.node(), {
              update(newdata) {
                total = newdata.reduce((accum,item) => accum + item.value, 0)
                
                uniqueValues = newdata.map(d => d.value).filter(onlyUnique)
            
                colorPie = d3.scaleOrdinal()
                  .domain(uniqueValues)
                  .range(d3.schemeReds[5])
                
                gg.remove();
                pathPie.remove();
          
                pathPie = svg.selectAll("path").data(pie(newdata))
                                     .join("path")
                                     .attr("fill", d => colorPie(d.value))
                                      .attr("d", normalArc)
                                      .attr("stroke", "black")
                                      .style("stroke-width", "2px")
                                      .attr('d', function(d, index) {
                                          if (index === 0) {
                                              firstSelected = this;
                                              return biggerArc(d);
                                          } else {
                                              return normalArc(d);
                                          }
                                        }).on("click", function(d) {
                                            centralText.text(d3.format(".1%")(d.value / total));
                                            if (firstSelected) {
                                                d3.select(firstSelected).attr("d", normalArc)
                                                firstSelected = false;
                                            }
                                            if (lastSelected) {
                                                d3.select(lastSelected).attr("d", normalArc)
                                            }
                                            d3.select(this).attr("d", biggerArc)
                                            lastSelected = this;
                                        })
                                      .append("title")
                                      .text(d => `${d.data.key}: ${d.value.toLocaleString()}`)
                      
                gg = svg.append("g")
                    .attr("font-family", "sans-serif")
                    .attr("font-size", 12)
                    .attr("text-anchor", "middle")
                    .selectAll("text")
                    .data(pie(newdata))
                    .join("text")
                    .attr("transform", d => `translate(${normalArc.centroid(d)})`)
                    .call(text => text.append("tspan")
                    .attr("y", "-0.4em")
                    .attr("font-weight", "bold")
                    .text(d => d.data.key))
                    .call(text => text.filter(d => (d.endAngle - d.startAngle) > 0.25).append("tspan")
                    .attr("x", 0)
                    .attr("y", "0.7em")
                    .attr("fill-opacity", 0.7)
                    .text(d => d.value.toLocaleString()));                     
          
               
                svg.select('text').text(d3.format(".1%")(newdata[0].value / total));
                
              }   
            });

        dc.renderAll();
});

