

// --- 0 INSTÄLLNINGAR allmänt
const changeDirX = 0.12; //chans per sekund, höger vänster
const changeDirY = 0.6; //chans per sekund, upp och ner
const maxVY = 12; //förflyttning pixlar per sekund, maxvärde.
const changeZ = 0.3; //chans per vändning. 1= alla vändningar resulterar i ändring av djup, 0.1 = 10% av alla vändningar ändrar djup

const layerCount = 4; //Antal skikt för visuellt djup

const lightColor = "rgba(0, 0, 20, 0.5)";
const fogColor ="rgba(32, 113, 178, 0.2)"; //R G B Alpha (genomskinlighet)

const fishAmnt = 25; //antal fiskar i akvariet

// --- 0 INSTÄLLNINGAR TANK
const canvas=document.getElementById("tank");
const lightBtn = document.getElementById("lightBtn");
let lightsOn=true;
const ctx=canvas.getContext("2d");
const W = canvas.width; //canvas bredd i px
const H = canvas.height; //canvad höjd i px

const lidY = 0; //top av tanken, lock, y-värde i framkant.
const surfaceY = 20; //Vattenytans topp = horisontlinjen, y-värde
const sandY = H-25; //sanden på famsidan av akvariet, y-värde
const waterTop = surfaceY + 2; //bandet av vattenyta. högsta kant för fisk. Samma för alla 'djup'
const vp = { x: W/2, y: surfaceY }; //vanishing point, mitten av horisontlinjen. Bredd/2 och y från vattenytans topp
const backDepth = 0.70; //bakväggens djup
const step = (1 - backDepth) / layerCount; //tjocklek på varje skiva
const backWall = makeBounds(backDepth);
const bounds = []; //fiskplan mitt i varje skiva mellan fog-layers
	for (let k = 0; k < layerCount; k++) {
		bounds.push(makeBounds(layerDepth(k)));
	}
const fogBounds = []; //fog-layer mellan skivorna
	for (let k = 1; k < layerCount; k++) {
		fogBounds.push(makeBounds(backDepth + step * k));
	}

const depthSpeed = step * 1.5; //hur snabbt fiskar glider mellan lager (s per sekund)

lightBtn.addEventListener("click", () => {
	lightsOn=!lightsOn;
});

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
	ctx.fillStyle=fogColor; //dim-lager,  rgb=röd, grön, blå, genomskinlighet (0 till 1) för att skapa djup
	ctx.fillRect(b.left, waterTop, b.right - b.left, b.floor - waterTop); 
}

// --- 2 Spdecies data
const species = [
	{ name: "Red tetra", color: "#ff0000", w:3, h:2, vx:48 }, //vx är förflyttning i pixlar per sekund
	{ name: "Yellow guppy", color: "#ffff00", w:3, h:3, vx:66 },
	{ name: "Green needle", color: "#00ff00", w:15, h:1, vx: 30},
	{ name: "Blue blobb", color: "#0000ff", w:20, h:15, vx:18},
	{ name: "Orange platy", color: "#ff8800", w:5, h:3, vx:25 },
	{ name: "Pink arrow", color: "#ff00ff", w:10, h:2, vx: 27}

];

