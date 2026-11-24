	// === 1 ELEMENT (från HTML)
const canvas= document.getElementById("tank");
const lightBtn = document.getElementById("lightBtn");
const depthUp = document.getElementById("depthUp");
const depthDown = document.getElementById("depthDown");


	// === 2 INSTÄLLNINGAR
		//	2:1 Tank, djup och band
const minBands = 2; //minsta tankdjup (startnivå)
const maxBands = 7; //största tankdjup
const maxDepth = 0.45; //djupet tanken aldrig passerar
const depthRatio = 0.8; //r, hur mycket tunnare varje band är än det framför 0.8 betyder 80% av föregående lagers tjocklek
const lidY = 0; //top av tanken, lock, y-värde i framkant.
const surfaceY = 20; //Vattenytans topp = horisontlinjen, y-värde
const sandFrontH = 25; //px höjd för sand i framkant
const surfaceH = 2; //Ytlinjens tjocklek/höjd i px

		//	2:2 Färger och dimma
const lightColor = [0, 0, 20]; // R G B, tekniskt sett skuggans färg (släckt ljus)
const lightAlpha = 0.5; //alfa, genomskinlighet för lightColor
const waterColor = [32, 113, 178]; //färg för dimmning av visuellt djup
const surfaceColor = [175,238,238]; //färgen för yt-randen
const fogDensity = 4; //grumlighet för visuellt djup. Högre värde mer grummel.
const backdropFogS = 0.95; //separat låtsasdjup för bakgrunden i tanken för att kunna ställa foging individuellt, nära 1 är ljust, nära 0 mörkt
const sandLight = [227, 219, 197]; //ljusaste bandfärgen för sand
const sandDark = [177, 157, 93]; //mörkaste bandfärgen för sand
const sandFrontColor = [179,165,122]; //färg på sanden vid glaset längst fram
const glassLight = [91, 161, 219]; //ljusaste bandfärgen för sidoglasen
const glassDark = [28, 83, 129]; //mörkaste bandfärgen för sidoglasen
const sandFogAmount = 0.1; 	//hur mycket dimma sanden får, 0 = ingen, 1 = full
const backdrop = [33,101,63]; //Backdrop (placeholder-färg)
const bgColor = [113,191,204]; 	//backgrundfärg bakom tanken. Syns på höger vänster kant ovanför vattnet
const lidColor = [255,255,186]; //Färg på locket

		//	2:3 Fiskar och sprites
const fishAmnt = 50; 		//antal fiskar i akvariet
const tintSteps = 15; 		//antal steg mellan skuggning som genereras för varje fisk (antal skuggningar är 1+tintSteps)

		//	2:4 Fiskrörelse
const changeDirX = 0.12; 	//chans per sekund, höger vänster
const changeDirY = 0.6; 	//chans per sekund, upp och ner
const maxVY = 12; 			//förflyttning pixlar per sekund, maxvärde.
const changeZ = 0.3; 		//chans per vändning. 1= alla vändningar resulterar i ändring av djup, 0.1 = 10% av alla vändningar ändrar djup
const depthBuffer = 0.3; 	//andel av främsta/bakersta bandet som fiskarna inte simmar i
const depthSpeed = 0.1;  	//hur snabbt fiskar glider i djupled (s per sekund)


	// === 3 HÄRLEDDA VÄRDEN
		//	3:1 Tankens geometri
const ctx = canvas.getContext("2d");
const W = canvas.width; //canvas bredd i px
const H = canvas.height; //canvas höjd i px
const sandY = H-sandFrontH; //sanden på framsidan av akvariet, y-värde
const waterTop = surfaceY + surfaceH; //bandet av vattenyta. högsta kant för fisk. Samma för alla 'djup'
const vp = { x: W/2, y: surfaceY }; //vanishing point, mitten av horisontlinjen. Bredd/2 och y från vattenytans topp

		//	3:2 Fiskrelaterat
const fishFront = lerp(bandEdge(0), bandEdge(1), depthBuffer); //främsta djupet för fisk

	// === 4 TILLSTÅND (allt som ändras under spelets gång)
let lightsOn=true;

let backDepth, backWall, fishBack; // alla värden räknas ut i updateDepth 

const tintCache = {}; //sparade dimmade kopior, nyckel = "artnamn_klass"

const fishes = [];

let bandCount = minBands;

	// === 5 ARTDATA
