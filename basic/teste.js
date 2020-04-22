var number = 5;
let teste = true;
const name = "Emanuele";


var numbers = [5, 10, 15, 20, 25];
numbers[0] //retorna 5
numbers[3] //retorna 20

var names = ["Peter", "Paul", "John"];
//é possível mas não recomendado:
var mistureba = [1, 2, 3.2, "texto", true];

var car = {
	marca: "Ford",
	modelo: "Fiesta",
	cor: "preto",
	ano: 2013
};

car.marca //retorna "Ford"
car.cor //retorna "preto"

class Car {
    constructor(marca, modelo, cor, ano) {
        this.marca = marca;
        this.modelo = modelo;
        this.cor = cor;
        this.ano = ano;
    }
}

let car = new Car("Fiat", "Uno", "Vermelho", 2011);