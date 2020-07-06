AOS.init();
//NavBar
$(document).ready(function(){
    $('.sbOption').click(function(event){
        //remove all pre-existing active classes
        $('.active').removeClass('active');

        //add the active class to the link we clicked
        $(this).addClass('active');

        //Load the content
        //e.g.
        //load the page that the link was pointing to
        $('.sbOption').load($(this).find(a).attr('href'));      

        event.preventDefault();
    });
});
//Beeswarm
let myColor = d3.scaleQuantize()
                .domain([0, 100])
                .range(d3.schemeReds[7]);

let margin = ({top: 20, right: 20, bottom: 30, left: 20})
let padding = 1.5;
let radius = 3.6;
let height = 627;
let width = 800;
const svg = d3.select("#beeswarm").append("svg")
                .attr("width", width)
                .attr("height", height);

let promises = [
    d3.csv("https://gist.githubusercontent.com/nandabezerran/ead62cdad2f5a94e50f6f9b3c5b33ce2/raw/d00336972ffce34fb8292bc9b92ffb96eb8c65a4/MassShootings.csv").then(function(data) {
    data.forEach(function(d) {
        d.Year = d.Date.slice(-4);
    })
    return data
    })
]

Promise.all(promises).then(ready);

function ready([data]){
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

    svg.append("g")
       .call(xAxis);
  
    svg.append("g")
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