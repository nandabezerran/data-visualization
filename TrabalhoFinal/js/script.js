
//AnimationOnScroll initialization
AOS.init();

//SideNavBar

let size = 9;
let sectionSize = 627;
let changeSection = sectionSize/2;
let sections = [];
let scrollPosition = [];
function dividingSections(size, changeSection){
    let pos = changeSection;
    let str = 'nb';
    for (let index = 0; index < size; index++) {
        sections[index] = str.concat(index+1);
        pos = pos*3; 
    }
}
dividingSections(size, changeSection, sectionSize);

window.onscroll = function() {myFunction(changeSection)};

function myFunction(changeSection) {
   let pos = Math.trunc(Math.round(document.documentElement.scrollTop/changeSection)/2);
    if(pos < size){
        document.getElementById(sections[pos]).className = "sbOption active"
        let aux = document.getElementById(sections[pos]).innerHTML.split('</i>');
        document.getElementById(sections[pos]).innerHTML = '<i class="material-icons" id="navBBActive">fiber_manual_record</i>' + aux[1];
        for (let index = 0; index < sections.length; index++) {
            if (index != pos){
                document.getElementById(sections[index]).className = "sbOption"
                aux = document.getElementById(sections[index]).innerHTML.split('</i>');
                document.getElementById(sections[index]).innerHTML = '<i class="material-icons" id="navBB">fiber_manual_record</i>' + aux[1];
            }
            
        }
    }
    
}
$("input[name='map']").on("click", function(){
    $("#normalMap").toggle(this.value === "false" && this.checked);
    $("#animatedMap").toggle(this.value === "true" && this.checked);
});
function switchDivs(){
    var map = document.getElementById("normalMap");
    var animatedMap = document.getElementById("animatedMap");
    if (animatedMap.style.display == "none") {
        animatedMap.style.display = "block";
        map.style.display = "none"
    } else {
        animatedMap.style.display = "none";
        map.style.display = "block"
    }
}

//Datasets
let promises = [
    d3.csv("https://gist.githubusercontent.com/nandabezerran/ead62cdad2f5a94e50f6f9b3c5b33ce2/raw/d00336972ffce34fb8292bc9b92ffb96eb8c65a4/MassShootings.csv").then(function(data) {
        data.forEach(function(d) {
            d.Year = d.Date.slice(-4);
        })
        return data
    }),
    d3.csv("https://gist.githubusercontent.com/thaisnl/4ac24ac0f006e24e38dcc814c04bbefe/raw/92d4359a14d75113091a3f8fb8a3fdbb004d8f81/states.csv").then(function (data) {
        let nameMap = d3.map()
        data.forEach(function(d) {
            nameMap.set(d.st, d.stname)
        })
        return nameMap
    }),
    d3.json("https://d3js.org/us-10m.v1.json")
]

Promise.all(promises).then(ready);

let heightLC = 500;
let widthLC = 800;
let marginLC = ({top: 20, right: 30, bottom: 30, left: 40});
let objYear = new Object({year: 1966});  
let chart = null;
let lineData = null;

let range = null;

let chartSM = null;
let nameById = null;
let aux = null;
let us = null;

//proxy
let proxyLineChart = new Proxy(objYear, {
    set: function (target, key, value) { ;
        chart.update(lineData.slice(0, lineData.indexOf(lineData.find(e => e.key == value)) + 1))
        target[key] = value;
        return true;
    }
});

