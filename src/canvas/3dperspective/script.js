var canvas = document.createElement("canvas"); //create a canvas
//make canvas full screen
var w = canvas.width = window.innerWidth;
var h = canvas.height = window.innerHeight;

var fov = 250; // pixels are 250px on z index

var ctx = canvas.getContext("2d");

document.body.appendChild(canvas); //append canvas to body

//array of pixels with 3 dimensional coordinates
//square sheet of dots separated by 5px
var pixels = [];
for(var x = -250; x < 250; x += 5)
	for(var z = -250; z < 250; z += 5)
		pixels.push({x: x, y:40, z: z});

//draw points
function render() {
	ctx.clearRect(0,0,w,h);
	//get a screenshot of the canvas using getImageData
	var imagedata = ctx.getImageData(0,0,w,h);
	//loop through pixel points
	var i = pixels.length;
	while(i--) {
		var pixel = pixels[i];
		//calculate 2d position for 3d coordinates
		//fov = field of view = is how far away the points are 
		//scale controls the distance between the points as they go down the z axes
		var scale = fov/(fov+pixel.z);
		var x2d = pixel.x * scale + w/2;
		var y2d = pixel.y * scale +h/2;
		//marking the points a color - only if they are inside the screen
		if(x2d >= 0 && x2d <= w && y2d >= 0 && y2d <= h) {
			//give points a color
			var c = (Math.round(y2d) * imagedata.width + Math.round(x2d)) * 4;
			imagedata.data[c] = 0; //red
			imagedata.data[c+1] = 255; //green
			imagedata.data[c+2] = 60; //blue
			imagedata.data[c+3] = 255; //alpha
		}
		pixel.z -= 1;
		if(pixel.z < -fov) pixel.z += 2*fov;
	}

	//put imagedata back on the canvas
	ctx.putImageData(imagedata, 0, 0);
}

//animate
setInterval(render, 1000/30);