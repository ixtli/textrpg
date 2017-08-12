global.$ = global.jQuery = require('jquery');
// let foundation = require('../../node_modules/foundation-sites/dist/js/foundation.js');

const glyph = require('./glyph.js');

glyph.size(14);

let cellHeight = 32;
let cellWidth = 32;

const canvas = $('canvas.gc');
const chars = $('canvas.cc');
const ctx = canvas[0].getContext('2d');
const cc_ctx = chars[0].getContext('2d');
const colorMap = ['rgb(117, 144, 133)',
	'rgb(186, 199, 180)', 'rgb(129, 148, 171)'];

let windowWidth, windowHeight, mapX, mapY, fgMap, bgMap;

function rand(max)
{
	return Math.floor(Math.random() * max);
}


let glyphs = [
	glyph.get('あ'),
	glyph.get('X'),
	glyph.get('o'),
	glyph.get('ॵ'),
	glyph.get('ਊ'),
	glyph.get('♞'),
	glyph.get('g'),
	glyph.get('j'),
	glyph.get('᳄'),
	glyph.get('😬'),
	glyph.get('ඐ'),
	glyph.get('ß')
];

const glyphCount = glyphs.length;

function draw()
{
	console.time('draw');
	chars[0].width = chars[0].width;
	for (let y = 0; y < mapY; y++)
	{
		for (let x = 0; x < mapX; x++)
		{
			ctx.fillStyle = colorMap[bgMap[x + y * mapX]];
			ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
			let buffer = glyphs[rand(glyphCount)];
			cc_ctx.drawImage(buffer._buffer,
				(x * cellWidth) + buffer._xOffset,
				(y * cellHeight) + buffer._yOffset);
		}
	}
	console.timeEnd('draw');
}

function resize()
{

	windowWidth = $(window).width();
	windowHeight = $(window).height();
	mapX = Math.floor(windowWidth / cellWidth);
	mapY = Math.floor(windowHeight / cellHeight);
	fgMap = new Uint32Array(mapX * mapY);
	bgMap = new Uint32Array(mapX * mapY);
	canvas[0].width = mapX * cellWidth;
	canvas[0].height = mapY * cellHeight;
	chars[0].width = mapX * cellWidth;
	chars[0].height = mapY * cellHeight;

	for (let i = 0; i < mapX * mapY; i++)
	{
		fgMap[i] = rand(3);
		bgMap[i] = rand(3);
	}

	window.requestAnimationFrame(draw);
}

$(window).on('resize', () =>
{
	resize();
});

resize();

// $(document).foundation();
