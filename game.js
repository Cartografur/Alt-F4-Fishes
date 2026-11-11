const canvas=document.getElementById("tank");
const ctx=canvas.getContext("2d");
const fogBottom = [163, 171];      // bottenkant av bagrund och mellan
const floor = [163, 171, 179];     // lägsta tillåtna y (botten-värde) för bakgrund-, mellan- och förgrundsFISK

// --- 1 AKVARIUM/TANK
function drawTank() {
	ctx.fillStyle="#2071b2"; //Defeinierar färgen som används för VATTEN
	ctx.fillRect(0,20,320,160); //(x, y, widh, height), xy origo är uppe till vänster i objektet, positiva värden till höger och ner

	ctx.fillStyle="#Cabc91"; //SAND
	ctx.fillRect(0,155,320,25);

	ctx.fillStyle="#afeeee"; //YTLINJE
	ctx.fillRect(0,20,320,2);
}
function drawFog(bottom) {
	ctx.fillStyle="rgba(32, 113, 178, 0.6)"; //dim-lager,  rgb=röd, grön, blå, genomskinlighet (0 till 1) för att skapa djup
	ctx.fillRect(0,23,320,bottom-23); 
}

// --- 2 Spdecies data
const species = [
	{ name: "Red tetra", color: "#ff0000", w:3, h:2, vx:0.8 },
	{ name: "Yellow guppy", color: "#ffff00", w:3, h:3, vx:1.1 },
	{ name: "Green needle", color: "#00ff00", w:10, h:1, vx: 0.5},
	{ name: "Blue blobb", color: "#0000ff", w:8, h:7, vx:0.3}
];

// --- 3 Fiskstim
const fishes = [];
for (let i =0; i<50; i++) {
  const  sp = species[Math.floor(Math.random()*species.length)];
  fishes.push(makeFish(sp));    
  }
	
// --- 4 FUNKTIONER

function randomBetween(min, max) { // Formel för random random number, används för fiskars position
	return min + Math.random()*(max-min);
}

function updateFish(f) { //här uppdateras fiskens positions i tanken
	if (Math.random() < 0.002) { // ett random tillägg för ändring av riktning i x
		f.vx *= -1;
	}
	if (Math.random() < 0.01) { // ett random tillägg för ändring av riktning i y
	f.vy = randomBetween(-0.2, 0.2);
	}
	
	f.x+=f.vx; //Samma som "fishx=fishy+fishvx", uppdaterar positioni x
	f.y+=f.vy; //uppdaterar fisk i y-led, vy är random, inte fisk-specifik

	if (f.x>=320-f.w) { //"chek" för kanter i x
	f.vx=-Math.abs(f.vx);
	}
	if (f.x<=0){ 
		f.vx=Math.abs(f.vx);
	}
	
	if (f.y>=floor[f.layer]-f.h) { //"Check" för kanter i y
		f.vy=-Math.abs(f.vy);
	}
	if (f.y<=23){ 
		f.vy=Math.abs(f.vy);
	}
}

function drawFish(f) { //Här ritas fisken utifrån fisk-species 
	ctx.fillStyle=f.color
	ctx.fillRect(Math.floor(f.x), Math.floor(f.y), f.w, f.h); //avvrundar positionen för fiskens placering till jämna pixlar
	
	ctx.fillStyle="#000000"; //och nedan fiskens huvud beroende på rörelseriktning
	if (f.vx>0){
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
		layer: Math.floor(Math.random()*3),
		x: randomBetween(0,320-sp.w ),
		y: randomBetween(23,154-sp.h ),
		vx: sp.vx*dir,
		vy: randomBetween(-0.2, 0.2),
		w: sp.w,
		h: sp.h,
		color: sp.color
	};
}
	
// --- 5 LOOP det här är biten som animerar. Rensar och ritar om vyn
function gameLoop(){
	ctx.clearRect(0,0,320,180);
	
	drawTank();
	
	fishes.forEach(f => updateFish(f));

	for (let layer=0; layer < 3; layer++) { //Börja på lager 0. är lager mindre än 3, lägg till lager(?)
		fishes.filter(f => f.layer === layer).forEach(f => drawFish(f));
		if (layer < 2) {
			drawFog(fogBottom[layer]);
			}
		};

    requestAnimationFrame(gameLoop);
}

gameLoop();