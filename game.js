const canvas=document.getElementById("tank");
const ctx=canvas.getContext("2d");

// --- 1 AKVARIUM/TANK
function drawTank() {
	ctx.fillStyle="#2071b2"; //Defeinierar färgen som används för VATTEN
	ctx.fillRect(0,20,320,160); //(x, y, widh, height), xy origo är uppe till vänster i objektet, positiva värden till höger och ner

	ctx.fillStyle="#baa86f"; //SAND_mörk
	ctx.fillRect(0,155,320,10);

	ctx.fillStyle="#C2B280"; //SAND_medium
	ctx.fillRect(0,160,320,5);

	ctx.fillStyle="#Cabc91"; //SAND_ljus
	ctx.fillRect(0,165,320,15);

	ctx.fillStyle="#afeeee"; //YTLINJE
	ctx.fillRect(0,20,320,2);
}

// --- 2 Spdecies data
const species = [
	{ name: "Red tetra", color: "#ff0000", w:3, h:2, spd:1 },
	{ name: "Yellow guppy", color: "#ffff00", w:3, h:3, spd:1.5 },
	{ name: "Green needle", color: "#00ff00", w:10, h:1, spd: 0.7},
	{ name: "Blue blobb", color: "#0000ff", w:8, h:7, spd:0.5}
];

// --- 3 Fiskstim
const fishes = [];
for (let i =0; i<8; i++) {
  const  sp = species[Math.floor(Math.random()*species.length)];
  fishes.push(makeFish(sp));    
  }
	
// --- 4 FUNKTIONER

function randomBetween(min, max) { // Formel för random random number, används för fiskars position
	return min + Math.random()*(max-min);
}

function updateFish(f) { //här uppdateras fiskens positions i tanken
	f.x+=f.spd; //Samma som "fishX=fishX+fishSpd"
	
	if (f.x>=320-f.w) { 
		f.spd*= -1;
	}
	if (f.x<=0){ 
		f.spd*=-1;
	}
}

function drawFish(f) { //Här ritas fisken utifrån fisskfärg och fiskens huvud beroende på rörelseriktning
	ctx.fillStyle=f.color
	ctx.fillRect(Math.floor(f.x), Math.floor(f.y), f.w, f.h); //avvrundar positionen för fiskens placering till jämna pixlar
	
	ctx.fillStyle="#000000";
	if (f.spd>0){
		ctx.fillRect(Math.floor(f.x) + f.w - 1, Math.floor(f.y), 1, 1);
	}
	else{
		ctx.fillRect(Math.floor(f.x), Math.floor(f.y), 1, 1);
	}
}

function makeFish(sp) {
	let dir = 1;
	if (Math.random() < 0.5) {
		dir = -1;
	}
	return {
		x: randomBetween(0,320-sp.w ),
		y: randomBetween(23,154-sp.h ),
		spd: sp.spd*dir,
		w: sp.w,
		h: sp.h,
		color: sp.color
	};
}
	

// --- 5 LOOP det här är biten som animerar. Rensar och ritar om vyn
function gameLoop(){
	ctx.clearRect(0,0,320,180);
	
	drawTank();

  fishes.forEach(f => {
  	updateFish(f);
	  drawFish(f);
  });

    requestAnimationFrame(gameLoop);
}

gameLoop();
