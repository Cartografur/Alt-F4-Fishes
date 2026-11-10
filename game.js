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

// --- 2 FISKEN
let fishX=50; // Fisk XY är fiskens start-position, sp=speed
let fishY=90;
let fishSp=1;
const fishW=3; // Fish WH bredd och höjd
const fishH=2;


// --- 3 LOOP det här är biten som animerar. Rensar och ritar om vyn
function gameLoop(){
	ctx.clearRect(0,0,320,180);
	drawTank();

	fishX+=fishSp; //Samma som "fishX=fishX+fishSp"
	
	if (fishX>=320-fishW) { 
		fishSp*= -1;
	}
	if (fishX<=0){ 
		fishSp*=-1;
	}
	ctx.fillStyle="#ff0000";
	ctx.fillRect(fishX,fishY,fishW,fishH);
	
	ctx.fillStyle="#000000";
	if (fishSp>0){
		ctx.fillRect(fishX+fishW-1,fishY,1,1);
	}
	else{
		ctx.fillRect(fishX,fishY,1,1);
	}
	requestAnimationFrame(gameLoop);
}

gameLoop();