// --- 3 Fiskstim
const fishes = [];
for (let i =0; i<fishAmnt; i++) {
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

function layerDepth(layer) { //djupet s mitt i en skiva
	return backDepth + step * (layer + 0.5);
}

// --- 4:2 Fiskfunktioner
function randomBetween(min, max) { // Formel för random random number, används för fiskars position
	return min + Math.random()*(max-min);
}

function updateFish(f, dt) { //här uppdateras fiskens positions i tanken
	if (f.s !== f.targetS) { //fisken glider mot nytt djup
		const oldS = f.s;
		const maxChange = depthSpeed * dt;
		const diff = f.targetS - f.s;
		if (Math.abs(diff) <= maxChange) {
			f.s = f.targetS; //framme
		} else {
			f.s += Math.sign(diff) * maxChange; //Math.sign ger 1 eller -1
		}
		const k = f.s / oldS; //skalning runt flyktpunkten
		f.x = vp.x + k * (f.x - vp.x);
		f.y = vp.y + k * (f.y - vp.y);
		f.layer = Math.min(bounds.length - 1, Math.floor((f.s - backDepth) / step)); //vilken skiva den är i nu
	}
	const b = makeBounds(f.s); //väggarna på fiskens eget djup
	let turned=false;
	if (Math.random() < changeDirX*dt) { // ett random tillägg för ändring av riktning i x (chans/sekund)
		f.vx *= -1;
		turned = true;
	}
	if (Math.random() < changeDirY*dt) { // ett random tillägg för ändring av riktning i y (chans/sekund)
		f.vy = randomBetween(-maxVY, maxVY);
	}
	
	f.x+=f.vx*dt; //Samma som "fishx=fishx+fishvx*delta t", uppdaterar positioni x
	f.y+=f.vy*dt; //uppdaterar fisk i y-led, vy är random, inte fisk-specifik

	if (f.x>=b.right-f.w) { //"chek" för kanter i x
		f.x=b.right-f.w; //hindrar fisk från att simma utanför sitt lager
		f.vx=-Math.abs(f.vx);
		turned=true;
	}
	if (f.x<=b.left){ 
		f.x=b.left;
		f.vx=Math.abs(f.vx);
		turned=true;
	}
	
	if (f.y>=b.floor-f.h) { //"Check" för kanter i y
		f.y=b.floor-f.h;
		f.vy=-Math.abs(f.vy);
	}
	if (f.y<=waterTop){ 
		f.y=waterTop;
		f.vy=Math.abs(f.vy);
	}
	if (turned && Math.random() < changeZ) switchLayer(f);	
}

function switchLayer(f) {
	if (f.s !== f.targetS) return; //glider redan, vänta tills den är framme
	const maxLayer = bounds.length - 1;
	let dir = 1;
	if (Math.random() < 0.5) {
		dir = -1;
	}
	const newLayer = Math.max(0, Math.min(maxLayer, f.layer + dir));
	f.targetS = layerDepth(newLayer); //mitt i nya skivan
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
	const layer = Math.floor(Math.random()*bounds.length);
	const b = bounds[layer];
	const s = layerDepth(layer); //Fiskens djup mitt i sitt befintliga skikt
	return {
		layer: layer,
		s: s,
		targetS: s,
		x: randomBetween(b.left, b.right-sp.w),
		y: randomBetween(waterTop, b.floor-sp.h),
		vx: sp.vx*dir,
		vy: randomBetween(-maxVY, maxVY),
		w: sp.w,
		h: sp.h,
		color: sp.color
	};
}
	
// --- 5 LOOP det här är biten som animerar. Rensar och ritar om vyn
function gameLoop(now){
	let dt=(now-lastTime)/1000; //millisec till sec.
	lastTime=now;
	dt = Math.min(dt, 0.1); //cap
	ctx.clearRect(0,0,W,H);
	
	drawTank();
	
	fishes.forEach(f => updateFish(f, dt));	
	
	const drawOrder = fishes.slice().sort((f1, f2) => f1.s - f2.s); //kopierar listan på fisk och sorterar bakifrån och fram på s
	drawOrder.forEach(f => drawFish(f)); //ritar varje fisk från ordningen i drawOrder, bakifrån och fram
	
	//for (let layer=0; layer < bounds.length; layer++) { //Börja på lager 0. är antal lager mindre än max fortsätter de bearbetas
	//	fishes.filter(f => f.layer === layer).forEach(f => drawFish(f));
	//	if (layer < fogBounds.length) {
	//		drawFog(fogBounds[layer]);
	//		}
	//	}

	if (!lightsOn) {
		ctx.fillStyle=lightColor;
		ctx.fillRect (0,0,W,H);
	}

    requestAnimationFrame(gameLoop);
}
let lastTime = performance.now();
requestAnimationFrame(gameLoop);