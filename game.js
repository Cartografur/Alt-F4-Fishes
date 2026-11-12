const canvas=document.getElementById("tank");
const ctx=canvas.getContext("2d");
const W = canvas.width; //canvas bredd i px
const H = canvas.height; //canvad höjd i px
const lidY = 0; //top av tanken, lock, y-värde i framkant.
const surfaceY = 20; //Vattenytans topp = horisontlinjen, y-värde
const sandY = H-25; //sanden på famsidan av akvariet, y-värde
const waterTop = surfaceY + 3; //bandet av vattenyta. högsta kant för fisk. Samma för alla 'djup'
const vp = { x: W/2, y: surfaceY }; //vanishing point, mitten av horisontlinjen. Bredd/2 och y från vattenytans topp
const backDepth = 0.75; //bakväggens djup
const step = (1 - backDepth) / 3; //tjocklek på varje skiva
const backWall = makeBounds(backDepth);
const bounds = [0.5, 1.5, 2.5].map(k => makeBounds(backDepth + step * k)); //fiskplan mitt i varje skiva
const fogBounds = [1, 2].map(k => makeBounds(backDepth + step * k)); //dimskikt mellan skivorna

// --- 1 AKVARIUM/TANK
function drawTank() {
	ctx.fillStyle="#71bfcc"; //bakgrunsfärg ovan vatten,syns på höger vänster kant
	ctx.fillRect(0,0,W,H); //(x, y, widh, height), xy origo är uppe till vänster i objektet, positiva värden till höger och ner
	
	ctx.fillStyle="#21653f"; //Backdrop (placeholder)
	ctx.fillRect(backWall.left, backWall.top, backWall.right-backWall.left,backWall.floor-backWall.top);

	fillPolygon([[0, surfaceY], [backWall.left, surfaceY], [backWall.left, backWall.floor], [0, sandY]], "#2a7cc0"); //vänster glas

	fillPolygon([[W, surfaceY], [backWall.right, surfaceY], [backWall.right, backWall.floor], [W, sandY]], "#2a7cc0"); //höger glas

	fillPolygon([[0, sandY], [backWall.left, backWall.floor], [backWall.right, backWall.floor], [W, sandY]], "#cabc91"); //sandbotten
	
	fillPolygon([[0, lidY], [W, lidY], [backWall.right, backWall.top], [backWall.left, backWall.top]], "#ffffba"); //top

	ctx.fillStyle="#b3a57a"; //Sand framkant
	ctx.fillRect(0,sandY,W,H-sandY);
	
	ctx.fillStyle="#afeeee"; //Ytlinje
	ctx.fillRect(0, surfaceY, W, 2);
}
function drawFog(b) {
	ctx.fillStyle="rgba(32, 113, 178, 0.6)"; //dim-lager,  rgb=röd, grön, blå, genomskinlighet (0 till 1) för att skapa djup
	ctx.fillRect(b.left, waterTop, b.right - b.left, b.floor - waterTop); 
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

// --- 4:1 Skalning och akvarium
function scale(v,c,s) { //v = läget för front-glaset, c = center(vp) , s = skalfaktor för vissuelt djup 
	return c + s * (v - c);
}

function makeBounds(s) { //s = skalfaktor. Funktion för skalning av de olika visuella lagrerna
	return {
		left: Math.round(scale(0, vp.x, s)),
		right: Math.round(scale(W, vp.x, s)), 
		floor: Math.round(scale(sandY, vp.y, s)),
		top: Math.round(scale(lidY, vp.y,s)),
	};
}	

function fillPolygon(points, color) { //rita och fylla polygoner enligt position från hörnen av de olika skalningarna
	ctx.fillStyle = color;
	ctx.beginPath();
	ctx.moveTo(points[0][0], points[0][1]);
	for (let i=1; i < points.length; i++){
		ctx.lineTo(points[i][0], points[i][1]);
	}
	ctx.closePath();
	ctx.fill();
}

// --- 4:2 Fiskfunktioner
function randomBetween(min, max) { // Formel för random random number, används för fiskars position
	return min + Math.random()*(max-min);
}

function updateFish(f) { //här uppdateras fiskens positions i tanken
	const b = bounds[f.layer];
	if (Math.random() < 0.002) { // ett random tillägg för ändring av riktning i x
		f.vx *= -1;
	}
	if (Math.random() < 0.01) { // ett random tillägg för ändring av riktning i y
	f.vy = randomBetween(-0.2, 0.2);
	}
	
	f.x+=f.vx; //Samma som "fishx=fishy+fishvx", uppdaterar positioni x
	f.y+=f.vy; //uppdaterar fisk i y-led, vy är random, inte fisk-specifik

	if (f.x>=b.right-f.w) { //"chek" för kanter i x
	f.vx=-Math.abs(f.vx);
	}
	if (f.x<=b.left){ 
		f.vx=Math.abs(f.vx);
	}
	
	if (f.y>=b.floor-f.h) { //"Check" för kanter i y
		f.vy=-Math.abs(f.vy);
	}
	if (f.y<=waterTop){ 
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
	const layer = Math.floor(Math.random()*3);
	const b = bounds[layer];
	return {
		layer: layer,
		x: randomBetween(b.left, b.right-sp.w),
		y: randomBetween(waterTop, b.floor-sp.h),
		vx: sp.vx*dir,
		vy: randomBetween(-0.2, 0.2),
		w: sp.w,
		h: sp.h,
		color: sp.color
	};
}
	
// --- 5 LOOP det här är biten som animerar. Rensar och ritar om vyn
function gameLoop(){
	ctx.clearRect(0,0,W,H);
	
	drawTank();
	
	fishes.forEach(f => updateFish(f));

	for (let layer=0; layer < 3; layer++) { //Börja på lager 0. är lager mindre än 3, lägg till lager(?)
		fishes.filter(f => f.layer === layer).forEach(f => drawFish(f));
		if (layer < 2) {
			drawFog(fogBounds[layer]);
			}
		};

    requestAnimationFrame(gameLoop);
}

gameLoop();