//scrubber
function Scrubber(values, i, o, form, b, whichScrubber, {
    format = value => value,
    delay = null,
    autoplay = true,
    loop = true,
    loopDelay = null,
    alternate = false
    } = {}) {
    values = Array.from(values);

    let frame = null;
    let timer = null;
    let interval = null;
    let direction = 1;
    function step() {
        i.valueAsNumber = (i.valueAsNumber + direction + values.length) % values.length;
        i.dispatchEvent(new CustomEvent("input", {bubbles: true}));
    }
    function start() {
        b.textContent = "Pause";
        if (delay === null) frame = requestAnimationFrame(tick);
        else interval = setInterval(tick, delay);
    }
    function tick() {
        if (i.valueAsNumber === (direction > 0 ? values.length - 1 : direction < 0 ? 0 : NaN)) {
            if (!loop) return stop();
            if (alternate) direction = -direction;
            if (loopDelay !== null) {
            if (frame !== null) cancelAnimationFrame(frame), frame = null;
            if (interval !== null) clearInterval(interval), interval = null;
            timer = setTimeout(() => (step(), start()), loopDelay);
            return;
            }
        }
        if (delay === null) frame = requestAnimationFrame(tick);
        step();
    }
    function stop() {
        b.textContent = "Play";
        if (frame !== null) cancelAnimationFrame(frame), frame = null;
        if (timer !== null) clearTimeout(timer), timer = null;
        if (interval !== null) clearInterval(interval), interval = null;
        return false;
    }
    function running() {
        return frame !== null || timer !== null || interval !== null;
    }
    i.oninput = event => {
        if (event && event.isTrusted && running()) stop();
        form.value = values[i.valueAsNumber];
        if(whichScrubber == 1){
            proxyLineChart.year = form.value;
        }else {
            proxyMap.year = form.value;
        }
        o.value = format(form.value, i.valueAsNumber, values);
    };
    b.onclick = () => {
        if (running()) return stop();
        direction = alternate && i.valueAsNumber === values.length - 1 ? -1 : 1;
        i.valueAsNumber = (i.valueAsNumber + direction) % values.length;
        i.dispatchEvent(new CustomEvent("input", {bubbles: true}));
        start();
        return false;
    };
    i.oninput();
    if (autoplay) start();
    else stop();
}

let getLineData = (data) => {
    let lineData = d3.nest()
    .key(function(d) {return parseInt(d.Year);})
    .rollup(function(d) {
    
        return d3.sum(d, function(e) { return 1; });
    
    })
    .entries(data).sort((a,b) => a.key - b.key)
    return lineData;
}