const species = [
	{ name: "Red tetra", 	src: "sprites/RedTetra.png", 	vx: 48 }, //vx är förflyttning i pixlar per sekund, w och h läses från sprite i stycke 12.
	{ name: "Yellow guppy", src: "sprites/YellowGuppy.png", vx: 66 },
	{ name: "Green needle", src: "sprites/GreenNeedle.png", vx: 30 },
	{ name: "Blue blobb", 	src: "sprites/BlueBlob.png", 	vx: 18 },
	{ name: "Orange platy", src: "sprites/OrangePlaty.png", vx: 25 },
	{ name: "Pink arrow", 	src: "sprites/PinkArrow.png", 	vx: 27 },
	{ name: "Sprite test", 	src: "sprites/fish_01.png", 	vx: 20 }
];


	// === 6 HJÄLPFUNKTIONER
function lerp(a,b,t) { //formel för linjär förändring, Linear interpolation
	return a + t * (b - a); 
}
function scale(v,c,s) { //v = läget för front-glaset, c = center(vp) , s = skalfaktor för visuellt djup 
	return lerp(c, v, s);
}
function lerpColor(c1, c2, t) { //lerp per färgkanal, returnerar [r, g, b] utan avrundning
	const r = lerp(c1[0], c2[0], t);
	const g = lerp(c1[1], c2[1], t);
	const b = lerp(c1[2], c2[2], t);
	return [r, g, b];
}
function randomBetween(min, max) { // Formel för random number, används för fiskars position
	return min + Math.random()*(max-min);
}
function toRGB(color, a=1){ //konverterar en array till läsbart RGB-värde (färgsträng) för canvas
	return `rgba(${Math.round(color[0])}, ${Math.round(color[1])}, ${Math.round(color[2])}, ${a})`;
}

	// === 7 DJUP OCH PERSPEKTIV
function bandEdge(k) {
	return 1-maxDepth*(1-depthRatio**k); // ** är ^, men ^ är nåt annat i JS
}
function makeBounds(s) { //s = skalfaktor. Funktion för skalning av de olika visuella lagerna
	return {
		left: Math.round(scale(0, vp.x, s)),
		right: Math.round(scale(W, vp.x, s)), 
		floor: Math.round(scale(sandY, vp.y, s)),
		top: Math.round(scale(lidY, vp.y,s)),
	};
}	
function updateDepth() { //räknar om allt som beror på tankens djup
	backDepth = bandEdge(bandCount); //bakväggens djup
	fishBack = lerp(backDepth, bandEdge(bandCount - 1), depthBuffer); //bakersta djupet för fisk
	backWall = makeBounds(backDepth);
}
function randomDepth() { //slumpar fiskens djup (s) efter tillgängligt utrymme mellan front och bakvägg
	return randomBetween(fishBack, fishFront);
}


	// === 8 DIMMA
// Funktionen nedan kommer från Beer-Lambert.
// en lag som beskriver hur ljus absorberas direkt proportionerligt till en substans koncentration (luddig förklaring)
// d = distance, avstånd. 1 minus objektets position i z. I det här fallet avstånd mellan front av akvarie och enhet
// c = koefficient "dämpningskoefficient", hur mycket ljus som försvinner per längdenhet. Här hur grumligt vattnet är. se fogDensity
// T = transmittans. Hur mycket ljus som tar sig fram. ett värde mellan 0 och 1. Räknas ut med e^(-c*d), se ovan för c och d.
// T = 0 betyder att inget ljus kommer fram, T = 1 betyder att allt ljus kommer fram.
function transmittance(s) { //T = e^(-c*d), d = 1 - s
	return Math.exp(-fogDensity * (1 - s));
}
function fogColor(color, s) { // blandar objektets färg med vattenfärgen. T = 0 ger vattenfärg, T = 1 ger objektets egen färg
	const T = transmittance(s);
	const c = lerpColor(waterColor, color, T);	
	return c;
}
function tintSprite(img, T) { //gör en dimmad kopia av spriten för transmittance, T (baserat på s)
	const c = document.createElement("canvas"); //en dold canvas, syns inte på sidan
	c.width = img.width;
	c.height = img.height;
	const tctx = c.getContext("2d"); //eget namn, så den inte blandas ihop med ctx
	tctx.drawImage(img, 0, 0); //spriten först
	tctx.globalCompositeOperation = "source-atop"; //måla bara där spriten har pixlar
	tctx.fillStyle =  toRGB(waterColor, 1-T);
	tctx.fillRect(0, 0, c.width, c.height);
	return c; //en canvas kan ritas med drawImage precis som en bild
}
function getTinted(f) {//hämtar fiskens dimmade kopia, gör den om den inte finns
	const T = transmittance(f.s);
	const cl = Math.round(T * tintSteps);	// räkna ut fiskens klass k från f.s (transmittance och Math.round)
	const key = `${f.name}_${cl}`; // bygg nyckeln för en tintad sprite (fisknamn_klass)
	if (!tintCache[key]){	// om nyckeln saknas i tintCache: skapa kopian med tintSprite och spara den där
		tintCache[key] = tintSprite(f.sprite, cl/tintSteps);
	}
	return tintCache[key];	// returnera kopian från tintCache
}


	// === 9 RITA TANKEN
