(function() {

	var canvas = document.querySelector('canvas');
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	var context = canvas.getContext('2d');

	/////////////////////////////////////////////////////

	// Complex number class for rendering the set
	function Complex(r, i) {
		this.r = r; // Real
		this.i = i; // Imaginary
	}

	Complex.prototype.add = function(other) {
		this.r += other.r;
		this.i += other.i;

		return this;
	};

	// Binomial multiplication process (first, inner, outer, last)
	Complex.prototype.multiply = function(other) {

		// (real * real) and (imaginary * imaginary) result in real numbers
		var r = (this.r * other.r) - (this.i * other.i);

		// (real * imaginary) and (imaginary * real) result in imaginary numbers
		var i = (this.r * other.i) + (this.i * other.r);

		this.r = r;
		this.i = i;

		return this;
	};

	//////////////////////////////////////////////////

	// Main
	window.onload = function() {

		var settings = {
			scale: -2.5,
			posX: canvas.width / 2,
			posY: canvas.height / 2,
			detail: 20,
			iterations: 50,
			tolerance: -2
		};

		var gui = new dat.GUI();
		gui.add(settings, 'scale', -4, -2).listen();
		gui.add(settings, 'posX').listen();
		gui.add(settings, 'posY').listen();
		gui.add(settings, 'detail', 1, 20).listen();
		gui.add(settings, 'iterations', 1, 100).listen();
		gui.add(settings, 'tolerance', -3, 1).listen();

		var update = true;
		window.abort = false;
		function change() { update = true; window.abort = true; }
		for(var i in gui.__controllers) {
			gui.__controllers[i].onChange(change);
		}

		// Regions
		var regions = calculateRegions();

		window.onresize = function() {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
			regions = calculateRegions();
			update = true;
			window.abort = true;
		};

		(function loop() {

			if(update) {
				settings.detail = 20;
				update = false;
			}

			if(--settings.detail === 0) {
				settings.detail = 1;
				window.setTimeout(loop, 0);
			} else {
				renderFrame(regions.slice(), settings, function() {
					window.setTimeout(loop, 0);
				});
			}
		})();
	};

	function renderRegion(settings, x1, y1, x2, y2) {
		settings.detail = Math.floor(settings.detail);
		var scale = Math.pow(10, settings.scale),
			tolerance = Math.pow(10, settings.tolerance);

		var l, c = new Complex(), z = new Complex();

		// Loop through every pixel on the screen
		for(var x = x1; x1 <= x2; x1 += settings.detail) {
			for(var y = y1; y <= y2; y += settings.detail) {

				rx = (x1 - settings.posX) * scale;
				ry = (y - settings.posY) * scale;

				// This is where the magic happens
				c.r = rx;
				c.i = ry;
				z.r = z.i = 0;

				l = 0;
				for(var i = 0; i < settings.iterations; i++) {
					z.multiply(z).add(c);

					if(Math.pow(z.r, 2) + Math.pow(z.i, 2) < tolerance) {
						l = i / settings.iterations;
						break;
					}
				}

				// Pixel colors
				l = Math.floor(l * 0xFF);
				context.fillStyle = 'rgb(' + l + ',' + l + ',' + l + ')';

				context.fillRect(x1, y, settings.detail, settings.detail);
			}
		}
	}

	function renderFrame(regions, settings, callback) {
		if(regions.length) {
			var r = regions.shift();

			renderRegion(settings, r[0], r[1], r[2], r[3]);

			if(window.abort) {
				window.abort = false;
				callback();
				return;
			}

			if(settings.detail < 5) {
				window.setTimeout(function() {
					renderFrame(regions, settings, callback);
				}, 0);
			} else {
				renderFrame(regions, settings, callback);
			}
			
		} else {
			callback();
		}
	}

	// Will split up the whole frame into ~300px by ~300px regions to render
	// one at a time. This is used for higher resolutions to increase responsiveness.
	function calculateRegions() {
		var regions = [];

		var numX = Math.ceil(canvas.width / 300),
			numY = Math.ceil(canvas.height / 300);

		var width = canvas.width / numX,
			height = canvas.height / numY;

		for(var x = 0; x < numX; x++) {
			for(var y = 0; y < numY; y++) {
				regions.push(
					[x * width, 
					y * height, 
					(x * width) + width,
					(y * height) + height]
				);
			}
		}

		return regions;
	}
})();