let getRange = () => {
    let range = []
    for(let obj of lineData){
        range.push(+obj.key)
    }
    return range;
}
//Line Chart
let lineChart = (lineData) => {
    let data = lineData.slice(0, lineData.indexOf(lineData.find(e => e.key == objYear.year)) + 1)
    let bisectDate = d3.bisector(function(d) { return d.key; }).left;

    let focus = null;
    
    let x = d3.scaleTime()
        .domain(d3.extent(data, d => d.key))
        .range([marginLC.left, widthLC - marginLC.right])
    
    let xAxis = g => g
        .attr("transform", `translate(0,${heightLC - marginLC.bottom})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")).ticks())  
    
    let y = d3.scaleLinear()
        .domain([0, 70])
        .range([heightLC - marginLC.bottom, marginLC.top])
    
    let yAxis = g => g
            .attr("transform", `translate(${marginLC.left},0)`)
            .call(d3.axisLeft(y))
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - marginLC.left)
            .attr("x",0 - (heightLC / 2))
            .attr("fill", "white")
            .attr("font-size", "12px")
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Number of occurences"); 
        
    let line = d3.line()
        .defined(d => !isNaN(d.value))
        .x(d => x(d.key))
        .y(d => y(d.value))
    
    let svg = d3.select("#line-chart").append("svg")
                    .attr('width', widthLC )
                    .attr('height', heightLC)

    let axisX = svg.append("g")
        .call(xAxis);

    let axisY = svg.append("g")
        .call(yAxis);

    let path = svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", 1.5)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("d", line)
    
    let content = svg.append("g")
        .attr("fill", "none")
        .attr("pointer-events", "all")
        .selectAll("rect")
        .data(d3.pairs(data))
        .join("rect")
        .attr("x", ([a, b]) => x(a.key))
        .attr("height", heightLC)
        .attr("width", ([a, b]) => x(b.key) - x(a.key))
    
    chart = Object.assign(svg.node(), {
        update(newdata) {
        axisX.remove();
        axisY.remove();
        path.remove();
        if(focus != null){
            focus.remove();
        }
        content.remove();
        x = d3.scaleTime()
            .domain(d3.extent(newdata, d => d.key))
            .range([marginLC.left, widthLC - marginLC.right])

        xAxis = g => g
            .attr("transform", `translate(0,${heightLC - marginLC.bottom})`)
            .call(d3.axisBottom(x).tickFormat(d3.format("d")).ticks()) 

        line = d3.line()
            .defined(d => !isNaN(d.value))
            .x(d => x(d.key))
            .y(d => y(d.value))

        axisX = svg.append("g")
            .call(xAxis);

        axisY = svg.append("g")
            .call(yAxis);

        path = svg.append("path")
            .datum(newdata)
            .attr("fill", "none")
            .attr("stroke", "red")
            .attr("stroke-width", 1.5)
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("d", line)
        
        focus = svg.append("g")
            .attr("transform", "translate(" + marginLC.left + "," + marginLC.top + ")")
            .attr("class", "focus")
            .style("display", "none");

        focus.append("circle")
            .attr("r", 4.5);
        
        focus.append("rect")
            .attr("height", 20)
            .attr("x", 10)
            .attr("y", -25)
            .style("fill", "white")

        focus.append("text")
            .attr("y", -15)
            .attr("dy", ".31em")
            .attr("font-size", "10px")
            .attr("font-family", "sans-serif")

        function mousemovend() {
            var pos = d3.mouse(this)[0];
            var x0 = x.invert(pos),
                i = bisectDate(newdata, x0, 1),
                d0 = newdata[i - 1],
                d1 = newdata[i],
                d = x0 - d0.key > d1.key - x0 ? d1 : d0;
            focus.attr("transform", "translate(" + x(d.key) + "," + y(d.value) + ")");

            //alinhando a tooltip
            if (pos > (width/2) ) {
            focus.select("text")
                .attr("x", -100)
            focus.select("rect")
                .attr("x", -105)
            }else{
            focus.select("text")
                .attr("x", 5)
            focus.select("rect")
                .attr("x", 0)
            }

            //adequando o tamanho do rec de acordo com o numero de casos
            if(d.value > 9){
                focus.select("rect")
                    .attr("width", 110);
            }else{
                focus.select("rect")
                    .attr("width", 105);
            }

            focus.select("text").text(function() { return "Ano: " + d.key + " | Casos: " + d.value; });
        }

        content = svg.append("g")
            .attr("fill", "none")
            .attr("pointer-events", "all")
            .selectAll("rect")
            .data(d3.pairs(newdata))
            .join("rect")
            .attr("x", ([a, b]) => x(a.key))
            .attr("height", heightLC)
            .attr("width", ([a, b]) => x(b.key) - x(a.key))
            .on("mouseover", function() { focus.style("display", null); })
            .on("mouseout", function() { focus.style("display", "none"); })
            .on("mousemove", mousemovend);

        }
    })
    let button = document.getElementsByName("b")[0];
    let input = document.getElementsByName("i")[0];
    let output = document.getElementsByName("o")[0];
    let form = document.getElementsByName("scrubberLine")[0]
    Scrubber(range, input, output, form, button, 1, {loop: false, autoplay: false, delay:200})
}

//Beeswarm
let myColor = d3.scaleQuantize()
                .domain([0, 100])
                .range(d3.schemeReds[7]);

let margin = ({top: 20, right: 20, bottom: 30, left: 20})
let padding = 1.5;
let radius = 3.6;
let height = 627;
let width = 800;
const svgBeeswarm = d3.select("#beeswarm").append("svg")
                .attr("width", width)
                .attr("height", height);


function beeswarm(data){
    let years = d3.extent(data, d => d.Year);
    let x = d3.scaleTime()
              .domain([+years[0]- 1, +years[1] +1])
              .range([margin.left, width - margin.right]);

    let xAxis = g => g
                .attr("transform", `translate(0,${height - margin.bottom})`)
                .call(d3.axisBottom(x).tickFormat(d3.format("d")).ticks())

    let dodge = (data, radius) => {
        const radius2 = radius ** 2;
        const circles = data.map(d => ({x: x(d.Year), data: d})).sort((a, b) => a.x - b.x);
        const epsilon = 1e-3;
        let head = null, tail = null;
        // Returns true if circle ⟨x,y⟩ intersects with any circle in the queue.
        function intersects(x, y) {
            let a = head;
            while (a) {
            if (radius2 - epsilon > (a.x - x) ** 2 + (a.y - y) ** 2) {
                return true;
            }
            a = a.next;
            }
            return false;
        }
        
        // Place each circle sequentially.
        for (const b of circles) {
        
            // Remove circles from the queue that can’t intersect the new circle b.
            while (head && head.x < b.x - radius2) head = head.next;
        
            // Choose the minimum non-intersecting tangent.
            if (intersects(b.x, b.y = 0)) {
            let a = head;
            b.y = Infinity;
            do {
                let y = a.y + Math.sqrt(radius2 - (a.x - b.x) ** 2);
                if (y < b.y && !intersects(b.x, y)) b.y = y;
                a = a.next;
            } while (a);
            }
        
            // Add b to the queue.
            b.next = null;
            if (head === null) head = tail = b;
            else tail = tail.next = b;
        }
        return circles;
    }

    svgBeeswarm.append("g")
       .call(xAxis);
  
    svgBeeswarm.append("g")
        .selectAll("circle")
        .data(dodge(data, radius * 2 + padding))
        .join("circle")
        .attr("cx", d => d.x)
        .attr("cy", d => height - margin.bottom - radius - padding - d.y)
        .attr("r", radius)
        .attr("fill", d => myColor(d.data['Total victims']))
        .on("click", function(d){
            window.open(d.data.DataSource, '_blank');
        })
        .append("title")
        .text(d => "Title: " + d.data.Title + " | Date: " + d.data.Date +" | Victims: " + d.data['Total victims']);
}

//Stacked Bar
let widthSB = 600
let heightSB = 400
let marginSB = ({
    top: 2,
    right: 2,
    bottom: 30,
    left: 30
  })
let colorSB = d3.scaleOrdinal()
                .domain(["Fatalities", "Injured"])
                .range(["#8c0d0d"," #ee4343"]);
const svgSB = d3.select("#stackedBar").append("svg")
                .attr('width', widthSB )
                .attr('height', heightSB)
function stackedBar(data){
    let nestedaux = d3.nest()
                      .key(function(d){return d.Year;})
                      .rollup(function(d) {
                            return{
                                Fatalities: d3.sum(d, function(e) {return e.Fatalities;}),
                                Injured: d3.sum(d, function(e) {return e.Injured})
                            };
                        })
                      .entries(data);
    let nested = nestedaux.slice().sort((a, b) => d3.ascending(a.key, b.key));
    let xScale = d3.scaleBand(
                        nested.map(d => d.key),
                        [ marginSB.left, widthSB - marginSB.right ]
                    ).padding(0.1);
    let yScale = d3.scaleLinear(
                        [ 0, d3.max(nested, d => d.value.Fatalities + d.value.Injured) ],
                        [ heightSB - marginSB.bottom, marginSB.top ]
                    );
    let xAxis = d3.axisBottom(xScale)
                  .tickSizeOuter(0)
                  .tickValues([1966, 1984, 1992, 2001, 2009, 2017]);
    let yAxis = d3.axisLeft(yScale);
    let series = d3.stack()
                    .keys(["Fatalities","Injured"])
                    .value((d, key) => {
                    console.log(key);
                    return d.value[key];
                    })(nested);

    const chartData = series;
  
    const groups = svgSB.append('g')
        .selectAll('g')
        .data( chartData )
        .join('g')
        .style('fill', (d,i) => colorSB(d.key));
        
    groups.selectAll('rect')
        .data(d => d)
        .join('rect')
        .attr('x', d => xScale(d.data.key))
        .attr('y', d => yScale(d[1]))
        .attr('height', d => yScale(d[0]) - yScale(d[1]))
        .attr('width', xScale.bandwidth)
        .append("title")
        .text((d,i) =>{let aux = 'Injured'; if (d[0] == 0) aux = 'Fatalities'; return ('Year: ' + d.data.key + '\n'     + aux + ': ' + d[1])});
    
    svgSB.append('g')
        .attr('transform', `translate(0,${ heightSB - marginSB.bottom })`)
        .call(xAxis) 
        .selectAll("text")	
        .style("text-anchor", "end")
        .attr("dx", "1em");
    
    svgSB.append('g')
        .attr('transform', `translate(${ marginSB.left },0)`)
        .call(yAxis)
        .select('.domain').remove();
    var legend = svgSB.append("g")
              .attr("font-family", "sans-serif")
              .attr("font-size", 10)
              .attr("text-anchor", "end")
              .selectAll("g")
              .data(["Fatalities","Injured"].slice().reverse())
              .enter().append("g")
              .attr("transform", function(d, i) { return "translate(-50," + i * 20 + ")"; })
              .style("fill", 'white');

    legend.append("rect")
        .attr("x", widthSB - 19)
        .attr("width", 19)
        .attr("height", 19)
        .attr("fill", d => colorSB(d));

    legend.append("text")
        .attr("x", widthSB - 24)
        .attr("y", 9.5)
        .attr("dy", "0.32em")
        .text(function(d) { return d; });
}

//Scatterplot
let marginSp = ({top: 50, right: 50, bottom: 40, left: 60});
let heightSp = 600 - marginSp.top - marginSp.bottom;
let widthSp = 800;
let myColorSp = d3.scaleQuantize()
                  .domain([0, 150])
                  .range(d3.schemeReds[5]);

const svgSp = d3.select("#scatterplot").append("svg")
                .attr('width', widthSp )
                .attr('height', heightSp)

function scatterplot(data){
    let nested = d3.nest()
                   .key(function(d) {return d.State;})
                   .rollup(function(d) {
                        return {
                            fatalities: d3.sum(d, function(e) { return e.Fatalities; }),
                            occurrences: d3.sum(d, function(e) { return 1; }),
                            victims: d3.sum(d, function(e) {return e['Total victims'];})
                        };
                    })
                   .entries(data);

    let z = d3.scaleLinear()
            .domain([0, d3.max(nested, d => d.value.fatalities)])
            .range([5, 40]);
    let x = d3.scaleLinear()
            .domain([0, d3.max(nested, d => d.value.victims)])
            .range([ marginSp.left, widthSp -marginSp.right]);
            let grid = g => g
            .attr("stroke", "currentColor")
            .attr("stroke-opacity", 0.1)
            .call(g => g.append("g")
            .selectAll("line")
            .data(x.ticks())
            .join("line")
                .attr("x1", d => 0.5 + x(d))
                .attr("x2", d => 0.5 + x(d))
                .attr("y1", marginSp.top)
                .attr("y2", heightSp - marginSp.bottom))
            .call(g => g.append("g")
            .selectAll("line")
            .data(y.ticks())
            .join("line")
                .attr("y1", d => 0.5 + y(d))
                .attr("y2", d => 0.5 + y(d))
                .attr("x1", marginSp.left)
                .attr("x2", widthSp - marginSp.right));
    let xAxis = g => g
                .attr("transform", `translate(0,${heightSp - marginSp.bottom})`)
                .call(d3.axisBottom(x))
                .call(g => g.append("text")
                    .attr("x", widthSp /2)
                    .attr("y", marginSp.bottom - 1)
                    .attr("fill", "currentColor")
                    .attr("font-size", 16)
                    .text(" Total number of victims (deaths and injuries)"))
    let y = d3.scaleLinear()
                .domain([0, d3.max(nested, d => d.value.occurrences)])
                .range([ heightSp - marginSp.bottom, marginSp.top]);        
    let yAxis = g => g
            .attr("transform", `translate(${marginSp.left},0)`)
            .call(d3.axisLeft(y))
            .call(g => g.append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 0 - marginSp.left + 25)
                .attr("x",0 - (heightSp/2 +90))
                .attr("fill", "currentColor")
                .attr("text-anchor", "start")
                .attr("font-size", 16)
                .text("Number of Occurrences"))
    svgSp.append("g")
        .call(xAxis);

    svgSp.append("g")
        .call(yAxis);

    svgSp.append("g")
        .call(grid);

    svgSp.append("g")
        .attr("stroke", "white")
        .selectAll("circle")
        .data(nested)
        .join("circle")
        .attr("class", "bubbles")
        .sort((a, b) => d3.descending(a.value.fatalities, b.value.fatalities))
        .attr("cx", d => x(d.value.victims))
        .attr("cy", d => y(d.value.occurrences))
        .attr("r", d => z(d.value.fatalities))
        .attr("fill", d => myColorSp(d.value.victims))
        .attr("fill-opacity", 0.6)  
        .append("title")    
        .text(d => 'State: '+ d.key + '\n' +
                   "Occurrences: " + d.value.occurrences + '\n' + 
                   "Victims: " + d.value.victims + '\n'+
                   "Fatalities: " + d.value.fatalities);
        
    svgSp.append("g")
        .selectAll('text')
        .data(nested.filter(function (n){return n.value.victims > 90;}))
        .enter()
        .append('text')
        .attr('x', d => x(d.value.victims -15))
        .attr('y', d => y(d.value.occurrences))
        .attr('font-family', 'sans-serif')
        .attr("font-size", 12)
        .attr('fill', 'white')
        .text(d => d.key);
}

let mapYear = new Object({year: 1966})

//map with scrubber
let proxyMap = new Proxy(objYear, {
    set: function (target, key, value) {
        casesById = dataAt(value);
        chartSM.update(casesById)
        target[key] = value;
        return true;
    }
});

let showTooltip = (county_id, x, y) => {
    const offset = 30;
    const t = d3.select("#tooltip");
    t.select("#casos").text(casesById.get(county_id));
    t.select("#name").text(nameById.get(county_id));
    t.classed("hidden", false);
    const rect = t.node().getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    if (x + offset + w > widthSM) {
      x = x - w;
    }
    t.style("left", x + offset + "px");
    t.style("top", y - h + "px");
}

let hideTooltip = () => {
    d3.select("#tooltip")
    .classed("hidden", true)
}

let dataAt = (year) => {
    let cases = d3.map();
    for ( const [id, name] of Object.entries(nameById)) {
        let filtered = aux.filter(s => {
            if (s.State == name && s.Year == year) {
                return true;
            }
            return false;
        });  
        cases.set(id.substr(1), +filtered.length);
    }
    return cases;
}

let returnMaxValue = (data) => {
    //gambiarra pra nao ficar a escala de 0,0 pq os 0 fica com a cor mais escura
    if(Math.max(...data.values()) == 0){
      return 1;
    }
    return Math.max(...data.values());
}

const widthSM = 960;
const heightSM = 600;
let casesById = null;

let scrubberMap = (data) => {

    d3.select("body")
      .append("div")
      .attr("id", "tooltip")
      .attr("class", "hidden")
      .append("p")
      .html("<span id='name'></span><br>Qtde de casos: <span id='casos'></span>")

    let path = d3.geoPath();
    let states = null;

    let colorScale = d3.scaleQuantize()
                .domain([0, returnMaxValue(data)])
                .range(d3.schemeReds[8]);

    const svg = d3.select("#scrubberMap").append("svg")
                    .attr('width', widthSM )
                    .attr('height', heightSM)

    svg.append("path")
        .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
        .attr("class", "states")
        .attr("d", path)

    chartSM = Object.assign(svg.node(), {
        update(newdata) {
            if(states != null){
                states.remove();
            }
            colorScale = d3.scaleQuantize()
                .domain([0, returnMaxValue(newdata)])
                .range(d3.schemeReds[8]);
            states = svg.append("g")
                .attr("class", "states")
                .selectAll("path")
                .data(topojson.feature(us, us.objects.states).features)
                .enter().append("path")
                .attr("fill", d => colorScale(newdata.get(d.id)))
                .attr("d", path)
                .on("mouseover", function(d){
                    d3.select(this) 
                    .style("cursor", "pointer")
                    .attr("stroke-width", 3)
                    .attr("stroke","#000");
                    const rect = this.getBoundingClientRect();
                    showTooltip(d.id, rect.x + window.scrollX, rect.y + window.scrollY);
                })
                .on("mouseout", function(d){
                    d3.select(this)
                    .style("cursor", "default")
                    .attr("stroke-width", 0)
                    .attr("stroke","none");
                    hideTooltip();
                })

        }
    })
    let button = document.getElementsByName("bMap")[0];
    let input = document.getElementsByName("iMap")[0];
    let output = document.getElementsByName("oMap")[0];
    let form = document.getElementsByName("scrubberMap")[0]
    Scrubber(range, input, output, form, button, 2, {loop: false, autoplay: false, delay:200})
}

let getTotalOfCases = (data) => {
    return data.length;
}

let getTotalOfFatalities = (data) => {
    let fat = 0;
    data.forEach(d => {
        fat = fat + (+d.Fatalities);
    })
    return fat;
}

let getTotalOfInjured = (data) => {
    let inj = 0;
    data.forEach(d => {
        inj = inj + (+d.Injured)
    })
    return inj;
}
        
//Function to show the graphs
function ready([data, statesById, topo]){
    d3.select("#numberOfFatalities")
        .text(getTotalOfFatalities(data));

    d3.select("#numberOfInjured")
        .text(getTotalOfInjured(data))

    d3.select("#numberOfCases")
        .text(getTotalOfCases(data))

    lineData = getLineData(data);
    nameById = statesById;
    us = topo;
    aux = data;
    range = getRange();
    casesById = dataAt(mapYear.year);

    scrubberMap(casesById);
    lineChart(lineData);
    beeswarm(data);
    stackedBar(data);
    scatterplot(data);
}