function fillPolygon(points, color) { //rita och fylla polygoner enligt position från hörnen av de olika skalningarna, color är en RGB array
	ctx.fillStyle = toRGB(color); 
	ctx.beginPath();
	ctx.moveTo(points[0][0], points[0][1]);
	for (let i=1; i < points.length; i++){
		ctx.lineTo(points[i][0], points[i][1]);
	}
	ctx.closePath();
	ctx.fill();
}
function fillPolygonSharp(points, color) { // color är en RGB array
	ctx.fillStyle = toRGB(color);
	const ys = points.map(p => p[1]);   // alla hörns y-värden. "Punktens koordinater[x,y] => plocka ut punktes y (p[1])"
	const yMin = Math.min(...ys);       // Math.min tar bara emot lösa tal, inte arrayer. "..." löser upp array till lösa tal. returnerar min-värde
	const yMax = Math.max(...ys);	// samma som ovan fast maxvärde

	for (let y = yMin; y<yMax; y++) { // räknar en rad i taget uppifrån och ner
		const yc = y + 0.5;  //radens mittlinje
		const xs = [];       //här samlas kanternas skärningar med mittlinjen
		
		for (let i = 0; i < points.length; i++) { // Ett varv per kant i polygonen
			const [x1, y1] = points[i]; //två punkter gör en linje
			const [x2, y2] = points[(i+1) % points.length]; // Sista kanten avslutar vid första punkten för att sluta polygonen
			if ((y1 <= yc && yc < y2) || (y2 <= yc && yc < y1)){ // kontrollerar om kanten når yc
				const t = (yc - y1) / (y2 -y1); // lerp baklänges
				xs.push(lerp(x1, x2 ,t)); // x på samma ställe längs kanten
			}
		}
		
		xs.sort((a,b) => a-b); //sortera som tal, utan jämförelse sorteras de som text
		for (let j = 0; j < xs.length; j += 2) { // Udda-jämn regeln, korsningarna tas i par, in–ut, en fillRect per par
			const xa = Math.round(xs[j]);
			const xb = Math.round(xs[j+1]);
			ctx.fillRect(xa, y, xb - xa, 1); // delen som ritar ut hela raden mellan ytterkanterna, 1px hög. Allt ovanför beräknar den skarpa kantens position.
		}
	}
}
function drawTank() {
	ctx.fillStyle = toRGB(bgColor);
	ctx.fillRect(0,0,W,H); //(x, y, width, height), xy origo är uppe till vänster i objektet, positiva värden till höger och ner
	
	ctx.fillStyle = toRGB(backdrop); 
	ctx.fillRect(backWall.left, backWall.top, backWall.right-backWall.left,backWall.floor-backWall.top);
	
	//dimma på bakväggen, bara under ytan. Alfa 1-T ger samma lerp som fogColor
	const backT = transmittance(backdropFogS);
	ctx.fillStyle = toRGB(waterColor, 1 - backT);
	ctx.fillRect(backWall.left, surfaceY, backWall.right - backWall.left, backWall.floor - surfaceY);
	
	//band på sand och glas, framifrån och bakåt
	for (let i = 0; i < bandCount; i++) {
		const sA = bandEdge(i);       //bandets främre kant
		const sB = bandEdge(i+1); //bandets bakre kant
		const a = makeBounds(sA);
		const b = makeBounds(sB);
		const sMid = (sA + sB) / 2; //dimma från mitten av bandet
		const t = Math.min(1, (1 - sMid) / maxDepth); //0 vid frontglas, 1 vid maxDepth
		const sandC = lerpColor(sandLight, sandDark, t);
		const glassC = lerpColor(glassLight, glassDark, t);

		fillPolygon([[a.left, a.floor], [b.left, b.floor], [b.right, b.floor], [a.right, a.floor]], fogColor(sandC, 1 - (1 - sMid) * sandFogAmount)); //sand
		fillPolygon([[a.left, surfaceY], [b.left, surfaceY], [b.left, b.floor], [a.left, a.floor]], glassC); //vänster glas
		fillPolygon([[a.right, surfaceY], [b.right, surfaceY], [b.right, b.floor], [a.right, a.floor]], glassC); //höger glas
	}
	
	fillPolygonSharp([[0, lidY], [W, lidY], [backWall.right, backWall.top], [backWall.left, backWall.top]], lidColor); //top

	ctx.fillStyle=toRGB(sandFrontColor); //Sand framkant
	ctx.fillRect(0,sandY,W,H-sandY);
	
	ctx.fillStyle=toRGB(surfaceColor); //Ytlinje
	ctx.fillRect(0, surfaceY, W, surfaceH);
}


	// === 10 FISKAR
