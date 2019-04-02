'use strict';

const assert = require('assert');

const fixtures = require('../fixtures');
const sharp = require('../../');

const red = { r: 255, g: 0, b: 0, alpha: 0.5 };
const green = { r: 0, g: 255, b: 0, alpha: 0.5 };
const blue = { r: 0, g: 0, b: 255, alpha: 0.5 };

const redRect = {
  create: {
    width: 80,
    height: 60,
    channels: 4,
    background: red
  }
};

const greenRect = {
  create: {
    width: 40,
    height: 40,
    channels: 4,
    background: green
  }
};

const blueRect = {
  create: {
    width: 60,
    height: 40,
    channels: 4,
    background: blue
  }
};

const blends = [
  'over',
  'xor',
  'saturate',
  'dest-over'
];

// Test
describe('composite', () => {
  it('blend', () => Promise.all(
    blends.map(blend => {
      const filename = `composite.blend.${blend}.png`;
      const actual = fixtures.path(`output.${filename}`);
      const expected = fixtures.expected(filename);
      return sharp(redRect)
        .composite([{
          input: blueRect,
          blend
        }])
        .toFile(actual)
        .then(() => {
          fixtures.assertMaxColourDistance(actual, expected);
        });
    })
  ));

  it('multiple', () => {
    const filename = 'composite-multiple.png';
    const actual = fixtures.path(`output.${filename}`);
    const expected = fixtures.expected(filename);
    return sharp(redRect)
      .composite([{
        input: blueRect,
        gravity: 'northeast'
      }, {
        input: greenRect,
        gravity: 'southwest'
      }])
      .toFile(actual)
      .then(() => {
        fixtures.assertMaxColourDistance(actual, expected);
      });
  });

  it('zero offset', done => {
    sharp(fixtures.inputJpg)
      .resize(400)
      .composite([{
        input: fixtures.inputPngWithTransparency16bit,
        top: 0,
        left: 0
      }])
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(3, info.channels);
        fixtures.assertSimilar(fixtures.expected('overlay-offset-0.jpg'), data, done);
      });
  });

  it('offset and gravity', done => {
    sharp(fixtures.inputJpg)
      .resize(400)
      .composite([{
        input: fixtures.inputPngWithTransparency16bit,
        left: 10,
        top: 10,
        gravity: 4
      }])
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(3, info.channels);
        fixtures.assertSimilar(fixtures.expected('overlay-offset-with-gravity.jpg'), data, done);
      });
  });

  it('offset, gravity and tile', done => {
    sharp(fixtures.inputJpg)
      .resize(400)
      .composite([{
        input: fixtures.inputPngWithTransparency16bit,
        left: 10,
        top: 10,
        gravity: 4,
        tile: true
      }])
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(3, info.channels);
        fixtures.assertSimilar(fixtures.expected('overlay-offset-with-gravity-tile.jpg'), data, done);
      });
  });

  it('offset and tile', done => {
    sharp(fixtures.inputJpg)
      .resize(400)
      .composite([{
        input: fixtures.inputPngWithTransparency16bit,
        left: 10,
        top: 10,
        tile: true
      }])
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(3, info.channels);
        fixtures.assertSimilar(fixtures.expected('overlay-offset-with-tile.jpg'), data, done);
      });
  });

  it('cutout via dest-in', done => {
    sharp(fixtures.inputJpg)
      .resize(300, 300)
      .composite([{
        input: Buffer.from('<svg><rect x="0" y="0" width="200" height="200" rx="50" ry="50"/></svg>'),
        density: 96,
        blend: 'dest-in',
        cutout: true
      }])
      .png()
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual('png', info.format);
        assert.strictEqual(300, info.width);
        assert.strictEqual(300, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('composite-cutout.png'), data, done);
      });
  });

  describe('numeric gravity', () => {
    Object.keys(sharp.gravity).forEach(gravity => {
      it(gravity, done => {
        sharp(fixtures.inputJpg)
          .resize(80)
          .composite([{
            input: fixtures.inputPngWithTransparency16bit,
            gravity: gravity
          }])
          .toBuffer((err, data, info) => {
            if (err) throw err;
            assert.strictEqual('jpeg', info.format);
            assert.strictEqual(80, info.width);
            assert.strictEqual(65, info.height);
            assert.strictEqual(3, info.channels);
            fixtures.assertSimilar(fixtures.expected(`overlay-gravity-${gravity}.jpg`), data, done);
          });
      });
    });
  });

  describe('string gravity', () => {
    Object.keys(sharp.gravity).forEach(gravity => {
      it(gravity, done => {
        const expected = fixtures.expected('overlay-gravity-' + gravity + '.jpg');
        sharp(fixtures.inputJpg)
          .resize(80)
          .composite([{
            input: fixtures.inputPngWithTransparency16bit,
            gravity: sharp.gravity[gravity]
          }])
          .toBuffer((err, data, info) => {
            if (err) throw err;
            assert.strictEqual('jpeg', info.format);
            assert.strictEqual(80, info.width);
            assert.strictEqual(65, info.height);
            assert.strictEqual(3, info.channels);
            fixtures.assertSimilar(expected, data, done);
          });
      });
    });
  });

  describe('tile and gravity', () => {
    Object.keys(sharp.gravity).forEach(gravity => {
      it(gravity, done => {
        const expected = fixtures.expected('overlay-tile-gravity-' + gravity + '.jpg');
        sharp(fixtures.inputJpg)
          .resize(80)
          .composite([{
            input: fixtures.inputPngWithTransparency16bit,
            tile: true,
            gravity: gravity
          }])
          .toBuffer((err, data, info) => {
            if (err) throw err;
            assert.strictEqual('jpeg', info.format);
            assert.strictEqual(80, info.width);
            assert.strictEqual(65, info.height);
            assert.strictEqual(3, info.channels);
            fixtures.assertSimilar(expected, data, done);
          });
      });
    });
  });

  describe('validation', () => {
    it('missing images', () => {
      assert.throws(() => {
        sharp().composite();
      }, /Expected array for images to composite but received undefined of type undefined/);
    });

    it('invalid images', () => {
      assert.throws(() => {
        sharp().composite(['invalid']);
      }, /Expected object for image to composite but received invalid of type string/);
    });

    it('missing input', () => {
      assert.throws(() => {
        sharp().composite([{}]);
      }, /Unsupported input/);
    });

    it('invalid blend', () => {
      assert.throws(() => {
        sharp().composite([{ input: 'test', blend: 'invalid' }]);
      }, /Expected valid blend name for blend but received invalid of type string/);
    });

    it('invalid tile', () => {
      assert.throws(() => {
        sharp().composite([{ input: 'test', tile: 'invalid' }]);
      }, /Expected boolean for tile but received invalid of type string/);
    });

    it('invalid left', () => {
      assert.throws(() => {
        sharp().composite([{ input: 'test', left: 0.5 }]);
      }, /Expected positive integer for left but received 0.5 of type number/);
    });

    it('invalid top', () => {
      assert.throws(() => {
        sharp().composite([{ input: 'test', top: -1 }]);
      }, /Expected positive integer for top but received -1 of type number/);
    });

    it('left but no top', () => {
      assert.throws(() => {
        sharp().composite([{ input: 'test', left: 1 }]);
      }, /Expected both left and top to be set/);
    });

    it('top but no left', () => {
      assert.throws(() => {
        sharp().composite([{ input: 'test', top: 1 }]);
      }, /Expected both left and top to be set/);
    });

    it('invalid gravity', () => {
      assert.throws(() => {
        sharp().composite([{ input: 'test', gravity: 'invalid' }]);
      }, /Expected valid gravity for gravity but received invalid of type string/);
    });
  });
});