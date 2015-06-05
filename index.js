/**
 * PixelNode_Driver_PixelPusher
 * 
 * Pixel Driver for PixelPusher
 * 
 * --------------------------------------------------------------------------------------------------------------------
 * 
 * @author Amely Kling <mail@dwi.sk>
 *
 */


/* Includes
 * ==================================================================================================================== */

var PixelPusher = require('pixelpusher');
var util = require("util");
var colors = require('colors');


/* Class Constructor
 * ==================================================================================================================== */

// extending PixelNode_Driver
PixelNode_Driver = require('pixelnode-driver');

// define the Student class
function PixelNode_Driver_PixelPusher(options,pixelData) {
  var self = this;
  PixelNode_Driver_PixelPusher.super_.call(self, options, pixelData);
  this.className = "PixelNode_Driver_PixelPusher";
}

// class inheritance 
util.inherits(PixelNode_Driver_PixelPusher, PixelNode_Driver);

// module export
module.exports = PixelNode_Driver_PixelPusher;


/* Variables
 * ==================================================================================================================== */

PixelNode_Driver_PixelPusher.prototype.default_options = {
	dimmer: 1,
	gammapow: 2.3
};
PixelNode_Driver_PixelPusher.prototype.controller = {};
PixelNode_Driver_PixelPusher.prototype.strips = [];
PixelNode_Driver_PixelPusher.prototype.gammatable = [];


/* Overriden Methods
 * ==================================================================================================================== */

 // init driver
PixelNode_Driver_PixelPusher.prototype.init = function() {
	var self = this;
	console.log("Init PixelDriver PixelPusher".grey);

	// init gamma table for color correction	
	self.initGammaTable();

	// initialize PixelPusher
	new PixelPusher().on('discover', function(controller) {
		// remember controller
		self.controller = controller;

		// PixelPusher discovered
		console.log('PixelPusher discovered: '.green + JSON.stringify(controller.params.pixelpusher).grey);
		
		// add strips (no logic for multiple pixelpushers yet)
		for (var i = 0; i < controller.params.pixelpusher.numberStrips; i++) {
			self.strips.push({ number:i, data: new Buffer(3 * self.controller.params.pixelpusher.pixelsPerStrip) });
		}

		// start the painter 
		self.startPainter.call(self);


	}).on('error', function(err) {
		console.log(('PixelPusher Error: ' + err.message).red);
	});  


};


// set's a pixel via PixelPusher 
PixelNode_Driver_PixelPusher.prototype.setPixel = function(strip_num, id, r,g,b) {
	var self = this;
	if (strip_num < self.strips.length && id < self.controller.params.pixelpusher.pixelsPerStrip) {
		// get strip
		var strip = self.strips[strip_num];

		// set pixel data 
		// - each data point one RGB value
		// - gammatable for color correction
		// - dimmer for general darkening (power save)

		strip.data[id*3] =   self.gammatable[	parseInt(r * self.options.dimmer)	];
		strip.data[id*3+1] = self.gammatable[	parseInt(g * self.options.dimmer)	];
		strip.data[id*3+2] = self.gammatable[	parseInt(b * self.options.dimmer)	];
	}
}


// tells PixelPusher to write pixels
PixelNode_Driver_PixelPusher.prototype.sendPixels = function() {
	var self = this;

	// send each strip on its own to prevent to big udp-packagesize
	self.strips.forEach(function(strip) {
		self.controller.refresh([strip]);	
	});
}



/* Methods
 * ==================================================================================================================== */

// init gamma table for correcting color values
PixelNode_Driver_PixelPusher.prototype.initGammaTable = function() {
	var self = this;

	// thanks PhilB for this gamma table!
	// it helps convert RGB colors to what humans see
	for (i=0; i<256; i++) {
	  var x = i;
	  x = x / 255;
	  x = Math.pow(x, self.options.gammapow);
	  x = x * 255;
	    
	  self.gammatable[i] = Math.round(x);      
	}

}