function makeFish(sp) {
	let dir = 1;
	if (Math.random() < 0.5) {
		dir = -1;
	}
	const s = randomDepth(); 
	const b = makeBounds(s);
	return {
		s: s,
		targetS: s,
		x: randomBetween(b.left, b.right-sp.w),
		y: randomBetween(waterTop, b.floor-sp.h),
		vx: sp.vx*dir,
		vy: randomBetween(-maxVY, maxVY),
		w: sp.w,
		h: sp.h,
		sprite: sp.sprite,
		name: sp.name
	};
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
	
	f.x+=f.vx*dt; //Samma som "fishx=fishx+fishvx*delta t", uppdaterar position i x
	f.y+=f.vy*dt; //uppdaterar fisk i y-led, vy är random, inte fisk-specifik

	if (f.x>=b.right-f.w) { //"check" för kanter i x
		f.x=b.right-f.w; //hindrar fisk från att simma "utanför" glaset
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
	if (turned && Math.random() < changeZ) switchDepth(f);	
}
function switchDepth(f) {
	if (f.s !== f.targetS) return; //glider redan, vänta tills den är framme
	f.targetS = randomDepth();
}
function drawFish(f) { //Här ritas fisken utifrån fisk-species 
	const img = getTinted(f);
	if (f.vx > 0) {
		ctx.save();
		ctx.scale(-1, 1);
		ctx.drawImage(img, -Math.floor(f.x) - f.w, Math.floor(f.y));
		ctx.restore();
	} else {
		ctx.drawImage(img, Math.floor(f.x), Math.floor(f.y));
	}
}


	// === 11 KNAPPAR
lightBtn.addEventListener("click", () => {
	lightsOn=!lightsOn;
});
depthUp.addEventListener("click", () => {
	bandCount=Math.min(maxBands, bandCount + 1);
	updateDepth();
	fishes.forEach(f => { if (f.targetS < fishBack) f.targetS = randomDepth(); });
});
depthDown.addEventListener("click", () => {
	bandCount=Math.max(minBands, bandCount - 1);
	updateDepth();
	fishes.forEach(f => { if (f.targetS < fishBack) f.targetS = randomDepth(); });
});


	// === 12 START OCH LOOP (ladda sprites → skapa fiskar → gameLoop)
updateDepth();

const loads = species.map(sp => { // ett "löfte" per bild
	sp.sprite = new Image();
	sp.sprite.src = sp.src;
	return sp.sprite.decode().then(() => { // när bilden är klar:
		sp.w = sp.sprite.naturalWidth; //läs av bildens bredd
		sp.h = sp.sprite.naturalHeight; //läs av bildens höjd
	}).catch(err => { //om laddning av bild myislyckas gör det här:
		console.error("Kunde inte ladda: " + sp.src); //skriv konsol-error
		throw err; //skicka felet vidare, så Promise.all fortfarande stoppar
	});
});

Promise.all(loads).then(() => { // väntar tills ALLA bilder är klara. Om error händer i "loads" laddas ingen fisk.
	for (let i = 0; i < fishAmnt; i++) {
		const sp = species[Math.floor(Math.random() * species.length)];
		fishes.push(makeFish(sp));
	}
});	

function gameLoop(now){
	let dt=(now-lastTime)/1000; //millisec till sec.
	lastTime=now;
	dt = Math.min(dt, 0.1); //cap
	ctx.clearRect(0,0,W,H);
	
	drawTank();
	
	fishes.forEach(f => updateFish(f, dt));	
	
	const drawOrder = fishes.slice().sort((f1, f2) => f1.s - f2.s); //kopierar listan på fisk och sorterar bakifrån och fram på s
	drawOrder.forEach(f => drawFish(f)); //ritar varje fisk från ordningen i drawOrder, bakifrån och fram
	
	if (!lightsOn) {
		ctx.fillStyle=toRGB(lightColor, lightAlpha);
		ctx.fillRect (0,0,W,H);
	}

    requestAnimationFrame(gameLoop);
}

let lastTime = performance.now();
requestAnimationFrame(gameLoop);