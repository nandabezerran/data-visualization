let height = 500;
let margin = ({top: 20, right: 30, bottom: 30, left: 40});

let promises = [
    d3.csv("https://gist.githubusercontent.com/nandabezerran/ead62cdad2f5a94e50f6f9b3c5b33ce2/raw/d00336972ffce34fb8292bc9b92ffb96eb8c65a4/MassShootings.csv").then(function(data) {
    data.forEach(function(d) {
        d.Year = d.Date.slice(-4);
    })
    return data
    })
]

const svg = d3.select("#lineChart").append("svg")
                .attr("width", width)
                .attr("height", height);

Promise.all(promises).then(ready);

function Scrubber(values, {
    format = value => value,
    initial = 0,
    delay = null,
    autoplay = true,
    loop = true,
    loopDelay = null,
    alternate = false
  } = {}) {
    values = Array.from(values);
    const form = '<form style="font: 12px var(--sans-serif); font-variant-numeric: tabular-nums; display: flex; height: 33px; align-items: center;">'+
    '<button name=b type=button style="margin-right: 0.4em; width: 5em;"></button>'+
    '<label style="display: flex; align-items: center;">'+
      '<input name=i type=range min=0 max=${values.length - 1} value=${initial} step=1 style="width: 180px;">'+
      '<output name=o style="margin-left: 0.4em;"></output>'+
    '</label>'+
  '</form>';
    let frame = null;
    let timer = null;
    let interval = null;
    let direction = 1;

    function step() {
      form.i.valueAsNumber = (form.i.valueAsNumber + direction + values.length) % values.length;
      form.i.dispatchEvent(new CustomEvent("input", {bubbles: true}));
    }

    function start() {
      form.b.textContent = "Pause";
      if (delay === null) frame = requestAnimationFrame(tick);
      else interval = setInterval(tick, delay);
    }

    function tick() {
      if (form.i.valueAsNumber === (direction > 0 ? values.length - 1 : direction < 0 ? 0 : NaN)) {
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
      form.b.textContent = "Play";
      if (frame !== null) cancelAnimationFrame(frame), frame = null;
      if (timer !== null) clearTimeout(timer), timer = null;
      if (interval !== null) clearInterval(interval), interval = null;
    }

    function running() {
      return frame !== null || timer !== null || interval !== null;
    }

    form.i.oninput = event => {
      if (event && event.isTrusted && running()) stop();
      form.value = values[form.i.valueAsNumber];
      proxy.year = form.value;
      form.o.value = format(form.value, form.i.valueAsNumber, values);
    };

    form.b.onclick = () => {
      if (running()) return stop();
      direction = alternate && form.i.valueAsNumber === values.length - 1 ? -1 : 1;
      form.i.valueAsNumber = (form.i.valueAsNumber + direction) % values.length;
      form.i.dispatchEvent(new CustomEvent("input", {bubbles: true}));
      start();
    };
    
    form.i.oninput();
    if (autoplay) start();
    else stop();
        disposal(form).then(stop);
    return form;
}
function disposal(element) {
    return new Promise(resolve => {
      requestAnimationFrame(() => {
        const target = element.closest(".observablehq");
        if (!target) return resolve();
        const observer = new MutationObserver(mutations => {
          if (target.contains(element)) return;
          observer.disconnect(), resolve();
        });
        observer.observe(target, {childList: true});
      });
    });
}

function ready([dataset]){
    let lineData = d3.nest()
                .key(function(d) {return parseInt(d.Year);})
                .rollup(function(d) {
                    
                        return d3.sum(d, function(e) { return 1; });
                
                })
                .entries(dataset).sort((a,b) => a.key - b.key);
    let objYear = new Object({year: 1966})
    let data = lineData.slice(0, lineData.indexOf(lineData.find(e => e.key == objYear.year)) + 1);
    let ret = [];
    for(let obj of lineData){
        ret.push(+obj.key);
    }
    let range = ret;

    let proxy = new Proxy(objYear, {
        set: function (target, key, value) {
            chart.update(lineData.slice(0, lineData.indexOf(lineData.find(e => e.key == value)) + 1))
            target[key] = value;
            return true;
        }
    });

    let bisectDate = d3.bisector(function(d) { return d.key; }).left;
  
  let focus = null;
  
  let x = d3.scaleTime()
    .domain(d3.extent(data, d => d.key))
    .range([margin.left, width - margin.right])
  
  let xAxis = g => g
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")).ticks())  
  
  let y = d3.scaleLinear()
    .domain([0, 70])
    .range([height - margin.bottom, margin.top])
  
  let yAxis = g => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y))
        .call(g => g.select(".tick:last-of-type text").clone()
              .attr("x", 3)
              .attr("text-anchor", "start")
              .attr("font-weight", "bold")
              .text(data.y)) 
  
  let line = d3.line()
    .defined(d => !isNaN(d.value))
    .x(d => x(d.key))
    .y(d => y(d.value))

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
      .attr("height", height)
      .attr("width", ([a, b]) => x(b.key) - x(a.key))
 
  let chart = Object.assign(svg.node(), {
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
        .range([margin.left, width - margin.right])

      xAxis = g => g
        .attr("transform", `translate(0,${height - margin.bottom})`)
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
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .attr("class", "focus")
        .style("display", "none");

      focus.append("circle")
        .attr("r", 4.5);
      
      focus.append("rect")
            .attr("class", "tooltip")
            .attr("width", 105)
            .attr("height", 20)
            .attr("x", 10)
            .attr("y", -25)
            .attr("rx", 4)
            .attr("ry", 4);

      focus.append("text")
        .attr("x", 5)
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
        focus.select("text").text(function() { return "Ano: " + d.key + " | Casos: " + d.value; });
      }

      content = svg.append("g")
        .attr("fill", "none")
        .attr("pointer-events", "all")
        .selectAll("rect")
        .data(d3.pairs(newdata))
        .join("rect")
        .attr("x", ([a, b]) => x(a.key))
        .attr("height", height)
        .attr("width", ([a, b]) => x(b.key) - x(a.key))
        .on("mouseover", function() { focus.style("display", null); })
        .on("mouseout", function() { focus.style("display", "none"); })
        .on("mousemove", mousemovend);

    }
  })
  let year = Scrubber(range, {format: Math.floor, loop: false, autoplay: false, delay:500})




      

}