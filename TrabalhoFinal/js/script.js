const cssScrollSnapPolyfill = require('css-scroll-snap-polyfill')

/*
let promises = [
    d3.csv("https://gist.githubusercontent.com/nandabezerran/ead62cdad2f5a94e50f6f9b3c5b33ce2/raw/d00336972ffce34fb8292bc9b92ffb96eb8c65a4/MassShootings.csv").then(function(data) {
        data.forEach(function(d) {
            d.Year = d.Date.slice(-4);
        })
        return data
    })    
]

Promise.all(promises).then(ready);

function ready([data]) {

} 
*/

//Scrolling
const gra = function(min, max) {
    return Math.random() * (max - min) + min;
}
const init = function(){
	let items = document.querySelectorAll('section');
	for (let i = 0; i < items.length; i++){
		items[i].style.background = randomColor({luminosity: 'light'});
	}
	cssScrollSnapPolyfill()
}
init();
