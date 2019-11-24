//initialize the canvas
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

//canvas dimensions
var W = canvas.width = window.innerWidth; 
var H = canvas.height = window.innerHeight;

document.body.appendChild(canvas); //append canvas to body

//make an array of particles
var particles = [];
for(var i = 0; i < 50; i++) {
	//add 50 particles to the array in random positions
	particles.push(new create_particle());
}

function create_particle() {
	//set start position to random
	this.x = Math.random()*W;
	this.y = Math.random()*H;

	//set velocity of each particle to random
	this.vx = Math.random()*20-10;
	this.vy = Math.random()*20-10;

	//random particles colors
	var r = Math.random()*255>>0;
	var g = Math.random()*255>>0;
	var b = Math.random()*255>>0;
	this.color = "rgba("+r+","+g+","+b+", 0.5)";

	//set random particle size
	this.radius = Math.random()*20+20;
}


var x = 100; var y = 100;

//animate particle
function draw() {
	//moving this background code inside draw() will remove the trail
	//the background should not blend with the previous frame
	ctx.globalCompositeOperation = "source-over";

	//set canvas to black
	//ctx.fillStyle = "black";
	//reducing the opacity of the backgroung paint
	ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
	ctx.fillRect(0, 0, W, H);

	//blend particles with background
	ctx.globalCompositeOperation = "lighter";

	//draw a particle from the array
	for(var t = 0; t < particles.length; t++) {
		var p = particles[t];

		ctx.beginPath();

		//set colors for particles
		var gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
		gradient.addColorStop(0, "white");
		gradient.addColorStop(0.4, "white");
		gradient.addColorStop(0.4, p.color);
		gradient.addColorStop(1, "black");

		ctx.fillStyle = gradient;
		ctx.arc(p.x, p.y, p.radius, Math.PI*2, false)
		ctx.fill();

		//use the velocity setting
		p.x += p.vx;
		p.y += p.vy;

		//set boundry so particles don't leave the canvas
		if(p.x < -50)p.x = W+50;
		if(p.y < -50)p.y = H+50;
		if(p.x > W+50)p.x = -50;
		if(p.y > H+50)p.y = -50;
	}
}

setInterval(draw, 33);