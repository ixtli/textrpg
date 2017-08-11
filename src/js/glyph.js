let _size = 0;
let _sizeStr = '';
let _height = 32;
let _width = 32;

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

function resizeGlyph(newSize)
{
	// regen height
	_size = newSize;
	_sizeStr = `${_size}pt`;

	regenerateCSSFont();
	invalidateCache();
}

function regenerateCSSFont()
{
	CSSFont = `${style} ${variant} ${weight} ${stretch} ${_sizeStr} ${family}`;
}

function isASCII(str)
{
	return (/^[\x00-\x7F]*$/).test(str);
}

function isExtendedASCII(str)
{
	return (/^[\x00-\xFF]*$/).test(str);
}

function CachedGlyph(glyph)
{
	this._glyph = glyph;
	this._isASCII = isASCII(glyph);
	this._isExtendedASCII = isExtendedASCII(glyph);

	const canvas = document.createElement('canvas');
	canvas.height = _width - 4;
	canvas.width = _height - 4;

	const ctx = canvas.getContext('2d');
	ctx.font = CSSFont;
	const textWidth = Math.ceil(ctx.measureText(glyph).width);
	this._xOffset = (_width / 2) - Math.ceil(textWidth / 2);

	const height = _size + (_height / 4);

	if (DEBUG_DRAW)
	{
		ctx.fillStyle = 'rgba(255,0,0,0.25)';
		ctx.fillRect(0, 0, textWidth, height);
	}

	ctx.fillStyle = 'black';
	ctx.fillText(glyph, 0, height - Math.ceil(_height / 8) + 2);

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
		const found = glyphCache[glyph];

		if (found)
		{
			found.use();
			return found;
		}

		return new CachedGlyph(glyph);
	},
	size(newSize)
	{
		if (!newSize)
		{
			return _size;
		}

		resizeGlyph(newSize);
	}
};


