global.$ = global.jQuery = require('jquery');

const glyph = require('./glyph.js');

const ZOOM_LEVELS = [
	[4, 2],
	[8, 4],
	[16, 8],
	[32, 16],
	[64, 28],
	[128, 64],
	[256, 128]
];

let _currentZoom = -1;
let _cellSize = 32;

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


let glyphs = null;

function draw()
{
	console.time('draw');
	for (let y = 0; y < mapY; y++)
	{
		for (let x = 0; x < mapX; x++)
		{
			ctx.fillStyle = colorMap[bgMap[x + y * mapX]];
			ctx.fillRect(x * _cellSize, y * _cellSize, _cellSize, _cellSize);
		}
	}

	chars[0].width = chars[0].width;

	if (_cellSize < 8)
	{
		console.timeEnd('draw');
		return;
	}

	let glyphCount = glyphs.length;
	for (let y = 0; y < mapY; y++)
	{
		for (let x = 0; x < mapX; x++)
		{
			let buffer = glyphs[rand(glyphCount)];
			cc_ctx.drawImage(buffer._buffer,
				(x * _cellSize) + buffer._xOffset,
				(y * _cellSize) + buffer._yOffset);
		}
	}
	console.timeEnd('draw');
}

function resize()
{

	windowWidth = $(window).width();
	windowHeight = $(window).height();
	mapX = Math.floor(windowWidth / _cellSize);
	mapY = Math.floor(windowHeight / _cellSize);
	fgMap = new Uint32Array(mapX * mapY);
	bgMap = new Uint32Array(mapX * mapY);
	canvas[0].width = mapX * _cellSize;
	canvas[0].height = mapY * _cellSize;
	chars[0].width = mapX * _cellSize;
	chars[0].height = mapY * _cellSize;

	for (let i = 0; i < mapX * mapY; i++)
	{
		fgMap[i] = rand(3);
		bgMap[i] = rand(3);
	}

	window.requestAnimationFrame(draw);
}

function setZoomLevel(newLevel)
{
	if (newLevel === _currentZoom)
	{
		return;
	}

	const [cell, pt] = ZOOM_LEVELS[newLevel];
	_currentZoom = newLevel;
	_cellSize = cell;
	glyph.size(pt, cell);

	glyphs = [
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
	resize();
}

$(window).on('resize', () =>
{
	resize();
});

$(window).on('click', () =>
{
	_currentZoom++;
	if (_currentZoom >= ZOOM_LEVELS.length)
	{
		_currentZoom = 0;
	}
	setZoomLevel(_currentZoom);
});

$(window).on('keypress', (evt) =>
{
	const code = evt.charCode;
	switch (code)
	{
		case 61: // +
			setZoomLevel(Math.min(_currentZoom + 1, ZOOM_LEVELS.length - 1));
			break;

		case 45: // -
			setZoomLevel(Math.max(_currentZoom - 1, 0));
			break;

		default:
			break;
	}
});

setZoomLevel(2);

