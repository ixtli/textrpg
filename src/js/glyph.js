let _size = 0;
let _sizeStr = '';
let _cellSize = 32;

let style = 'normal';
let variant = 'normal';
let weight = 'normal';
let stretch = 'condensed';
let family = 'sans';
let CSSFont = '';

const DEBUG_DRAW = false;

const glyphCacheSize = 64;
let glyphLRUCache = [];
let glyphCache = {};

function invalidateCache()
{
	glyphCache = {};
	glyphLRUCache = [];
}

function resize(newSize, newCellSize)
{
	_size = newSize;
	_sizeStr = `${_size}pt`;
	_cellSize = newCellSize;
	regenerateCSSFont();
	invalidateCache();
}

function regenerateCSSFont()
{
	CSSFont = `${style} ${variant} ${weight} ${stretch} ${_sizeStr} ${family}`;
}

function getBoundingBox(ctx, width, height)
{
	let ret = {};

	// Get the pixel data from the canvas
	let data = ctx.getImageData(0, 0, width, height).data;
	let first = 0;
	let last = 0;
	let right = 0;
	let left = 0;
	let r = height;
	let c = 0;

	// 1. get bottom
	while (!last && r)
	{
		r--;
		for (c = 0; c < width; c++)
		{
			if (data[r * width * 4 + c * 4 + 3])
			{
				last = r + 1;
				ret.bottom = r + 1;
				break;
			}
		}
	}

	// 2. get top
	r = 0;
	while (!first && r < last)
	{
		for (c = 0; c < width; c++)
		{
			if (data[r * width * 4 + c * 4 + 3])
			{
				first = r - 1;
				ret.top = r - 1;
				ret.height = last - first;
				break;
			}
		}
		r++;
	}

	// 3. get right
	c = width;
	while (!right && c)
	{
		c--;
		for (r = 0; r < height; r++)
		{
			if (data[r * width * 4 + c * 4 + 3])
			{
				right = c + 1;
				ret.right = c + 1;
				break;
			}
		}
	}

	// 4. get left
	c = 0;
	while (!left && c < right)
	{
		for (r = 0; r < height; r++)
		{
			if (data[r * width * 4 + c * 4 + 3])
			{
				left = c;
				ret.left = c;
				ret.width = right - left;
				break;
			}
		}
		c++;

		// If we've got it then return the height
		if (left)
		{
			return ret;
		}
	}

	// We screwed something up...  What do you expect from free code?
	return false;
}

function CachedGlyph(glyph)
{
	this._glyph = glyph;

	// Clear canvas
	const tc = document.createElement('canvas');
	tc.width = tc.height = _cellSize;
	const tcx = tc.getContext('2d');
	tcx.font = CSSFont;
	tcx.fillText(glyph, 5, _cellSize - (_cellSize / 4));
	const bb = getBoundingBox(tcx, _cellSize, _cellSize);

	if (!bb)
	{
		throw new Error("Failed to get bounding box!");
	}

	const w = Math.min(bb.width, _cellSize);
	const h = Math.min(bb.height, _cellSize);

	const canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext('2d');

	this._xOffset = (_cellSize / 2) - Math.ceil(w / 2);
	this._yOffset = (_cellSize / 2) - Math.ceil(h / 2);

	if (DEBUG_DRAW)
	{
		ctx.fillStyle = 'rgba(255,0,0,0.25)';
		ctx.fillRect(0, 0, w, h);
	}

	ctx.drawImage(tc, bb.left, bb.top, w, h, 0, 0, w, h);

	this._buffer = canvas;
	glyphCache[glyph] = this;
	this.use(true);
}

CachedGlyph.prototype.use = (isNew) =>
{
	if (isNew)
	{
		glyphLRUCache.push(this);
		if (glyphLRUCache.length > glyphCacheSize)
		{
			let dropped = glyphLRUCache.pop();
			delete glyphCache[dropped._glyph];
		}
		return;
	}

	const count = glyphLRUCache.length;
	for (let i = 0; i < count; i++)
	{
		if (glyphLRUCache[i] === this)
		{
			glyphLRUCache.splice(i, 1);
			break;
		}
	}

	glyphLRUCache.push(this);
};

module.exports = {
	get (glyph)
	{
		if (_size < 4)
		{
			return null;
		}

		const found = glyphCache[glyph];

		if (found)
		{
			found.use();
			return found;
		}

		return new CachedGlyph(glyph);
	},
	size: resize
};


