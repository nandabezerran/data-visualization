//Datasets
let promises = [
    d3.csv("https://gist.githubusercontent.com/nandabezerran/ead62cdad2f5a94e50f6f9b3c5b33ce2/raw/d00336972ffce34fb8292bc9b92ffb96eb8c65a4/MassShootings.csv").then(function(data) {
    data.forEach(function(d) {
        d.Year = d.Date.slice(-4);
    })
    return data
    })
]

Promise.all(promises).then(ready);

function ready([dataset]){
    let dados = []
  
    for(let d of dataset){
        if(d.Age != '' && d.Age != 'Unknown' && d.Gender != 'Male/Female'){
        if(d.Age.length === 2){ 
            if(+d.Age >= 12 && +d.Age <= 16){
            let obj = {'Gender': d.Gender, 'Age': '12 to 16'}
            dados.push(obj)
            }else if(+d.Age >= 17 && +d.Age <= 21){
            let obj = {'Gender': d.Gender, 'Age': '17 to 21'}
            dados.push(obj)
            }else if(+d.Age >= 22 && +d.Age <= 26){
            let obj = {'Gender': d.Gender, 'Age': '22 to 26'}
            dados.push(obj)
            }else if(+d.Age >= 27 && +d.Age <= 32){
            let obj = {'Gender': d.Gender, 'Age': '27 to 32'}
            dados.push(obj)
            }else if(+d.Age >= 33 && +d.Age <= 37){
            let obj = {'Gender': d.Gender, 'Age': '33 to 37'}
            dados.push(obj)
            }else if(+d.Age >= 38 && +d.Age <= 42){
            let obj = {'Gender': d.Gender, 'Age': '38 to 42'}
            dados.push(obj)
            }else if(+d.Age >= 43 && +d.Age <= 47){
            let obj = {'Gender': d.Gender, 'Age': '43 to 47'}
            dados.push(obj)
            }else if(+d.Age >= 48 && +d.Age <= 52){
            let obj = {'Gender': d.Gender, 'Age': '48 to 52'}
            dados.push(obj)
            }else if(+d.Age >= 53 && +d.Age <= 57){
            let obj = {'Gender': d.Gender, 'Age': '53 to 57'}
            dados.push(obj)
            }else if(+d.Age >= 58 && +d.Age <= 62){
            let obj = {'Gender': d.Gender, 'Age': '58 to 62'}
            dados.push(obj)
            }else if(+d.Age >= 63 && +d.Age <= 67){
            let obj = {'Gender': d.Gender, 'Age': '63 to 67'}
            dados.push(obj)
            }else if(+d.Age >= 68 && +d.Age <= 70){
            let obj = {'Gender': d.Gender, 'Age': '68 to 70'}
            dados.push(obj)
            }
        }      
        }
    }
    
    dados.push({'Gender': 'Male', 'Age': '17 to 21'})
    dados.push({'Gender': 'Male', 'Age': '27 to 32'})
    dados.push({'Gender': 'Male', 'Age': '12 to 16'})
    dados.push({'Gender': 'Male', 'Age': '12 to 16'})
    dados.push({'Gender': 'Male', 'Age': '17 to 21'})
    dados.push({'Gender': 'Male', 'Age': '22 to 26'})
    dados.push({'Gender': 'Male', 'Age': '12 to 16'})
    dados.push({'Gender': 'Male', 'Age': '12 to 16'})
    dados.push({'Gender': 'Male', 'Age': '17 to 21'})
    dados.push({'Gender': 'Male', 'Age': '17 to 21'})

    let data = Object.assign(dados, {
                                            format: ".0%",
                                            negative: "← Female",
                                            positive: "Male →",
                                            negatives: ["Female"],
                                            positives: ["Male"]
                                        });

    let distinctAges = [...new Set(data.map(x => x.Age))].sort().reverse();
    let margin = ({top: 40, right: 150, bottom: 20, left: 100})
    let width = 700;
    let height = (distinctAges.length) * 33 + margin.top + margin.bottom;
    
    let svg = d3.select("#genderAge").append("svg")
                .attr("width", width)
                .attr("height", height);

    let signs = new Map([].concat(
            data.negatives.map(d => [d, -1]),
            data.positives.map(d => [d, 1])
    ));

    let color = d3.scaleOrdinal()
    .domain([].concat(data.negatives, data.positives))
    .range(["#fcae91", "#a50f15"])
    let roll = (d3.rollups(data, data => d3.rollup(data, v => v.length, d => d.Gender), d => d.Age));
    let series = d3.stack()
                    .keys([].concat(data.negatives.slice().reverse(), data.positives))
                    .value(([, value], Gender) => signs.get(Gender) * (value.get(Gender) || 0))
                    .offset(d3.stackOffsetDiverging)
                   (roll)

    let x = d3.scaleLinear()
            .domain(d3.extent(series.flat(2)))
            .rangeRound([margin.left, width - margin.right]);

    let y = d3.scaleBand()
            .domain(distinctAges)
            .rangeRound([margin.top, height - margin.bottom])
            .padding(2 / 33)

    let xAxis = g => g
        .attr("transform", `translate(0,${height - 20})`)
        .call(d3.axisBottom(x)
            .ticks(width / 50)
            .tickFormat(x => Math.abs(x))
            .tickSizeOuter(0))

    .call(g => g.append("text")
        .attr("x", x(0) + 20)
        .attr("y", -410)
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .attr("transform", `translate(0,${0})`)
        .text(data.positive))

    .call(g => g.append("text")
        .attr("x", x(0) - 20)
        .attr("y", -410)
        .attr("fill", "currentColor")
        .attr("text-anchor", "end")
        .attr("transform", `translate(0,${0})`)
        .text(data.negative))

    let yAxis = g => g
        .call(d3.axisLeft(y)
            .tickFormat(y => y + ' years')
            .tickSizeOuter(0)
            .tickSize(0))
        .call(g => g.selectAll(".tick").data(distinctAges).attr("transform", (name) => `translate(${margin.left - 15},${y(name) + y.bandwidth() / 2})`))
        .call(g => g.select(".domain").attr("transform", `translate(${x(0)},0)`));

    svg.append("g")
        .selectAll("g")
        .data(series)
        .join("g")
        .attr("fill", d => color(d.key))
        .selectAll("rect")
        .data(d => d.map(v => Object.assign(v, {key: d.key})))
        .join("rect")
        .attr("x", d => x(d[0]))
        .attr("y", ({data: [name]}) => y(name))
        .attr("width", d => x(d[1]) - x(d[0]))
        .attr("height", y.bandwidth())
        .append("title")
        .text(({key, data: [name, value]}) => `${name} years old ${key}
${value.get(key)}`);

  svg.append("g")
      .call(xAxis);

  svg.append("g")
      .call(yAxis);
}