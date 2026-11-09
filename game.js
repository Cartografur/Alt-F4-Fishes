const canvas=document.getElementById("tank");
const ctx=canvas.getContext("2d");

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