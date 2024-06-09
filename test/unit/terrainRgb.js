// Copyright 2013 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('terrainRgb', function () {
  it('float32 to terrain rgb', function (done) {
    sharp(fixtures.inputMilfordSound).terrainRgb().keepExif().keepMetadata()
      .toFile("terrainRgb.tif", done);
  });
});
